
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import HighlightedText from "@/components/HighlightedText";

interface LessonContentProps {
  title: string;
  content: ReactNode;
  description?: string;
}

const LessonContent = ({
  title,
  description,
  content
}: LessonContentProps) => {
  return (
    <Card className="bg-[#121C3E] shadow-md mb-6 border border-[#1E2A54]">
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-2 text-white">{title}</h1>
        {description && <p className="text-gray-300 mb-4 italic text-xs">{description}</p>}
        <div className="text-gray-200 leading-relaxed">
          {content}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonContent;
