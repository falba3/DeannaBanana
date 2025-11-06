import { Sparkles } from "lucide-react";

const Header = () => {
  return (
    <header className="w-full py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif text-2xl font-bold text-foreground">Deanna</span>
        </div>
        <h1 className="font-serif text-xl sm:text-2xl font-semibold text-foreground">
          Virtual Try-On
        </h1>
      </div>
    </header>
  );
};

export default Header;
