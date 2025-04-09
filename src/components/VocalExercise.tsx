import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, StopCircle, Play, Pause, ArrowLeft, CheckCircle, BarChart, Headphones, Volume2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioRecorder, createAudioUrl, analyzeAudio, DetailedAnalysisResult, getOpenAIApiKey } from "@/utils/audioRecorder";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import APIKeyInput from "@/components/APIKeyInput";

interface VocalExerciseProps {
  lessonId?: string;
  focusArea?: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all';
  onComplete: () => void;
}

const VocalExercise = ({ lessonId, focusArea = 'all', onComplete }: VocalExerciseProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"instructions" | "recording" | "analysis">("instructions");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  const passageText = "The art of communication is the language of leadership. It bridges the gap between confusion and clarity, between apathy and action. When we speak, our words carry not just information, but intention and emotion. The best communicators know that it's not just what you say, but how you say it that matters. They use their voice as an instrument—adjusting volume, pace, and tone to convey meaning beyond mere words. Practice this passage aloud, focusing on the vocal techniques we've discussed.";
  
  useEffect(() => {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      setShowApiKeyDialog(true);
    }
  }, []);
  
  const getFocusAreaDisplay = () => {
    switch (focusArea) {
      case 'rate-volume':
        return "Rate of Speech & Volume";
      case 'pitch-tonality':
        return "Pitch & Tonality";
      case 'pause-fillers':
        return "Pauses & Filler Words";
      default:
        return "All Vocal Elements";
    }
  };
  
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
        description: `Focus on ${focusArea.replace('-', ' ')}`
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
  
  const analyzeRecording = async () => {
    if (!audioBlob) return;
    
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
      setShowApiKeyDialog(true);
      return;
    }
    
    setAnalyzingAudio(true);
    try {
      const result = await analyzeAudio(audioBlob, focusArea);
      setAnalysis(result);
      setStep("analysis");
      toast({
        title: "Analysis complete",
        description: `Overall score: ${result.overallScore}/100`
      });
    } catch (error) {
      console.error("Error analyzing audio:", error);
      toast({
        title: "Analysis failed",
        description: "Unable to analyze your recording",
        variant: "destructive"
      });
    } finally {
      setAnalyzingAudio(false);
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
  
  if (step === "instructions") {
    return (
      <>
        <Layout hideNavigation>
          <div className="p-4 min-h-screen flex flex-col">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                className="p-0 mr-2"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft size={24} />
              </Button>
              <h1 className="text-xl font-bold">Vocal Exercise</h1>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Volume2 size={18} />
                  Exercise: {getFocusAreaDisplay()}
                </h2>
                <p className="text-sm text-gray-700 mb-6">
                  Read the following passage aloud, focusing on 
                  {focusArea === 'rate-volume' 
                    ? " maintaining an appropriate speaking rate and projecting your voice with proper volume."
                    : focusArea === 'pitch-tonality'
                      ? " varying your pitch and using tonality to express emotion and emphasis."
                      : focusArea === 'pause-fillers'
                        ? " using strategic pauses for emphasis and avoiding filler words."
                        : " all aspects of vocal delivery including rate, volume, pitch, tonality, and strategic pauses."
                  }
                </p>
                
                <div className="bg-gray-50 p-4 rounded-md mb-6">
                  <p className="text-sm italic">{passageText}</p>
                </div>
                
                <p className="text-sm text-gray-700 mb-6">
                  After recording, our AI will analyze your vocal delivery with special focus on 
                  {focusArea === 'rate-volume' 
                    ? " your rate of speech and volume control"
                    : focusArea === 'pitch-tonality'
                      ? " your pitch variation and emotional expression"
                      : focusArea === 'pause-fillers'
                        ? " your strategic pauses and filler word usage"
                        : " all aspects of your vocal delivery"
                  }
                  , and provide personalized feedback and improvement suggestions.
                </p>
                
                <Button 
                  className="w-full"
                  onClick={() => setStep("recording")}
                >
                  Continue to Recording
                </Button>
              </CardContent>
            </Card>
          </div>
        </Layout>
        
        <APIKeyInput 
          open={showApiKeyDialog} 
          onOpenChange={setShowApiKeyDialog} 
        />
      </>
    );
  }
  
  if (step === "recording") {
    return (
      <>
        <Layout hideNavigation>
          <div className="p-4 min-h-screen flex flex-col">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                className="p-0 mr-2"
                onClick={() => setStep("instructions")}
              >
                <ArrowLeft size={24} />
              </Button>
              <h1 className="text-xl font-bold">Record Your Voice</h1>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="text-sm font-medium mb-2">
                Focus on: {getFocusAreaDisplay()}
              </h3>
              <p className="text-sm italic">{passageText}</p>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center py-6">
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
                  <div className="animate-pulse">
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
                    <Button variant="outline" onClick={() => {
                      setAudioUrl(null);
                      setAudioBlob(null);
                      setRecordingTime(0);
                    }}>
                      Record again
                    </Button>
                    
                    <Button 
                      onClick={analyzeRecording}
                      disabled={analyzingAudio}
                    >
                      {analyzingAudio ? 'Analyzing...' : 'Analyze Recording'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Layout>
        
        <APIKeyInput 
          open={showApiKeyDialog} 
          onOpenChange={setShowApiKeyDialog} 
          onComplete={analyzeRecording}
        />
      </>
    );
  }
  
  return (
    <>
      <Layout hideNavigation>
        <div className="p-4 min-h-screen flex flex-col">
          <div className="flex items-center mb-6">
            <Button 
              variant="ghost" 
              className="p-0 mr-2"
              onClick={() => setStep("recording")}
            >
              <ArrowLeft size={24} />
            </Button>
            <h1 className="text-xl font-bold">Voice Analysis</h1>
          </div>
          
          {analyzingAudio && (
            <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
              <div className="inline-block">
                <div className="h-12 w-12 rounded-full border-4 border-communi-primary border-t-transparent animate-spin mx-auto"></div>
              </div>
              <p className="mt-3 text-sm">Analyzing your recording...</p>
            </div>
          )}
          
          {!analyzingAudio && analysis && (
            <div className="space-y-5 flex-1">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Overall Score</span>
                    <span className="text-lg font-bold text-communi-primary">{analysis.overallScore}/100</span>
                  </div>
                  <Progress value={analysis.overallScore} className="h-3" />
                </CardContent>
              </Card>
              
              <Tabs defaultValue="detailed">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
                  <TabsTrigger value="scores">Basic Scores</TabsTrigger>
                  <TabsTrigger value="suggestions">Improvement Plan</TabsTrigger>
                </TabsList>
                
                <TabsContent value="detailed" className="space-y-4 pt-4">
                  {focusArea === 'rate-volume' || focusArea === 'all' ? (
                    <DetailedFeedbackCard 
                      title="Rate of Speech" 
                      score={analysis.paceScore}
                      analysis={`You spoke at approximately ${analysis.detailedMetrics.wordsPerMinute} words per minute, which is ${analysis.detailedMetrics.wordsPerMinute > 160 ? "a bit fast" : analysis.detailedMetrics.wordsPerMinute < 120 ? "a bit slow" : "at a good pace"} for optimal comprehension.`}
                      highlight={focusArea === 'rate-volume'}
                    />
                  ) : null}
                  
                  {focusArea === 'rate-volume' || focusArea === 'all' ? (
                    <DetailedFeedbackCard 
                      title="Volume" 
                      score={analysis.detailedMetrics.volumeVariation}
                      analysis={`Your volume variation score indicates ${analysis.detailedMetrics.volumeVariation > 75 ? "excellent dynamic range" : analysis.detailedMetrics.volumeVariation < 50 ? "relatively monotonous volume" : "good variation in your projection"}. ${analysis.detailedMetrics.volumeVariation > 75 ? "You effectively use louder and softer tones for emphasis." : "Try varying your volume more intentionally for emphasis."}`}
                      highlight={focusArea === 'rate-volume'}
                    />
                  ) : null}
                  
                  {focusArea === 'pitch-tonality' || focusArea === 'all' ? (
                    <DetailedFeedbackCard 
                      title="Pitch Variation" 
                      score={analysis.detailedMetrics.pitchVariation}
                      analysis={`Your pitch variation shows ${analysis.detailedMetrics.pitchVariation > 75 ? "excellent expressiveness" : analysis.detailedMetrics.pitchVariation < 50 ? "limited range" : "good modulation"}. ${analysis.detailedMetrics.pitchVariation < 60 ? "Try varying your pitch more to add interest and emphasis." : "You effectively use higher and lower tones to convey meaning."}`}
                      highlight={focusArea === 'pitch-tonality'}
                    />
                  ) : null}
                  
                  {focusArea === 'pitch-tonality' || focusArea === 'all' ? (
                    <DetailedFeedbackCard 
                      title="Tonality" 
                      score={analysis.tonalityScore}
                      analysis={`Your emotional expression through voice shows ${analysis.tonalityScore > 75 ? "strong capability" : analysis.tonalityScore < 50 ? "room for improvement" : "good control"}. ${analysis.tonalityScore < 60 ? "Practice conveying more emotion through your voice." : "You effectively communicate emotion through your vocal tone."}`}
                      highlight={focusArea === 'pitch-tonality'}
                    />
                  ) : null}
                  
                  {focusArea === 'pause-fillers' || focusArea === 'all' ? (
                    <DetailedFeedbackCard 
                      title="Strategic Pauses" 
                      score={analysis.pausesScore}
                      analysis={`You used approximately ${analysis.detailedMetrics.pauseMetrics.totalPauses} strategic pauses with an average duration of ${analysis.detailedMetrics.pauseMetrics.averagePauseDuration.toFixed(1)} seconds. ${analysis.pausesScore > 75 ? "Your pauses effectively create emphasis and allow processing time." : "Try using more intentional pauses to emphasize key points."}`}
                      highlight={focusArea === 'pause-fillers'}
                    />
                  ) : null}
                  
                  {focusArea === 'pause-fillers' || focusArea === 'all' ? (
                    <DetailedFeedbackCard 
                      title="Filler Words" 
                      score={analysis.fillerWordsScore}
                      analysis={`You used approximately ${analysis.detailedMetrics.fillerWordCount.total} filler words, including ${analysis.detailedMetrics.fillerWordCount.um} "um"s and ${analysis.detailedMetrics.fillerWordCount.like} "like"s. ${analysis.detailedMetrics.fillerWordCount.total > 8 ? "Try replacing these with strategic pauses." : "You're doing well at minimizing filler words."}`}
                      highlight={focusArea === 'pause-fillers'}
                    />
                  ) : null}
                </TabsContent>
                
                <TabsContent value="scores" className="space-y-4 pt-4">
                  <ScoreItem 
                    label="Rate of Speech" 
                    score={analysis.paceScore} 
                    description={`${analysis.detailedMetrics.wordsPerMinute} words per minute`}
                    highlight={focusArea === 'rate-volume'}
                  />
                  <ScoreItem 
                    label="Volume" 
                    score={analysis.detailedMetrics.volumeVariation} 
                    description="Projection and variation"
                    highlight={focusArea === 'rate-volume'}
                  />
                  <ScoreItem 
                    label="Pitch" 
                    score={analysis.detailedMetrics.pitchVariation} 
                    description="Variation and expressiveness"
                    highlight={focusArea === 'pitch-tonality'}
                  />
                  <ScoreItem 
                    label="Tonality" 
                    score={analysis.tonalityScore} 
                    description="Emotional expression in voice"
                    highlight={focusArea === 'pitch-tonality'}
                  />
                  <ScoreItem 
                    label="Pauses" 
                    score={analysis.pausesScore} 
                    description={`${analysis.detailedMetrics.pauseMetrics.totalPauses} strategic pauses used`}
                    highlight={focusArea === 'pause-fillers'}
                  />
                  <ScoreItem 
                    label="Filler Words" 
                    score={analysis.fillerWordsScore} 
                    description={`${analysis.detailedMetrics.fillerWordCount.total} filler words detected`}
                    highlight={focusArea === 'pause-fillers'}
                  />
                </TabsContent>
                
                <TabsContent value="suggestions" className="pt-4">
                  <div className="space-y-4">
                    {focusArea === 'rate-volume' || focusArea === 'all' ? (
                      <ImprovementSection 
                        title="Rate of Speech"
                        suggestions={analysis.specificSuggestions.pace}
                        highlight={focusArea === 'rate-volume'}
                      />
                    ) : null}
                    
                    {focusArea === 'rate-volume' || focusArea === 'all' ? (
                      <ImprovementSection 
                        title="Volume Control"
                        suggestions={analysis.specificSuggestions.volume}
                        highlight={focusArea === 'rate-volume'}
                      />
                    ) : null}
                    
                    {focusArea === 'pitch-tonality' || focusArea === 'all' ? (
                      <ImprovementSection 
                        title="Pitch Variation"
                        suggestions={analysis.specificSuggestions.pitch}
                        highlight={focusArea === 'pitch-tonality'}
                      />
                    ) : null}
                    
                    {focusArea === 'pause-fillers' || focusArea === 'all' ? (
                      <ImprovementSection 
                        title="Reducing Filler Words"
                        suggestions={analysis.specificSuggestions.fillers}
                        highlight={focusArea === 'pause-fillers'}
                      />
                    ) : null}
                  </div>
                </TabsContent>
              </Tabs>
              
              <Card className="mt-6">
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Transcription</h3>
                  <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                    {analysis.transcription}
                    {focusArea === 'pause-fillers' && analysis.detailedMetrics.fillerWordCount.total > 0 && (
                      <p className="mt-2 text-xs text-red-500">
                        Filler words detected are highlighted in the transcript.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-700 mb-4">
                  Based on your performance, we recommend focusing on improving 
                  {analysis.paceScore < analysis.tonalityScore && 
                   analysis.paceScore < analysis.pausesScore ? 
                    ' your rate of speech' : 
                    analysis.tonalityScore < analysis.pausesScore ? 
                      ' your pitch and tonality' : ' your strategic pauses and filler word usage'} 
                  in your next practice session.
                </p>
                
                <Button 
                  className="w-full"
                  onClick={onComplete}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Complete Lesson
                </Button>
              </div>
            </div>
          )}
        </div>
      </Layout>
      
      <APIKeyInput 
        open={showApiKeyDialog} 
        onOpenChange={setShowApiKeyDialog}
      />
    </>
  );
};

const DetailedFeedbackCard = ({ 
  title, 
  score, 
  analysis,
  highlight = false
}: { 
  title: string; 
  score: number; 
  analysis: string;
  highlight?: boolean;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <Card className={cn(highlight && "border-l-4 border-blue-500")}>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold">{title}</h3>
          <span className={cn("font-bold", getScoreColor(score))}>
            {score}/100
          </span>
        </div>
        <Progress value={score} className="h-2 mb-3" />
        <p className="text-sm text-gray-700">{analysis}</p>
      </CardContent>
    </Card>
  );
};

const ImprovementSection = ({ 
  title, 
  suggestions,
  highlight = false
}: { 
  title: string; 
  suggestions: string[];
  highlight?: boolean;
}) => {
  return (
    <Card className={cn(highlight && "border-l-4 border-blue-500")}>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">{title} Improvement Plan</h3>
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="text-sm bg-gray-50 p-2 rounded-md">
              {suggestion}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
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

export default VocalExercise;
