
import { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, Play, Pause, X, Headphones, BarChart } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  AudioRecorder, 
  createAudioUrl, 
  analyzeAudio,
  DetailedAnalysisResult 
} from "@/utils/audioRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import LiveReactionFeedback from "@/components/LiveReactionFeedback";

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
      
      toast({
        title: "Recording complete",
        description: "Analyzing your vocal performance..."
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
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
              
              {audioUrl && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Focus your analysis:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={focusArea === 'rate-volume' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('rate-volume')}
                    >
                      Rate & Volume
                    </Button>
                    <Button 
                      variant={focusArea === 'pitch-tonality' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('pitch-tonality')}
                    >
                      Pitch & Tonality
                    </Button>
                    <Button 
                      variant={focusArea === 'pause-fillers' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('pause-fillers')}
                    >
                      Pauses & Fillers
                    </Button>
                    <Button 
                      variant={focusArea === 'all' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('all')}
                    >
                      All Aspects
                    </Button>
                  </div>
                </div>
              )}
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
              
              {/* Add the live reaction feedback component */}
              <div className="mt-4 min-h-[80px] flex items-center justify-center">
                <LiveReactionFeedback isActive={isRecording} />
              </div>
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
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart size={20} />
              Analysis Results
              <span className="text-sm font-normal text-gray-500 ml-2">
                Focus: {focusArea.replace('-', ' ')}
              </span>
            </h2>
            
            <Tabs defaultValue="scores">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>
              
              <TabsContent value="scores" className="space-y-4 pt-4">
                <ScoreItem 
                  label="Pace" 
                  score={analysis.paceScore} 
                  description="How well you maintained an appropriate speaking rate"
                  highlight={focusArea === 'rate-volume'}
                />
                <ScoreItem 
                  label="Tonality" 
                  score={analysis.tonalityScore} 
                  description="Variation in pitch and emphasis"
                  highlight={focusArea === 'pitch-tonality'}
                />
                <ScoreItem 
                  label="Pauses" 
                  score={analysis.pausesScore} 
                  description="Effective use of pauses for emphasis"
                  highlight={focusArea === 'pause-fillers'}
                />
                <ScoreItem 
                  label="Filler Words" 
                  score={analysis.fillerWordsScore} 
                  description="Minimizing 'um', 'uh', 'like', etc."
                  highlight={focusArea === 'pause-fillers'}
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
              
              <TabsContent value="metrics" className="pt-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Speaking Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Words per minute</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.wordsPerMinute}</p>
                          <p className="text-xs text-gray-400">
                            {analysis.detailedMetrics.wordsPerMinute > 160 ? "Faster than average" : 
                             analysis.detailedMetrics.wordsPerMinute < 130 ? "Slower than average" : "Good pace"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Volume variation</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.volumeVariation}/100</p>
                          <p className="text-xs text-gray-400">
                            {analysis.detailedMetrics.volumeVariation > 75 ? "Excellent dynamic range" : 
                             analysis.detailedMetrics.volumeVariation < 50 ? "Monotonous volume" : "Good variation"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Pauses & Filler Words</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Strategic pauses</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.pauseMetrics.totalPauses}</p>
                          <p className="text-xs text-gray-400">
                            Avg. duration: {analysis.detailedMetrics.pauseMetrics.averagePauseDuration.toFixed(1)}s
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Filler words</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.fillerWordCount.total}</p>
                          <p className="text-xs text-gray-400">
                            um: {analysis.detailedMetrics.fillerWordCount.um}, 
                            like: {analysis.detailedMetrics.fillerWordCount.like}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Pitch Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p className="text-sm text-gray-500">Pitch variation</p>
                        <p className="text-xl font-semibold">{analysis.detailedMetrics.pitchVariation}/100</p>
                        <p className="text-xs text-gray-400">
                          {analysis.detailedMetrics.pitchVariation > 75 ? "Excellent expressiveness" : 
                           analysis.detailedMetrics.pitchVariation < 50 ? "Monotonous pitch" : "Good variation"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="pt-4">
                <div className="space-y-5">
                  <div className="space-y-3">
                    <h3 className="text-md font-semibold">General Feedback</h3>
                    {analysis.feedback.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm">{item}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-md font-semibold">Improvement Suggestions</h3>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Rate & Pace</h4>
                        <ul className="space-y-2">
                          {analysis.specificSuggestions.pace.map((suggestion, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Pitch & Tonality</h4>
                        <ul className="space-y-2">
                          {analysis.specificSuggestions.pitch.map((suggestion, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2">Filler Words</h4>
                        <ul className="space-y-2">
                          {analysis.specificSuggestions.fillers.map((suggestion, index) => (
                            <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="transcript" className="pt-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-medium mb-2">Transcription</h3>
                    <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                      {analysis.transcription}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Note: This is an AI-generated transcription and may not be 100% accurate.
                    </p>
                  </CardContent>
                </Card>
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

const ScoreItem = ({ 
  label, 
  score, 
  description, 
  highlight = false 
}: { 
  label: string; 
  score: number; 
  description: string; 
  highlight?: boolean;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className={cn("space-y-2", highlight && "border-l-4 border-blue-500 pl-3")}>
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
