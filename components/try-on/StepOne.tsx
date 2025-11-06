import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface ClothingItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface StepOneProps {
  clothingImages: string[];
  selectedClothing: string[];
  onSelectionChange: (items: string[]) => void;
}

const StepOne = ({ clothingImages, selectedClothing, onSelectionChange }: StepOneProps) => {
  // Create clothing items with dummy data for now
  const clothingItems: ClothingItem[] = clothingImages.map((imageName, index) => ({
    id: `clothing-${index}`,
    name: imageName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/-/g, ' '),
    price: 50,
    image: `/clothes/${imageName}`,
    category: "Apparel",
  }));

  const handleItemClick = (itemId: string) => {
    if (selectedClothing.includes(itemId)) {
      onSelectionChange(selectedClothing.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedClothing, itemId]);
    }
  };

  return (
    <div className="pb-24">
      <div className="text-center mb-12">
        <h2 className="font-serif text-4xl font-bold mb-4">Choose Your Items</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Select one or more items from our collection to see how they look on you
        </p>
        {selectedClothing.length > 0 && (
          <p className="mt-4 text-sm font-medium text-primary">
            {selectedClothing.length} {selectedClothing.length === 1 ? "item" : "items"} selected
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {clothingItems.map((item) => {
          const isSelected = selectedClothing.includes(item.id);
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={cn(
                "group relative text-left transition-all duration-300",
                isSelected && "scale-95"
              )}
            >
              <div
                className={cn(
                  "relative aspect-[3/4] rounded-lg overflow-hidden mb-4 transition-all duration-300",
                  "shadow-product hover:shadow-product-hover",
                  isSelected && "ring-4 ring-primary"
                )}
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-t from-black/60 to-transparent transition-opacity",
                    isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  )}
                />
                {isSelected && (
                  <div className="absolute top-4 right-4 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg animate-scale-in">
                    <Check className="w-6 h-6 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground">${item.price}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default StepOne;
