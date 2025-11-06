"use client";
import Image from "next/image";


import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ShoppingCart, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  onAddToCart: (id: string) => void;
}

const ProductCard = ({ id, name, price, image, category, onAddToCart }: ProductCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] mb-4 overflow-hidden rounded-lg bg-muted">

        <Image
          src={image}
          alt={name}
          width={500} // Placeholder, adjust as needed
          height={500} // Placeholder, adjust as needed
          className={cn(
            "w-full h-full object-cover transition-all duration-500 group-hover:scale-105",
            imageLoaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setImageLoaded(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        <button
          onClick={() => setIsLiked(!isLiked)}
          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
        >
          <Heart className={cn("w-5 h-5", isLiked && "fill-red-500 text-red-500")} />
        </button>
        
        <Badge className="absolute top-4 left-4 bg-secondary text-secondary-foreground">
          {category}
        </Badge>

        <Button
          size="sm"
          className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0"
          onClick={() => onAddToCart(id)}
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Add to Cart
        </Button>
      </div>

      <div className="space-y-1">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>
        <p className="text-lg font-bold">${price}</p>
      </div>
    </div>
  );
};

export default ProductCard;