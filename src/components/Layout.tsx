
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
    <div className="min-h-screen bg-[#0C1330]">
      <div className={cn(
        "mx-auto max-w-md bg-[#0C1330] min-h-screen relative",
        isMobile ? "" : "border-x border-[#1E2A54] shadow-md"
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
