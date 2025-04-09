
import { ReactNode } from "react";
import Navigation from "./Navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  hideNavigation?: boolean;
}

const Layout = ({ children, hideNavigation = false }: LayoutProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className={cn(
        "mx-auto max-w-md bg-white min-h-screen relative",
        isMobile ? "" : "border-x shadow-md"
      )}>
        <main className={hideNavigation ? "pb-0" : "pb-16"}>
          {children}
        </main>
        
        {!hideNavigation && <Navigation />}
      </div>
    </div>
  );
};

export default Layout;
