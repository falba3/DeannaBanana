import { useState } from "react";
import { Upload, Sparkles, Loader2, X } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

interface ClothingItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface StepTwoProps {
  clothingItems: ClothingItem[];
  peopleImages: string[];
  uploadedImage: string | null;
  onImageUpload: (image: string) => void;
  selectedClothing: string[];
  onGenerate: (results: any[]) => void;
  onBookCreate: (bookId: number) => void; // New prop for bookId setter
}

const StepTwo = ({ clothingItems, peopleImages, uploadedImage, onImageUpload, selectedClothing, onGenerate, onBookCreate }: StepTwoProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  // Removed local bookId state as it's now managed by the parent
  // const [bookId, setBookId] = useState<number | null>(null);

  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onImageUpload(reader.result as string);
      toast.success("Photo uploaded successfully!");
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    setIsGenerating(true);
    toast.loading("Creating your virtual try-on...", { id: "generating" });

    try {
      const clothImageNames = selectedClothing.map(id => {
        const item = clothingItems.find(c => c.id === id);
        return item ? item.image : ''; // Get the image path from clothingItems
      }).filter(Boolean);

      if (clothImageNames.length === 0) {
        toast.error("Please select at least one clothing item.", { id: "generating" });
        setIsGenerating(false);
        return;
      }

      // 1. Create the book first
      const createBookResponse = await fetch('/api/create-book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cloth: clothImageNames[0], // Use the first selected cloth for book naming
          person: uploadedImage,
        }),
      });

      if (!createBookResponse.ok) {
        const errorData = await createBookResponse.json();
        throw new Error(errorData.error || "Failed to create book");
      }

      const { bookId: newBookId, bookSlug } = await createBookResponse.json();
      onBookCreate(newBookId); // Call the prop to update bookId in parent


      const allGeneratedResults: any[] = [];

      for (const selectedClothPath of clothImageNames) {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            cloth: selectedClothPath,
            person: uploadedImage, // uploadedImage is already a data URL
            book_id: newBookId, // Pass the newly created book ID
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate image");
        }

        const data = await response.json();
        const generatedImagePart = data.image;

        if (!generatedImagePart || !generatedImagePart.inlineData) {
          throw new Error("Invalid response from generation API");
        }

        const generatedImageUrl = `data:${generatedImagePart.inlineData.mimeType};base64,${generatedImagePart.inlineData.data}`;

        const clothingId = clothingItems.find(item => item.image === selectedClothPath)?.id || selectedClothPath;
        const clothingName = clothingItems.find(item => item.image === selectedClothPath)?.name || "";

        allGeneratedResults.push({
          id: `${clothingId}-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          image: generatedImageUrl,
          clothing: clothingName,
        });
      }

      onGenerate(allGeneratedResults);
      const bookUrl = `https://www.deanna2u.com/men_s_fashion/${bookSlug}`;
      toast.success(
        <div className="flex flex-col">
          <span>Here's a ministore with your generated photos!</span>
          <a href={bookUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            {bookUrl}
          </a>
        </div>,
        { id: "generating", duration: 60000 } // Set duration to 1 minute
      );
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate virtual try-on.", { id: "generating" });
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedProducts = clothingItems.filter((p) => selectedClothing.includes(p.id));

  return (
    <div className="pb-24">
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl font-bold mb-4 tracking-tight">Upload Your Photo</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
          Upload a clear photo of yourself to see how the selected items look on you
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Upload Area */}
        <div>
          <h3 className="font-semibold mb-4">Your Photo</h3>
          {!uploadedImage ? (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
              className={`relative aspect-[3/4] rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary hover:bg-muted/50"
              }`}
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-full bg-gradient-brand-soft flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div className="text-center px-4">
                <p className="font-semibold mb-1">Upload your photo</p>
                <p className="text-sm text-muted-foreground">
                  Drag and drop or click to browse
                </p>
              </div>
            </label>
          ) : (
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <img src={uploadedImage} alt="Uploaded" className="w-full h-full object-cover" />
              <button
                onClick={() => onImageUpload(null as any)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Selected Items */}
        <div>
          <h3 className="font-semibold mb-4">Selected Items ({selectedProducts.length})</h3>
          <div className="space-y-4">
            {selectedProducts.map((product) => (
              <div key={product.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{product.name}</h4>
                </div>
              </div>
            ))}
          </div>

          {uploadedImage && (
            <Button
              size="lg"
              className="w-full mt-8"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Virtual Try-On
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepTwo;
