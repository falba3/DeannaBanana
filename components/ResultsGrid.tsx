import { Download, Share2 } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface Result {
  id: string;
  image: string;
  clothing: string;
}

interface ResultsGridProps {
  results: Result[];
}

const ResultsGrid = ({ results }: ResultsGridProps) => {
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

  if (results.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mx-auto mt-12">
      <h2 className="font-serif text-3xl font-bold text-foreground mb-6">Your Results</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result) => (
          <div
            key={result.id}
            className="group relative aspect-[3/4] rounded-2xl overflow-hidden bg-card shadow-md hover:shadow-xl transition-all duration-300"
          >
            <img
              src={result.image}
              alt={`Try-on result for ${result.clothing}`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-4 flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleDownload(result.image, result.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => handleShare(result.image)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultsGrid;
