import { ShoppingBag, Menu, Search, User } from "lucide-react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
}

const Navbar = ({ cartCount, onCartClick }: NavbarProps) => {
  const router = useRouter();
  
  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push("/")} className="font-display text-2xl font-bold tracking-tight hover:text-primary transition-colors">
              Deanna
            </button>
            <div className="hidden md:flex items-center gap-6">
              <Link href="#" className="text-sm font-semibold hover:text-primary transition-colors">
                New Arrivals
              </Link>
              <Link href="#" className="text-sm font-semibold hover:text-primary transition-colors">
                Collections
              </Link>
              <button 
                onClick={() => router.push("/virtual-try-on")}
                className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                Virtual Try-On
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden md:inline-flex">
              <User className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="relative" onClick={onCartClick}>
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {cartCount}
                </Badge>
              )}
            </Button>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;