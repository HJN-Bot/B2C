
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import HighlightedText from "@/components/HighlightedText";

interface LessonContentProps {
  title: string;
  content: ReactNode;
}

const LessonContent = ({ title, content }: LessonContentProps) => {
  return (
    <Card className="bg-white shadow-sm mb-6">
      <CardContent className="p-6">
        <h1 className="text-xl font-bold mb-4">{title}</h1>
        <div className="text-gray-700 leading-relaxed">
          {content}
        </div>
      </CardContent>
    </Card>
  );
};

export default LessonContent;
