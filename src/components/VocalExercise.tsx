import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, StopCircle, Play, Pause, ArrowLeft, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioRecorder, createAudioUrl, mockAnalyzeAudio, AnalysisResult } from "@/utils/audioRecorder";
import { cn } from "@/lib/utils";

interface VocalExerciseProps {
  lessonId?: string;
  onComplete: () => void;
}

interface DetailedAnalysis extends AnalysisResult {
  detailedFeedback: {
    rateOfSpeech: {
      score: number;
      analysis: string;
      suggestions: string[];
    };
    volume: {
      score: number;
      analysis: string;
      suggestions: string[];
    };
    pitch: {
      score: number;
      analysis: string;
      suggestions: string[];
    };
  };
}

const VocalExercise = ({ lessonId, onComplete }: VocalExerciseProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"instructions" | "recording" | "analysis">("instructions");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysis | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  
  const passageText = "The art of communication is the language of leadership. It bridges the gap between confusion and clarity, between apathy and action. When we speak, our words carry not just information, but intention and emotion. The best communicators know that it's not just what you say, but how you say it that matters. They use their voice as an instrument—adjusting volume, pace, and tone to convey meaning beyond mere words. Practice this passage aloud, focusing on the vocal techniques we've discussed.";
  
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
      
      setAnalyzingAudio(true);
      const basicResult = await mockAnalyzeAudio(recordingTime);
      
      const detailedResult: DetailedAnalysis = {
        ...basicResult,
        detailedFeedback: {
          rateOfSpeech: {
            score: Math.floor(Math.random() * 30) + 70,
            analysis: "Your speaking rate averaged 165 words per minute, which is within the ideal range for clear comprehension. There were moments where you accelerated during complex phrases.",
            suggestions: [
              "Try marking your script with pauses to remind yourself to slow down at key points.",
              "Practice with a metronome set to 150 beats per minute for a consistent pace.",
              "Record yourself reading the same passage at different speeds to find your optimal rate."
            ]
          },
          volume: {
            score: Math.floor(Math.random() * 30) + 70,
            analysis: "Your volume was well-projected and consistent throughout most of the recording. There was a slight drop in volume toward the end of longer sentences.",
            suggestions: [
              "Practice diaphragmatic breathing to maintain consistent airflow for longer phrases.",
              "Try the 'countdown technique': start a sentence loudly and gradually decrease volume while maintaining clarity.",
              "Record yourself in different environments to develop adaptability in your projection."
            ]
          },
          pitch: {
            score: Math.floor(Math.random() * 30) + 70,
            analysis: "You demonstrated some pitch variation, particularly when emphasizing key points. However, your pitch range could be expanded for greater expressiveness.",
            suggestions: [
              "Try reading dialogue from a play, exaggerating the emotional differences between characters.",
              "Practice sliding from your lowest comfortable note to your highest in a controlled manner.",
              "Identify 3-4 key words in each sentence and deliberately vary your pitch when speaking them."
            ]
          }
        }
      };
      
      setAnalysis(detailedResult);
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
              <h2 className="text-lg font-semibold mb-3">Instructions</h2>
              <p className="text-sm text-gray-700 mb-6">
                Read the following passage aloud, focusing on the vocal techniques we've discussed: rate of speech, volume, pitch, tonality, and strategic pauses.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <p className="text-sm italic">{passageText}</p>
              </div>
              
              <p className="text-sm text-gray-700 mb-6">
                After recording, our AI will analyze your vocal delivery and provide personalized feedback on each aspect of your performance.
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
    );
  }
  
  if (step === "recording") {
    return (
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
                    setRecordingTime(0);
                  }}>
                    Record again
                  </Button>
                  
                  <Button onClick={() => {
                    setAnalyzingAudio(true);
                    setTimeout(() => {
                      setStep("analysis");
                    }, 1500);
                  }}>
                    Analyze Recording
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
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
                <DetailedFeedbackCard 
                  title="Rate of Speech" 
                  score={analysis.detailedFeedback.rateOfSpeech.score}
                  analysis={analysis.detailedFeedback.rateOfSpeech.analysis}
                />
                
                <DetailedFeedbackCard 
                  title="Volume" 
                  score={analysis.detailedFeedback.volume.score}
                  analysis={analysis.detailedFeedback.volume.analysis}
                />
                
                <DetailedFeedbackCard 
                  title="Pitch Variation" 
                  score={analysis.detailedFeedback.pitch.score}
                  analysis={analysis.detailedFeedback.pitch.analysis}
                />
              </TabsContent>
              
              <TabsContent value="scores" className="space-y-4 pt-4">
                <ScoreItem 
                  label="Rate of Speech" 
                  score={analysis.detailedFeedback.rateOfSpeech.score} 
                  description="Optimal speaking pace for comprehension"
                />
                <ScoreItem 
                  label="Volume" 
                  score={analysis.detailedFeedback.volume.score} 
                  description="Projection and consistency"
                />
                <ScoreItem 
                  label="Pitch" 
                  score={analysis.detailedFeedback.pitch.score} 
                  description="Variation and expressiveness"
                />
                <ScoreItem 
                  label="Tonality" 
                  score={analysis.tonalityScore} 
                  description="Emotional expression in voice"
                />
                <ScoreItem 
                  label="Pauses" 
                  score={analysis.pausesScore} 
                  description="Strategic use of silence"
                />
              </TabsContent>
              
              <TabsContent value="suggestions" className="pt-4">
                <div className="space-y-4">
                  <ImprovementSection 
                    title="Rate of Speech"
                    suggestions={analysis.detailedFeedback.rateOfSpeech.suggestions}
                  />
                  
                  <ImprovementSection 
                    title="Volume"
                    suggestions={analysis.detailedFeedback.volume.suggestions}
                  />
                  
                  <ImprovementSection 
                    title="Pitch Variation"
                    suggestions={analysis.detailedFeedback.pitch.suggestions}
                  />
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="mt-6 pt-4 border-t">
              <p className="text-sm text-gray-700 mb-4">
                Based on your performance, we recommend focusing on improving 
                {analysis.detailedFeedback.pitch.score < analysis.detailedFeedback.rateOfSpeech.score && 
                 analysis.detailedFeedback.pitch.score < analysis.detailedFeedback.volume.score ? 
                  ' pitch variation' : 
                  analysis.detailedFeedback.rateOfSpeech.score < analysis.detailedFeedback.volume.score ? 
                    ' rate of speech' : ' volume control'} 
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
  );
};

const DetailedFeedbackCard = ({ title, score, analysis }: { title: string; score: number; analysis: string }) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <Card>
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

const ImprovementSection = ({ title, suggestions }: { title: string; suggestions: string[] }) => {
  return (
    <Card>
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

export default VocalExercise;
