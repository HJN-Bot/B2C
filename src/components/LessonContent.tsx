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
  return <Card className="bg-white shadow-sm mb-6">
      <CardContent className="p-6">
        <h1 className="text-2xl font-bold mb-2 text-communi-primary">{title}</h1>
        {description && <p className="text-gray-600 mb-4 italic text-xs">{description}</p>}
        <div className="text-gray-700 leading-relaxed">
          {content}
        </div>
      </CardContent>
    </Card>;
};
export default LessonContent;