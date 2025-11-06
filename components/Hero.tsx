import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface HeroProps {
  onTryNowClick: () => void;
}

const Hero = ({ onTryNowClick }: HeroProps) => {
  return (
    <section className="relative h-[600px] bg-gradient-brand overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200')] bg-cover bg-center opacity-15" />
      <div className="absolute inset-0 bg-gradient-overlay" />
      
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl">
          <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight tracking-tight">
            Try Before<br />You Buy
          </h2>
          <p className="text-xl text-white/90 mb-8 leading-relaxed font-medium">
            Experience the future of fashion with AI-powered virtual try-on. 
            See how our collection looks on you instantly.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button 
              size="lg" 
              className="bg-white text-foreground hover:bg-white/90 font-semibold px-8 shadow-strong"
              onClick={onTryNowClick}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Try Virtual Styling
            </Button>
            <Button 
              size="lg" 
              className="bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 hover:bg-white/20 font-semibold px-8"
            >
              Shop Collection
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
