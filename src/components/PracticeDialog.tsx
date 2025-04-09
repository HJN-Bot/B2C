
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RecordingInterface from "./RecordingInterface";

interface PracticeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showPracticeExercise: boolean;
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all';
}

const PracticeDialog = ({ open, onOpenChange, showPracticeExercise, focusArea }: PracticeDialogProps) => {
  const getExerciseText = () => {
    if (showPracticeExercise) {
      return "If you just communicate, you can get by. But if you communicate skillfully, you can work miracles.";
    }
    
    switch (focusArea) {
      case "pitch-tonality":
        return "Embrace the natural rhythm of your speech by varying your pitch; let the highs express excitement and the lows convey calm reflection. Your voice is the melody that brings the narrative to life. Through tonality, you can express joy, concern, confidence, or curiosity - bringing your words to life.";
      case "pause-fillers":
        return "Remember that communication is not just about the words you choose, but how you deliver them. Your voice has the power to inspire, to comfort, to persuade, and to connect. By mastering these vocal elements, you're not just becoming a better speaker – you're becoming a more effective communicator in every aspect of your life.";
      default:
        return "In the heart of a bustling city, every sound tells a story. As you speak, let your words flow at a comfortable pace—neither too fast nor too slow. Project your voice with a gentle strength, ensuring that each word is heard clearly.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Practice Vocal Elements</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md italic">
            {getExerciseText()}
          </p>
          
          <RecordingInterface 
            focusArea={focusArea} 
            exerciseText={getExerciseText()} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PracticeDialog;
