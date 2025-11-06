import { Download, Share2, ShoppingCart, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { useRouter } from "next/router"; 

interface Result {
  id: string;
  image: string;
  clothing: string;
}

interface StepThreeProps {
  results: Result[];
  selectedClothing: string[];
  uploadedImage: string | null;
}

const StepThree = ({ results, selectedClothing, uploadedImage }: StepThreeProps) => {
  const router = useRouter();

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

  return (
    <div>
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl font-bold mb-4 tracking-tight">Your Virtual Try-On Results</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
          See how great you look in these items! Download your favorites or add them to your cart.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {results.map((result) => (
          <div
            key={result.id}
            className="group relative rounded-2xl overflow-hidden bg-card shadow-product hover:shadow-product-hover transition-all"
          >
            <div className="aspect-[3/4] relative">
              <img
                src={result.image}
                alt={`Try-on result for ${result.clothing}`}
                className="w-full h-full object-cover"
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
                    <Button size="sm" variant="secondary">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold">{result.clothing}</h3>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
};

export default StepThree;
