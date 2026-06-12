import { Compass } from "lucide-react";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto flex flex-col gap-6 px-4 py-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading text-sm font-bold">SmartSpend Trip AI</span>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">Intelligent travel planning for budget-conscious trips.</p>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <a href="#trip-planner" className="transition-colors hover:text-foreground">Planner</a>
            <a href="#platform-stack" className="transition-colors hover:text-foreground">Platform</a>
            <a href="#features" className="transition-colors hover:text-foreground">Capabilities</a>
            <a href="#nearby-finder" className="transition-colors hover:text-foreground">Nearby</a>
            <a href="#reviews" className="transition-colors hover:text-foreground">Reviews</a>
          </div>
          <p className="text-sm text-muted-foreground">Copyright &copy; {year} SmartSpend Trip AI. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
