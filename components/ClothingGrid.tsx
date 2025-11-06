import { useState } from "react";
import { cn } from "../lib/utils";
import { Check } from "lucide-react";

interface ClothingItem {
  id: string;
  name: string;
  image: string;
}

interface ClothingGridProps {
  items: ClothingItem[];
  selectedItems: string[];
  onSelectionChange: (items: string[]) => void;
}

const ClothingGrid = ({ items, selectedItems, onSelectionChange }: ClothingGridProps) => {
  const handleItemClick = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      onSelectionChange(selectedItems.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedItems, itemId]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item.id);
        return (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={cn(
              "relative aspect-square rounded-2xl overflow-hidden transition-all duration-300 hover:scale-105",
              "bg-card shadow-sm hover:shadow-lg",
              isSelected && "ring-4 ring-primary shadow-xl"
            )}
          >
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute top-2 right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-medium">{item.name}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default ClothingGrid;
