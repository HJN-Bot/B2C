
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Mic, Play, Pause, StopCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import VocalExercise from "@/components/VocalExercise";
import { 
  AudioRecorder, 
  createAudioUrl, 
  analyzeAudio, 
  DetailedAnalysisResult 
} from "@/utils/audioRecorder";
import { useToast } from "@/hooks/use-toast";

const LessonLearning = () => {
  const {
    lessonId
  } = useParams<{
    lessonId: string;
  }>();
  const [searchParams] = useSearchParams();
  const part = searchParams.get('part') || "1";
  const navigate = useNavigate();
  const [showExercise, setShowExercise] = useState(false);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysisResult | null>(null);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Part 1: Rate of Speech and Volume
  const vocalFoundationsPart1 = [{
    title: "Rate of Speech",
    content: "Speaking with one pace can dull your message and confuse listeners. Adjust your speaking pace — speed up to excite, slow down to emphasize. Keep it varied to hold attention and clarify your message!"
  }];

  // Part 2: Pitch and Tonality
  const vocalFoundationsPart2 = [{
    title: "Pitch",
    content: "Pitch refers to how high or low your voice sounds. A monotone voice can be boring to listen to, so varying your pitch helps keep your audience engaged. Try to find your natural pitch range and practice moving comfortably within it."
  }];

  // Part 3: Pause and Filler Words
  const vocalFoundationsPart3 = [{
    title: "Pause",
    content: "Strategic pauses can be powerful. They give your audience time to process information, create emphasis, and help you control the pace of your delivery. Don't be afraid of silence – it can be one of your most effective tools."
  }];

  let activeSteps;
  let focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all' = 'all';
  
  switch (part) {
    case "2":
      activeSteps = vocalFoundationsPart2;
      focusArea = 'pitch-tonality';
      break;
    case "3":
      activeSteps = vocalFoundationsPart3;
      focusArea = 'pause-fillers';
      break;
    default:
      activeSteps = vocalFoundationsPart1;
      focusArea = 'rate-volume';
  }
  
  const getExerciseText = () => {
    switch (part) {
      case "2":
        return "Embrace the natural rhythm of your speech by varying your pitch; let the highs express excitement and the lows convey calm reflection. Your voice is the melody that brings the narrative to life. Through tonality, you can express joy, concern, confidence, or curiosity - bringing your words to life.";
      case "3":
        return "Remember that communication is not just about the words you choose, but how you deliver them. Your voice has the power to inspire, to comfort, to persuade, and to connect. By mastering these vocal elements, you're not just becoming a better speaker – you're becoming a more effective communicator in every aspect of your life.";
      default:
        return "In the heart of a bustling city, every sound tells a story. As you speak, let your words flow at a comfortable pace—neither too fast nor too slow. Project your voice with a gentle strength, ensuring that each word is heard clearly.";
    }
  };

  const handlePracticeClick = () => {
    setShowPracticeDialog(true);
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
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
      toast({
        title: "Recording started",
        description: "Read the passage with attention to vocal elements"
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
      const audioBlob = await audioRecorder.current.stop();
      const url = createAudioUrl(audioBlob);
      setAudioUrl(url);
      setIsRecording(false);
      stopTimer();
      
      // AI analysis based on the focus area of the current lesson part
      setAnalyzing(true);
      const result = await analyzeAudio(audioBlob, focusArea);
      setAnalysis(result);
      setAnalyzing(false);
      
      toast({
        title: "Analysis complete",
        description: `Focus area: ${focusArea.replace('-', ' ')}` 
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

  if (showExercise) {
    return <VocalExercise 
      lessonId={lessonId} 
      focusArea={focusArea} 
      onComplete={() => navigate("/progress")} 
    />;
  }

  const currentLesson = activeSteps[0];

  return (
    <Layout hideNavigation>
      <div className="p-4 min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-lg bg-white rounded-3xl overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-2xl font-bold text-center">
                {currentLesson.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <p className="text-center text-gray-700 leading-relaxed px-4">
                {currentLesson.content}
              </p>
              
              <div className="flex justify-center mt-8">
                <Button 
                  onClick={handlePracticeClick}
                  className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium px-8 py-2 rounded-full"
                >
                  Practice Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showPracticeDialog} onOpenChange={setShowPracticeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Practice {currentLesson.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md italic">
                {getExerciseText()}
              </p>
              
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                {!isRecording && !audioUrl && <div className="text-center space-y-4">
                    <div className="record-button mx-auto" onClick={startRecording}>
                      <Mic size={32} />
                    </div>
                    <p className="text-sm">Tap to start recording</p>
                  </div>}
                
                {isRecording && <div className="text-center space-y-4">
                    <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
                    <div className="animate-pulse">
                      <div className="record-button mx-auto bg-red-500" onClick={stopRecording}>
                        <StopCircle size={32} />
                      </div>
                    </div>
                    <p className="text-sm">Recording... Tap to stop</p>
                  </div>}
                
                {audioUrl && <div className="w-full space-y-4">
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                    
                    <div className="flex items-center justify-center space-x-4">
                      <Button variant="outline" className="w-12 h-12 rounded-full p-0" onClick={togglePlayback}>
                        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                      </Button>
                    </div>
                    
                    {analyzing && (
                      <div className="text-center py-3">
                        <div className="inline-block">
                          <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto"></div>
                        </div>
                        <p className="text-xs mt-2">Analyzing your vocal performance...</p>
                      </div>
                    )}
                    
                    {analysis && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
                        <h4 className="font-semibold mb-2">Quick Analysis:</h4>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Focus Area Score:</span>
                          <span className="font-medium">
                            {focusArea === 'rate-volume' ? analysis.paceScore :
                             focusArea === 'pitch-tonality' ? analysis.tonalityScore :
                             focusArea === 'pause-fillers' ? analysis.pausesScore :
                             analysis.overallScore}/100
                          </span>
                        </div>
                        <Progress value={focusArea === 'rate-volume' ? analysis.paceScore :
                                         focusArea === 'pitch-tonality' ? analysis.tonalityScore :
                                         focusArea === 'pause-fillers' ? analysis.pausesScore :
                                         analysis.overallScore} 
                                  className="h-2 mb-3" />
                        <p className="text-xs">
                          {analysis.feedback[0]}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-center space-x-4">
                      <Button variant="outline" onClick={() => {
                        setAudioUrl(null);
                        setRecordingTime(0);
                        setAnalysis(null);
                      }}>
                        Record again
                      </Button>
                      
                      <Button onClick={() => setShowPracticeDialog(false)}>
                        Done
                      </Button>
                    </div>
                  </div>}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LessonLearning;
