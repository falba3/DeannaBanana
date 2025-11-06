import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProductCard from "@/components/ProductCard";
import Cart from "@/components/Cart";
import { toast } from "sonner";
import { getImageFileNames } from '../lib/image-utils';

interface ClothingItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

interface IndexProps {
  clothingImages: string[];
  peopleImages: string[];
}

const Index = ({ clothingImages, peopleImages }: IndexProps) => {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Create clothing items with dummy data for now
  const clothingItems: ClothingItem[] = clothingImages.map((imageName, index) => ({
    id: `clothing-${index}`,
    name: imageName.replace(/\.(jpg|jpeg|png|gif|webp)$/i, '').replace(/-/g, ' '),
    price: 50,
    image: `/clothes/${imageName}`,
    category: "Apparel",
  }));

interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

  const handleAddToCart = (productId: string) => {
    const product = clothingItems.find(p => p.id === productId);
    if (!product) return;

    setCartItems(prev => {
      const existingItem = prev.find(item => item.id === productId);
      if (existingItem) {
        toast.success("Updated quantity in cart");
        return prev.map(item =>
          item.id === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      toast.success("Added to cart");
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemove = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
    toast.success("Removed from cart");
  };

  const handleTryNow = () => {
    router.push("/virtual-try-on");
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-background">
      <Navbar cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      
      <Hero onTryNowClick={handleTryNow} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-12" id="products">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-4xl font-bold mb-2 tracking-tight">New Arrivals</h2>
              <p className="text-muted-foreground font-medium">Discover our latest collection</p>
            </div>
            <Link href="#" className="text-sm font-semibold text-primary hover:underline hidden sm:block">
              View All →
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 lg:gap-8">
            {clothingItems.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
        </div>

        <section className="py-16 px-6 sm:px-12 bg-gradient-brand rounded-3xl text-white text-center shadow-strong">
          <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
            Try Our Virtual Styling
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto font-medium">
            See how any piece from our collection looks on you with AI-powered visualization
          </p>
          <button 
            onClick={handleTryNow}
            className="bg-white text-foreground px-8 py-3 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-strong hover:shadow-medium"
          >
            Start Virtual Try-On
          </button>
        </section>
      </main>

      <footer className="border-t bg-muted/30 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-display text-xl font-bold mb-4">Deanna</h3>
              <p className="text-sm text-muted-foreground font-medium">
                AI-powered fashion for everyone
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Shop</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">New Arrivals</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Collections</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Sale</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Shipping</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Returns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-foreground transition-colors">Press</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© 2025 Deanna. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemove}
      />
    </div>
  );
};

export default Index;

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
