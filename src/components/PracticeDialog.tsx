
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import RecordingInterface from "@/components/RecordingInterface";
import APIKeyInput from "@/components/APIKeyInput";
import { getOpenAIApiKey } from "@/utils/audioRecorder";

interface PracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPracticeExercise?: boolean;
  focusArea?: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all';
  exerciseText?: string;
}

const PracticeDialog = ({
  open,
  onOpenChange,
  showPracticeExercise = false,
  focusArea = 'all',
  exerciseText = ""
}: PracticeDialogProps) => {
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  
  useEffect(() => {
    if (open) {
      // Check if API key exists when dialog is opened
      const apiKey = getOpenAIApiKey();
      if (!apiKey) {
        setShowApiKeyDialog(true);
      }
    }
  }, [open]);
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <RecordingInterface 
            focusArea={focusArea} 
            exerciseText={exerciseText} 
            onComplete={() => onOpenChange(false)} 
          />
        </DialogContent>
      </Dialog>
      
      <APIKeyInput 
        open={showApiKeyDialog} 
        onOpenChange={setShowApiKeyDialog}
      />
    </>
  );
};

export default PracticeDialog;
