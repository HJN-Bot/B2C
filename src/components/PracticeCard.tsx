
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HighlightedText from "@/components/HighlightedText";
import { Mic } from "lucide-react";

interface PracticeCardProps {
  onPracticeClick: () => void;
}

const PracticeCard = ({ onPracticeClick }: PracticeCardProps) => {
  return (
    <Card className="bg-blue-50 shadow-md mb-6 border-blue-200">
      <CardContent className="p-6">
        <h2 className="text-lg font-bold mb-3 text-blue-800">Practice Your Skills</h2>
        <p className="mb-4 text-gray-700">
          Read the following quote aloud, focusing on your rate of speech:
        </p>
        <div className="p-4 bg-white rounded-md mb-4 shadow-inner border border-blue-100">
          <p className="italic text-gray-800">
            "<HighlightedText color="green">If you just communicate</HighlightedText>, you can get by. 
            <HighlightedText color="yellow">But if you communicate skillfully</HighlightedText>, 
            <HighlightedText color="red">you can work miracles</HighlightedText>."
          </p>
          <p className="text-right text-sm text-gray-500 mt-1">- Jim Rohn</p>
        </div>
        
        <Button 
          className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700"
          onClick={onPracticeClick}
        >
          <Mic size={18} />
          Practice Now
        </Button>
      </CardContent>
    </Card>
  );
};

export default PracticeCard;
