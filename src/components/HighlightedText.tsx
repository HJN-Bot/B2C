
import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  color?: "red" | "blue" | "green" | "yellow";
  children: React.ReactNode;
}

const HighlightedText = ({ color = "blue", children }: HighlightedTextProps) => {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-white inline-block",
        color === "red" ? "bg-red-500" : 
        color === "green" ? "bg-green-500" :
        color === "yellow" ? "bg-yellow-500" :
        "bg-blue-500"
      )}
    >
      {children}
    </span>
  );
};

export default HighlightedText;
