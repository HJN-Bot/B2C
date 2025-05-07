import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { AudioRecorder, createAudioUrl, analyzeAudio, DetailedAnalysisResult } from "@/utils/audioRecorder";
import { useToast } from "@/hooks/use-toast";
import PracticePrompt from "@/components/practice/PracticePrompt";
import RecordingSection from "@/components/practice/RecordingSection";
import AnalysisResults from "@/components/practice/AnalysisResults";
import { Reaction } from "@/models/reactions";

const Practice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [focusArea, setFocusArea] = useState<'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'>('all');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [collectedReactions, setCollectedReactions] = useState<Reaction[]>([]);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  const startTimer = () => {
    if (timerRef.current) return;
    
    timerRef.current = window.setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };
  
  const startRecording = async () => {
    try {
      await audioRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      setAudioBlob(null);
      setAnalysis(null);
      setCollectedReactions([]);
      startTimer();
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone"
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Microphone access denied or not available",
        variant: "destructive"
      });
    }
  };
  
  const stopRecording = async () => {
    if (!audioRecorder.current.isRecording()) return;
    
    try {
      const blob = await audioRecorder.current.stop();
      setAudioBlob(blob);
      const url = createAudioUrl(blob);
      setAudioUrl(url);
      setIsRecording(false);
      stopTimer();
      
      console.log("Recording stopped, collected reactions:", collectedReactions.length);
      toast({
        title: "Recording complete",
        description: `You collected ${collectedReactions.length} reactions!`
      });
      
      // Analyze the audio
      setAnalyzingAudio(true);
      const result = await analyzeAudio(blob, focusArea);
      setAnalysis(result);
      setAnalyzingAudio(false);
      
      toast({
        title: "Analysis complete",
        description: `Overall score: ${result.overallScore}/100`
      });
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      stopTimer();
      toast({
        title: "Recording error",
        description: "There was a problem processing your recording",
        variant: "destructive"
      });
    }
  };
  
  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    
    setIsPlaying(!isPlaying);
  };
  
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    
    setAudioUrl(null);
    setAudioBlob(null);
    setAnalysis(null);
    setRecordingTime(0);
    setShowPrompt(true);
    setCollectedReactions([]);
  };
  
  const reanalyzeWithFocus = async (area: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all') => {
    if (!audioBlob) return;
    
    setFocusArea(area);
    setAnalyzingAudio(true);
    
    toast({
      title: "Reanalyzing recording",
      description: `Focusing on ${area.replace('-', ' ')}...`
    });
    
    const result = await analyzeAudio(audioBlob, area);
    setAnalysis(result);
    setAnalyzingAudio(false);
    
    toast({
      title: "Analysis updated",
      description: `New focus: ${area.replace('-', ' ')}`
    });
  };

  const handleReactionCollected = (reaction: Reaction) => {
    console.log("Reaction collected in Practice component:", reaction);
    setCollectedReactions(prev => [...prev, reaction]);
  };
  
  useEffect(() => {
    return () => {
      stopTimer();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);
  
  return (
    <Layout>
      <div className="p-4 space-y-5">
        <h1 className="text-2xl font-bold">Practice</h1>
        
        <PracticePrompt 
          showPrompt={showPrompt} 
          audioUrl={audioUrl}
          focusArea={focusArea}
          onHidePrompt={() => setShowPrompt(false)}
          onFocusAreaChange={reanalyzeWithFocus}
        />
        
        {/* Audio element for playback */}
        {audioUrl && <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} hidden />}
        
        <RecordingSection 
          isRecording={isRecording}
          recordingTime={recordingTime}
          audioUrl={audioUrl}
          isPlaying={isPlaying}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
          onTogglePlayback={togglePlayback}
          onReset={resetRecording}
          onReactionCollected={handleReactionCollected}
        />
        
        <AnalysisResults 
          analysis={analysis}
          analyzingAudio={analyzingAudio}
          focusArea={focusArea} 
          collectedReactions={collectedReactions}
        />
      </div>
    </Layout>
  );
};

export default Practice;
