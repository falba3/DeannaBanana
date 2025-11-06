import { useState } from "react";
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import StepOne from "@/components/try-on/StepOne";
import StepTwo from "@/components/try-on/StepTwo";
import StepThree from "@/components/try-on/StepThree";
import { getImageFileNames } from '../lib/image-utils';

interface ClothingItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface VirtualTryOnProps {
  clothingImages: string[];
  peopleImages: string[];
}

const VirtualTryOn = ({ clothingImages, peopleImages }: VirtualTryOnProps) => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedClothing, setSelectedClothing] = useState<string[]>([]);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);

  // Create clothing items with dummy data for now
  const clothingItems: ClothingItem[] = clothingImages.map((imageName, index) => ({
    id: `clothing-${index}`,
    name: imageName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/-/g, ' '),
    price: 50 + (index * 10),
    image: `/clothes/${imageName}`,
    category: "Apparel",
  }));

  const steps = [
    { number: 1, title: "Choose Clothes", description: "Select items to try on" },
    { number: 2, title: "Upload Photo", description: "Add your photo" },
    { number: 3, title: "View Results", description: "See your virtual try-on" },
  ];

  const progress = (currentStep / steps.length) * 100;

  const canProceedFromStep1 = selectedClothing.length > 0;
  const canProceedFromStep2 = uploadedImage !== null;

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      router.push("/");
    }
  };

  const handleGenerate = (results: any[]) => {
    setGeneratedResults(results);
    setCurrentStep(3);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </Button>
            <h1 className="font-serif text-xl font-bold">Virtual Try-On</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-muted/30 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Progress value={progress} className="mb-6" />
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold mb-2 transition-colors ${
                      currentStep > step.number
                        ? "bg-primary text-primary-foreground"
                        : currentStep === step.number
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-4 transition-colors ${
                      currentStep > step.number ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentStep === 1 && (
          <StepOne
            clothingImages={clothingImages}
            selectedClothing={selectedClothing}
            onSelectionChange={setSelectedClothing}
          />
        )}
        {currentStep === 2 && (
          <StepTwo
            clothingItems={clothingItems}
            peopleImages={peopleImages}
            uploadedImage={uploadedImage}
            onImageUpload={setUploadedImage}
            selectedClothing={selectedClothing}
            onGenerate={handleGenerate}
          />
        )}
        {currentStep === 3 && (
          <StepThree
            results={generatedResults}
            selectedClothing={selectedClothing}
            uploadedImage={uploadedImage}
          />
        )}
      </main>

      {/* Navigation Footer */}
      {currentStep !== 3 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? "Back to Shop" : "Previous"}
              </Button>
              {currentStep === 1 && (
                <Button
                  disabled={!canProceedFromStep1}
                  onClick={handleNext}
                  size="lg"
                >
                  Continue to Photo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualTryOn;

export async function getStaticProps() {
  const clothingImages = await getImageFileNames('clothes');
  const peopleImages = await getImageFileNames('people');

  return {
    props: {
      clothingImages,
      peopleImages,
    },
  };
}
