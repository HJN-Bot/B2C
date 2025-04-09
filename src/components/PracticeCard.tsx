
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import HighlightedText from "@/components/HighlightedText";
import { Mic } from "lucide-react";

interface PracticeCardProps {
  onPracticeClick: () => void;
}

const PracticeCard = ({ onPracticeClick }: PracticeCardProps) => {
  return (
    <Card className="bg-[#121C3E] shadow-md mb-6 border border-[#1E2A54]">
      <CardContent className="p-6">
        <h2 className="text-lg font-bold mb-3 text-white">Practice Your Skills</h2>
        <p className="mb-4 text-gray-300">
          Read the following quote aloud, focusing on your rate of speech:
        </p>
        <div className="p-4 bg-[#0C1330] rounded-md mb-4 shadow-inner border border-[#1E2A54]">
          <p className="italic text-gray-200">
            "<HighlightedText color="green">If you just communicate</HighlightedText>, you can get by. 
            <HighlightedText color="yellow">But if you communicate skillfully</HighlightedText>, 
            <HighlightedText color="red">you can work miracles</HighlightedText>."
          </p>
          <p className="text-right text-sm text-gray-400 mt-1">- Jim Rohn</p>
        </div>
        
        <Button 
          className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF7A30] hover:bg-[#FF9D45] text-white"
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
