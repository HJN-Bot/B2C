
import { Home, BookOpen, Mic, Award, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: BookOpen, label: "Lessons", path: "/lessons" },
    { icon: Mic, label: "Practice", path: "/practice" },
    { icon: Award, label: "Progress", path: "/progress" },
    { icon: User, label: "Profile", path: "/profile" }
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t z-10">
      <div className="flex justify-between items-center px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center py-2 px-3",
                isActive ? "text-communi-primary" : "text-gray-500"
              )}
            >
              <Icon size={24} className={cn(
                isActive && "animate-bounce-small"
              )} />
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Navigation;
