import { Download, Share2, ShoppingCart, RotateCcw, Sparkles, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/router";
import { useState } from "react";
import Image from "next/image"; // Import Next.js Image component for optimization
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"; // Import Dialog components

// Define SCENES array (copy from app/api/generate-situations/route.ts)
const SCENES = [
  {
    id: "subway",
    title: "Subway sprint",
  },
  {
    id: "cafe",
    title: "Coffee break",
  },
  {
    id: "gym",
    title: "Gym floor",
  },
];

interface SituationImage {
  id: string;
  title: string;
  s3Url: string;
}

interface Result {
  id: string;
  image: string;
  clothing: string;
  clothingId?: string; // Optional property for original clothing ID
  generatedSituations?: SituationImage[]; // Optional property for generated situations
  isGeneratingSituations?: boolean; // Loading state for situations
}

interface ClothingItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  buyUrl: string;
  category: string;
}

interface StepThreeProps {
  results: Result[];
  selectedClothing: string[];
  uploadedImage: string | null;
  bookId: number | null; // New prop for bookId
  clothingItems: ClothingItem[];
}

const StepThree = ({ results, selectedClothing, uploadedImage, bookId, clothingItems }: StepThreeProps) => {
  const router = useRouter();
  const [tryOnResults, setTryOnResults] = useState<Result[]>(results); // Use local state to manage results

  const [isZoomDialogOpen, setIsZoomDialogOpen] = useState(false);
  const [zoomImageUrl, setZoomImageUrl] = useState('');
  const [zoomImageTitle, setZoomImageTitle] = useState('');

  const handleDownload = (imageUrl: string, id: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `deanna-tryon-${id}.png`;
    link.click();
    toast.success("Image downloaded successfully");
  };

  const handleShare = async (imageUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Deanna Virtual Try-On",
          text: "Check out this virtual try-on result!",
          url: imageUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(imageUrl);
      toast.success("Link copied to clipboard");
    }
  };

  const handleTryAgain = () => {
    router.push("/virtual-try-on");
  };

  const handleShopNow = () => {
    router.push("/");
  };

  const handleGenerateSituations = async (resultId: string, baseImage: string) => {
    if (!bookId) {
      toast.error("Book ID is missing. Cannot generate situations.", { id: `situations-${resultId}` });
      return;
    }

    setTryOnResults(prevResults =>
      prevResults.map(res =>
        res.id === resultId ? { ...res, isGeneratingSituations: true, generatedSituations: [] } : res // Reset situations and set loading
      )
    );
    toast.loading("Starting situation generation...", { id: `situations-main-${resultId}` });

    // Iterate through SCENES and make individual API calls
    for (const scene of SCENES) {
      toast.loading(`Generating ${scene.title}...`, { id: `situation-${resultId}-${scene.id}` });
      try {
        const response = await fetch('/api/generate-situations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            baseImage,
            book_id: bookId,
            clothing_id: resultId,
            sceneId: scene.id, // Pass the specific scene ID
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to generate ${scene.title}`);
        }

        const data = await response.json();
        const newSituationImage: SituationImage = data.image; // API now returns a single image

        // Update state incrementally for each generated situation
        setTryOnResults(prevResults =>
          prevResults.map(res =>
            res.id === resultId
              ? {
                ...res,
                generatedSituations: [...(res.generatedSituations || []), newSituationImage],
              }
              : res
          )
        );
        toast.success(`${scene.title} generated!`, { id: `situation-${resultId}-${scene.id}` });

      } catch (error: any) {
        console.error(`Error generating ${scene.title}:`, error);
        toast.error(error.message || `Failed to generate ${scene.title}.`, { id: `situation-${resultId}-${scene.id}` });
      }
    }

    // After loop, set isGeneratingSituations to false
    setTryOnResults(prevResults =>
      prevResults.map(res =>
        res.id === resultId ? { ...res, isGeneratingSituations: false } : res
      )
    );
    toast.success("All situations generated!", { id: `situations-main-${resultId}` });
  };

  const handleImageClick = (imageUrl: string, title: string) => {
    setZoomImageUrl(imageUrl);
    setZoomImageTitle(title);
    setIsZoomDialogOpen(true);
  };

  const handleBuy = (clothingId?: string) => {
    if (!clothingId) {
      toast.error("Product information is missing");
      return;
    }
    const item = clothingItems.find(p => p.id === clothingId);
    if (item?.buyUrl) {
      window.open(item.buyUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.error("Buy link not available for this item");
    }
  };

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl font-bold mb-4 tracking-tight">Your Virtual Try-On Results</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
          See how great you look in these items! Download your favorites or add them to your cart.
        </p>
      </div>

      <div className="grid sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-12"> {/* Changed grid to allow more space for situations */}
        {tryOnResults.map((result) => (
          <div
            key={result.id}
            className="group relative rounded-2xl overflow-hidden bg-card shadow-product hover:shadow-product-hover transition-all flex flex-col"
          >
            <div className="aspect-[3/4] relative">
              <Image // Use Next.js Image component for optimization
                src={result.image}
                alt={`Try-on result for ${result.clothing}`}
                fill
                style={{ objectFit: "cover" }}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-full"
                    onClick={() => handleDownload(result.image, result.id)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleShare(result.image)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBuy(result.clothingId)}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 flex-grow"> {/* flex-grow to ensure consistent card height */}
              <h3 className="font-semibold text-lg mb-2">{result.clothing}</h3>
              {!result.generatedSituations && !result.isGeneratingSituations && (
                <Button
                  className="w-full mt-2"
                  onClick={() => handleGenerateSituations(result.id, result.image)}
                  disabled={result.isGeneratingSituations}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  More Photos Wearing This Item
                </Button>
              )}
              {result.isGeneratingSituations && (
                <div className="w-full mt-2 flex items-center justify-center text-primary-foreground bg-primary py-2 px-4 rounded-md">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Situations...
                </div>
              )}
              {result.generatedSituations && result.generatedSituations.length > 0 && (
                <div className="mt-4 border-t pt-4">
                  <h4 className="font-medium text-md mb-2">In Different Scenes:</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {result.generatedSituations.map(situation => (
                      <button // Changed div to button for clickability
                        key={situation.id}
                        onClick={() => handleImageClick(situation.s3Url, situation.title)}
                        className="relative aspect-square rounded-md overflow-hidden bg-muted cursor-pointer"
                      >
                        <Image
                          src={situation.s3Url}
                          alt={situation.title}
                          fill
                          style={{ objectFit: "cover" }}
                          sizes="100px" // Smaller size for thumbnails
                          className="hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1">
                          {situation.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {bookId && (
        <div className="mb-12 flex flex-col items-center">
          <div className="text-center mb-6">
            <h3 className="font-display text-2xl font-bold mb-2 tracking-tight">Your Personal Ministore</h3>
            <p className="text-muted-foreground font-medium">Explore your generated collection in our interactive widget</p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-border bg-card shadow-strong p-1 bg-gradient-to-b from-border/50 to-background">
            <iframe
              width="275"
              height="460.5"
              src={`https://www.deanna2u.com/widget/single-book?message=&width=275&bookId=${bookId}&new_design=1`}
              className="mx-auto block sm:scale-110 md:scale-125 my-8 md:my-12 lg:my-16"
              style={{ border: 'none' }}
              title="Deanna2u Ministore Widget"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button size="lg" variant="outline" onClick={handleTryAgain}>
          <RotateCcw className="w-5 h-5 mr-2" />
          Try Different Items
        </Button>
        <Button size="lg" onClick={handleShopNow}>
          <ShoppingCart className="w-5 h-5 mr-2" />
          Shop Collection
        </Button>
      </div>

      {/* Zoom Dialog */}
      <Dialog open={isZoomDialogOpen} onOpenChange={setIsZoomDialogOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{zoomImageTitle}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-square md:aspect-video">
            {zoomImageUrl && (
              <Image
                src={zoomImageUrl}
                alt={zoomImageTitle}
                fill
                style={{ objectFit: "contain" }}
                sizes="(max-width: 768px) 100vw, 800px"
                className="p-4"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StepThree;
