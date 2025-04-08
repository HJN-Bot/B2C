
import { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, Play, Pause, X } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { AudioRecorder, createAudioUrl, mockAnalyzeAudio, AnalysisResult } from "@/utils/audioRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const Practice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  
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
      setAnalysis(null);
      startTimer();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };
  
  const stopRecording = async () => {
    if (!audioRecorder.current.isRecording()) return;
    
    try {
      const audioBlob = await audioRecorder.current.stop();
      const url = createAudioUrl(audioBlob);
      setAudioUrl(url);
      setIsRecording(false);
      stopTimer();
      
      // Simulate AI analysis
      setAnalyzingAudio(true);
      const result = await mockAnalyzeAudio(recordingTime);
      setAnalysis(result);
      setAnalyzingAudio(false);
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      stopTimer();
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
    setAnalysis(null);
    setRecordingTime(0);
    setShowPrompt(true);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
        
        {/* Practice prompt */}
        {showPrompt && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">Today's Practice</h3>
                {audioUrl && (
                  <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => setShowPrompt(false)}>
                    <X size={18} />
                  </Button>
                )}
              </div>
              <p className="text-sm mt-2">
                Practice giving a short 1-2 minute speech introducing yourself and describing what communication skills you want to improve.
              </p>
            </CardContent>
          </Card>
        )}
        
        {/* Recording UI */}
        <div className="flex flex-col items-center justify-center py-4">
          {!isRecording && !audioUrl && (
            <div className="text-center space-y-4">
              <div className="record-button mx-auto" onClick={startRecording}>
                <Mic size={32} />
              </div>
              <p className="text-sm">Tap to start recording</p>
            </div>
          )}
          
          {isRecording && (
            <div className="text-center space-y-4">
              <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
              <div className="animate-pulse-light">
                <div className="record-button mx-auto bg-red-500" onClick={stopRecording}>
                  <StopCircle size={32} />
                </div>
              </div>
              <p className="text-sm">Recording... Tap to stop</p>
            </div>
          )}
          
          {audioUrl && (
            <div className="w-full space-y-4">
              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
              
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  variant="outline" 
                  className="w-12 h-12 rounded-full p-0"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </Button>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={resetRecording}>
                  Record again
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Analysis Results */}
        {analyzingAudio && (
          <div className="text-center py-6">
            <div className="inline-block animate-pulse-light">
              <div className="h-12 w-12 rounded-full border-4 border-communi-primary border-t-transparent animate-spin mx-auto"></div>
            </div>
            <p className="mt-3 text-sm">Analyzing your recording...</p>
          </div>
        )}
        
        {analysis && (
          <div className="space-y-5">
            <h2 className="text-xl font-semibold">Analysis Results</h2>
            
            <Tabs defaultValue="scores">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scores" className="space-y-4 pt-4">
                <ScoreItem 
                  label="Pace" 
                  score={analysis.paceScore} 
                  description="How well you maintained an appropriate speaking rate"
                />
                <ScoreItem 
                  label="Tonality" 
                  score={analysis.tonalityScore} 
                  description="Variation in pitch and emphasis"
                />
                <ScoreItem 
                  label="Pauses" 
                  score={analysis.pausesScore} 
                  description="Effective use of pauses for emphasis"
                />
                <ScoreItem 
                  label="Filler Words" 
                  score={analysis.fillerWordsScore} 
                  description="Minimizing 'um', 'uh', 'like', etc."
                />
                
                <div className="pt-4 border-t mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Overall Score</span>
                    <span className={cn(
                      "text-lg font-bold",
                      analysis.overallScore >= 80 ? "text-green-600" :
                      analysis.overallScore >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    )}>
                      {analysis.overallScore}/100
                    </span>
                  </div>
                  <Progress value={analysis.overallScore} className="h-3" />
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="pt-4">
                <div className="space-y-3">
                  {analysis.feedback.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="pt-4">
              <Button className="w-full">Save to My Progress</Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

const ScoreItem = ({ label, score, description }: { label: string; score: number; description: string }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <div>
          <span className="font-medium">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className={cn("font-bold", getScoreColor(score))}>
          {score}/100
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
};

export default Practice;
