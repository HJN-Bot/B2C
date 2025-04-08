
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mic, Play, Pause, StopCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VocalExercise from "@/components/VocalExercise";
import { AudioRecorder, createAudioUrl } from "@/utils/audioRecorder";

const LessonLearning = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showExercise, setShowExercise] = useState(false);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  
  const vocalFoundationSteps = [
    {
      title: "Introduction to Vocal Foundations",
      content: "Your voice is your most powerful communication tool. The way you speak can significantly impact how your message is received. In this lesson, we'll explore the key components of effective vocal delivery.",
    },
    {
      title: "Rate of Speech",
      content: "Speaking too quickly can make you difficult to understand, while speaking too slowly can cause listeners to lose interest. The ideal rate is typically 150-160 words per minute, but this can vary depending on the context and content of your speech.",
    },
    {
      title: "Volume",
      content: "Your volume should be appropriate for the setting and audience. It's important to project your voice without shouting, and to vary your volume to emphasize important points. Practice breath control to maintain consistent volume throughout your speech.",
    },
    {
      title: "Pitch",
      content: "Pitch refers to how high or low your voice sounds. A monotone voice can be boring to listen to, so varying your pitch helps keep your audience engaged. Try to find your natural pitch range and practice moving comfortably within it.",
    },
    {
      title: "Practice Exercise",
      content: "Now, let's practice what you've learned about pitch. Click the button below to record yourself reading the following passage, focusing specifically on varying your pitch to emphasize important points: 'The way we communicate shapes how others perceive us. By consciously varying our pitch, we can highlight key ideas and maintain audience interest throughout our delivery.'",
      hasExercise: true,
    },
    {
      title: "Tonality",
      content: "Tonality is the emotional quality of your voice. It conveys how you feel about what you're saying. Be mindful of whether your tone matches your message. Practice conveying different emotions through your voice such as enthusiasm, concern, or confidence.",
    },
    {
      title: "Pause",
      content: "Strategic pauses can be powerful. They give your audience time to process information, create emphasis, and help you control the pace of your delivery. Don't be afraid of silence – it can be one of your most effective tools.",
    },
    {
      title: "Exercise Time",
      content: "Now it's time to put these principles into practice. In the next screen, you'll be asked to record yourself reading a short passage. We'll analyze your vocal delivery across all the elements we've discussed.",
    }
  ];
  
  const totalSteps = vocalFoundationSteps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
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
      navigate(-1);
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
  
  if (showExercise) {
    return <VocalExercise lessonId={lessonId} onComplete={() => navigate("/progress")} />;
  }
  
  return (
    <Layout hideNavigation>
      <div className="p-4 min-h-screen flex flex-col">
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
          <div className="text-xs text-gray-500 mt-1 text-right">
            {currentStep + 1}/{totalSteps}
          </div>
        </div>
        
        <div className="flex-1">
          <h1 className="text-xl font-bold mb-4">{vocalFoundationSteps[currentStep].title}</h1>
          <p className="text-gray-700 leading-relaxed">{vocalFoundationSteps[currentStep].content}</p>
          
          {vocalFoundationSteps[currentStep].hasExercise && (
            <Button 
              className="mt-6"
              onClick={() => setShowPracticeDialog(true)}
            >
              Practice Pitch Variation
            </Button>
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
          
          <Button 
            onClick={handleNext}
          >
            {currentStep === totalSteps - 1 ? "Start Exercise" : "Next"}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <Dialog open={showPracticeDialog} onOpenChange={setShowPracticeDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Practice Pitch Variation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md italic">
                "The way we communicate shapes how others perceive us. By consciously varying our pitch, we can highlight key ideas and maintain audience interest throughout our delivery."
              </p>
              
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
                      
                      <Button onClick={() => setShowPracticeDialog(false)}>
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LessonLearning;
