import { useState } from "react";
import { cn } from "../lib/utils";
import { Upload, Check } from "lucide-react";

interface Model {
  id: string;
  name: string;
  image: string;
}

interface ModelGridProps {
  models: Model[];
  selectedModel: string | null;
  uploadedImage: string | null;
  onModelSelect: (modelId: string) => void;
  onImageUpload: (image: string) => void;
}

const ModelGrid = ({
  models,
  selectedModel,
  uploadedImage,
  onModelSelect,
  onImageUpload,
}: ModelGridProps) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(reader.result as string);
        onModelSelect("uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      <label
        className={cn(
          "relative aspect-square rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105",
          "bg-gradient-card shadow-sm hover:shadow-lg border-2 border-dashed border-border hover:border-primary",
          selectedModel === "uploaded" && "ring-4 ring-primary shadow-xl border-solid"
        )}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4">
          {uploadedImage ? (
            <>
              <img
                src={uploadedImage}
                alt="Uploaded"
                className="w-full h-full object-cover absolute inset-0"
              />
              {selectedModel === "uploaded" && (
                <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg z-10">
                  <Check className="w-5 h-5 text-primary-foreground" />
                </div>
              )}
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground text-center">
                Upload Image
              </span>
            </>
          )}
        </div>
      </label>

      {models.map((model) => {
        const isSelected = selectedModel === model.id;
        return (
          <button
            key={model.id}
            onClick={() => onModelSelect(model.id)}
            className={cn(
              "relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105",
              "bg-card shadow-sm hover:shadow-lg",
              isSelected && "ring-4 ring-primary shadow-xl"
            )}
          >
            <img
              src={model.image}
              alt={model.name}
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-medium">{model.name}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ModelGrid;
