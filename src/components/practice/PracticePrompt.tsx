
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

interface PracticePromptProps {
  showPrompt: boolean;
  audioUrl: string | null;
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all';
  onHidePrompt: () => void;
  onFocusAreaChange: (area: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all') => void;
}

const PracticePrompt = ({
  showPrompt,
  audioUrl,
  focusArea,
  onHidePrompt,
  onFocusAreaChange
}: PracticePromptProps) => {
  if (!showPrompt) return null;
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="font-medium">Today's Practice</h3>
          {audioUrl && (
            <Button variant="ghost" size="sm" className="h-auto p-1" onClick={onHidePrompt}>
              <X size={18} />
            </Button>
          )}
        </div>
        <p className="text-sm mt-2">
          Practice giving a short 1-2 minute speech introducing yourself and describing what communication skills you want to improve.
        </p>
        
        {audioUrl && (
          <div className="mt-3">
            <h4 className="text-sm font-medium mb-2">Focus your analysis:</h4>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={focusArea === 'rate-volume' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => onFocusAreaChange('rate-volume')}
              >
                Rate & Volume
              </Button>
              <Button 
                variant={focusArea === 'pitch-tonality' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => onFocusAreaChange('pitch-tonality')}
              >
                Pitch & Tonality
              </Button>
              <Button 
                variant={focusArea === 'pause-fillers' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => onFocusAreaChange('pause-fillers')}
              >
                Pauses & Fillers
              </Button>
              <Button 
                variant={focusArea === 'all' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => onFocusAreaChange('all')}
              >
                All Aspects
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PracticePrompt;
