
import { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, Play, Pause, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AudioRecorder } from "@/utils/audioRecorder";
import { useToast } from "@/hooks/use-toast";
import LiveReactionFeedback from "@/components/LiveReactionFeedback";
import { Reaction } from "@/models/reactions";

interface RecordingSectionProps {
  isRecording: boolean;
  recordingTime: number;
  audioUrl: string | null;
  isPlaying: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onTogglePlayback: () => void;
  onReset: () => void;
  onReactionCollected: (reaction: Reaction) => void;
}

const RecordingSection = ({
  isRecording,
  recordingTime,
  audioUrl,
  isPlaying,
  onStartRecording,
  onStopRecording,
  onTogglePlayback,
  onReset,
  onReactionCollected,
}: RecordingSectionProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {!isRecording && !audioUrl && (
        <div className="text-center space-y-4">
          <div className="record-button mx-auto" onClick={onStartRecording}>
            <Mic size={32} />
          </div>
          <p className="text-sm">Tap to start recording</p>
        </div>
      )}
      
      {isRecording && (
        <div className="text-center space-y-4">
          <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
          <div className="animate-pulse-light">
            <div className="record-button mx-auto bg-red-500" onClick={onStopRecording}>
              <StopCircle size={32} />
            </div>
          </div>
          <p className="text-sm">Recording... Tap to stop</p>
          
          <div className="mt-4 min-h-[80px] flex items-center justify-center">
            <LiveReactionFeedback 
              isActive={isRecording} 
              onReactionCollected={onReactionCollected}
            />
          </div>
        </div>
      )}
      
      {audioUrl && (
        <div className="w-full space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <Button 
              variant="outline" 
              className="w-12 h-12 rounded-full p-0"
              onClick={onTogglePlayback}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </Button>
          </div>
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={onReset}>
              Record again
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordingSection;
