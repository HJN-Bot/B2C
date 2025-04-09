
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mic, Play, Pause, StopCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VocalExercise from "@/components/VocalExercise";
import { Card, CardContent } from "@/components/ui/card";
import HighlightedText from "@/components/HighlightedText";
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
  const stepParam = searchParams.get('step');
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam, 10) - 1 : 0);
  const [showExercise, setShowExercise] = useState(false);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [showPracticeExercise, setShowPracticeExercise] = useState(false);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Part 1: Rate of Speech and Volume
  const vocalFoundationsPart1 = [{
    title: "Introduction to Vocal Foundations",
    content: "Your voice is your most powerful communication tool. The way you speak can significantly impact how your message is received. In this lesson, we'll explore the key components of effective vocal delivery, focusing on the rate of speech and volume."
  }, {
    title: "Rate of Speech",
    content: <>
      <p className="mb-4">Speaking with one pace can dull your message and confuse listeners.</p>
      <p className="mb-4">Adjust your speaking pace —</p>
      <div className="space-y-2 mb-4">
        <div><HighlightedText color="red">Speed up to excite,</HighlightedText></div>
        <div><HighlightedText>slow down to emphasize.</HighlightedText></div>
      </div>
      <p>Keep it varied to hold attention and clarify your message!</p>
    </>
  }, {
    title: "Volume",
    content: "Volume = The lifeblood of your voice\n\nRule of thumb: Ensure your voice is as big as the room. This requires adjusting your energy and presentation style to suit the scale and dynamics of your audience.\n\nFor instance, a high-energy approach might overwhelm a single conversation partner but could be ideal for a large audience."
  }, {
    title: "Practice Exercise",
    content: <>
      <p className="mb-4">Read this sentence aloud:</p>
      <p className="mb-6">
        "Don't be so <HighlightedText color="red">attached to who you are</HighlightedText> in the present, that you don't give <HighlightedText>the future version of you a chance</HighlightedText>!"
      </p>
      <Button 
        className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-blue-600 hover:bg-blue-700"
        onClick={() => setShowPracticeDialog(true)}
      >
        <Mic size={20} />
        Start Recording
      </Button>
    </>,
    hasExercise: true
  }];

  // Part 2: Pitch and Tonality
  const vocalFoundationsPart2 = [{
    title: "Introduction to Pitch and Tonality",
    content: "In this section, we focus on the energizers of communication: pitch and tonality. These elements add life and emotion to your words, helping you connect with your audience on a deeper level."
  }, {
    title: "Pitch",
    content: "Pitch refers to how high or low your voice sounds. A monotone voice can be boring to listen to, so varying your pitch helps keep your audience engaged. Try to find your natural pitch range and practice moving comfortably within it."
  }, {
    title: "Tonality",
    content: "Tonality is the emotional quality of your voice. It conveys how you feel about what you're saying. Be mindful of whether your tone matches your message. Practice conveying different emotions through your voice such as enthusiasm, concern, or confidence."
  }, {
    title: "Practice Exercise",
    content: <>
      <p className="mb-4">Read this sentence aloud:</p>
      <p className="mb-6">
        "Embrace the <HighlightedText color="red">natural rhythm</HighlightedText> of your speech by varying your pitch; let the <HighlightedText>highs express excitement</HighlightedText> and the <HighlightedText>lows convey calm reflection</HighlightedText>."
      </p>
      <Button 
        className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-blue-600 hover:bg-blue-700"
        onClick={() => setShowPracticeDialog(true)}
      >
        <Mic size={20} />
        Start Recording
      </Button>
    </>,
    hasExercise: true
  }];

  // Part 3: Pause and Filler Words
  const vocalFoundationsPart3 = [{
    title: "Introduction to Pauses and Filler Words",
    content: "In this section, we explore the breathers of talking: strategic pauses and the elimination of filler words. Mastering these elements can dramatically improve the clarity and impact of your communication."
  }, {
    title: "Pause",
    content: "Strategic pauses can be powerful. They give your audience time to process information, create emphasis, and help you control the pace of your delivery. Don't be afraid of silence – it can be one of your most effective tools."
  }, {
    title: "Filler Words",
    content: "Filler words like 'um,' 'uh,' 'like,' and 'you know' can distract from your message and make you sound less confident. Practice speaking slowly and pausing instead of using fillers. Record yourself speaking and note when you use fillers to become more aware of this habit."
  }, {
    title: "Practice Exercise",
    content: <>
      <p className="mb-4">Read this sentence aloud:</p>
      <p className="mb-6">
        "Remember that <HighlightedText color="red">communication is not just about</HighlightedText> the words you choose, but <HighlightedText>how you deliver them</HighlightedText>. Your voice has the power to <HighlightedText>inspire, to comfort, to persuade</HighlightedText>."
      </p>
      <Button 
        className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-blue-600 hover:bg-blue-700"
        onClick={() => setShowPracticeDialog(true)}
      >
        <Mic size={20} />
        Start Recording
      </Button>
    </>,
    hasExercise: true
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
  
  const totalSteps = activeSteps.length;
  const progress = (currentStep + 1) / totalSteps * 100;

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

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      setShowExercise(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      navigate(`/lessons/${lessonId}`);
    }
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

  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('step', (currentStep + 1).toString());
    navigate(`/lessons/${lessonId}/learn?${newSearchParams.toString()}`, { replace: true });
  }, [currentStep, lessonId, navigate, searchParams]);

  useEffect(() => {
    // Show practice exercise when halfway through the lesson
    if (currentStep >= Math.floor(totalSteps / 2) && !showPracticeExercise) {
      setShowPracticeExercise(true);
    }
  }, [currentStep, totalSteps, showPracticeExercise]);

  if (showExercise) {
    return <VocalExercise 
      lessonId={lessonId} 
      focusArea={focusArea} 
      onComplete={() => navigate("/progress")} 
    />;
  }

  const practiceExerciseText = "If you just communicate, you can get by. But if you communicate skillfully, you can work miracles.";

  return <Layout hideNavigation>
      <div className="p-4 min-h-screen flex flex-col">
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {currentStep + 1}/{totalSteps}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <Card className="bg-white shadow-sm mb-6">
            <CardContent className="p-6">
              <h1 className="text-xl font-bold mb-4">{activeSteps[currentStep].title}</h1>
              <div className="text-gray-700 leading-relaxed">
                {activeSteps[currentStep].content}
              </div>
            </CardContent>
          </Card>
          
          {showPracticeExercise && (
            <Card className="bg-blue-50 shadow-sm mb-6 border-blue-200">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold mb-3 text-blue-800">Practice Your Skills</h2>
                <p className="mb-4 text-gray-700">
                  Read the following quote aloud, focusing on your rate of speech:
                </p>
                <div className="p-4 bg-white rounded-md mb-4 shadow-inner">
                  <p className="italic text-gray-800">
                    "<HighlightedText color="green">If you just communicate</HighlightedText>, you can get by. 
                    <HighlightedText color="yellow">But if you communicate skillfully</HighlightedText>, 
                    <HighlightedText color="red">you can work miracles</HighlightedText>."
                  </p>
                  <p className="text-right text-sm text-gray-500 mt-1">- Jim Rohn</p>
                </div>
                
                <Button 
                  className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700"
                  onClick={() => setShowPracticeDialog(true)}
                >
                  <Mic size={18} />
                  Practice Now
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        
        <div className="flex justify-between pt-4 border-t mt-6">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
          >
            <ArrowLeft size={16} className="mr-2" />
            Previous
          </Button>
          
          <Button onClick={handleNext}>
            {currentStep === totalSteps - 1 ? "Start Exercise" : "Next"}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <Dialog open={showPracticeDialog} onOpenChange={setShowPracticeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Practice Vocal Elements</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md italic">
                {showPracticeExercise ? practiceExerciseText : getExerciseText()}
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
                          <span>Rate of Speech:</span>
                          <span className="font-medium">
                            {analysis.paceScore}/100
                          </span>
                        </div>
                        <Progress value={analysis.paceScore} className="h-2 mb-3" />
                        <p className="text-xs">
                          Your speaking rate is approximately {analysis.detailedMetrics.wordsPerMinute} words per minute. {
                            analysis.detailedMetrics.wordsPerMinute > 160 
                              ? "Try slowing down a bit for better clarity." 
                              : analysis.detailedMetrics.wordsPerMinute < 120 
                                ? "You could speed up slightly to maintain engagement." 
                                : "This is a good pace for effective communication."
                          }
                        </p>
                        <p className="text-xs mt-2">
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
    </Layout>;
};

export default LessonLearning;
