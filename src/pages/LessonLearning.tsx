
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mic, Play, Pause, StopCircle, BookOpen } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import VocalExercise from "@/components/VocalExercise";
import { AudioRecorder, createAudioUrl } from "@/utils/audioRecorder";
import { Card, CardContent } from "@/components/ui/card";

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
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const vocalFoundationsPart1 = [{
    title: "Introduction to Vocal Foundations",
    content: "Your voice is your most powerful communication tool. The way you speak can significantly impact how your message is received. In this lesson, we'll explore the key components of effective vocal delivery."
  }, {
    title: "Rate of Speech",
    content: "Speaking with one pace can dull your message and confuse listeners. Adjust your speaking pace — speed up to excite, slow down to emphasize. Keep it varied to hold attention and clarify your message!"
  }, {
    title: "Volume",
    content: "Volume = The lifeblood of your voice\n\nRule of thumb: Ensure your voice is as big as the room. This requires adjusting your energy and presentation style to suit the scale and dynamics of your audience.\n\nFor instance, a high-energy approach might overwhelm a single conversation partner but could be ideal for a large audience."
  }, {
    title: "Pitch",
    content: "Pitch refers to how high or low your voice sounds. A monotone voice can be boring to listen to, so varying your pitch helps keep your audience engaged. Try to find your natural pitch range and practice moving comfortably within it."
  }, {
    title: "Melody",
    content: "Melody is the rise and fall of your voice as you speak. It adds interest and emotion to your message. Practice creating a melodic pattern by slightly raising your pitch at the beginning of important phrases and lowering it at the end of sentences."
  }, {
    title: "Practice Exercise",
    content: "Transitions = Engagement\n\nNow, let's use these elements to create dynamic transitions that keep your audience engaged. Click the button below to record yourself reading the following passage, focusing on varying your rate of speech, volume, and pitch to create smooth transitions between ideas: 'In the heart of a bustling city, every sound tells a story. As you speak, let your words flow at a comfortable pace—neither too fast nor too slow. Project your voice with a gentle strength, ensuring that each word is heard clearly. Embrace the natural rhythm of your speech by varying your pitch; let the highs express excitement and the lows convey calm reflection. Your voice is the melody that brings the narrative to life.'\n\nBy varying your pace—slowing down for emphasis and speeding up for excitement—you can add dynamic variety to your speech and keep your audience engaged.",
    hasExercise: true
  }];

  const vocalFoundationsPart2 = [{
    title: "Tonality",
    content: "Tonality is the emotional quality of your voice. It conveys how you feel about what you're saying. Be mindful of whether your tone matches your message. Practice conveying different emotions through your voice such as enthusiasm, concern, or confidence."
  }, {
    title: "Pause",
    content: "Strategic pauses can be powerful. They give your audience time to process information, create emphasis, and help you control the pace of your delivery. Don't be afraid of silence – it can be one of your most effective tools."
  }, {
    title: "Filler Words",
    content: "Filler words like 'um,' 'uh,' 'like,' and 'you know' can distract from your message and make you sound less confident. Practice speaking slowly and pausing instead of using fillers. Record yourself speaking and note when you use fillers to become more aware of this habit."
  }, {
    title: "Putting It All Together",
    content: "Effective vocal delivery combines all these elements: appropriate rate, volume, pitch, melody, tonality, strategic pauses, and minimal filler words. When used well, they create a dynamic and engaging speaking style that helps you connect with your audience and deliver your message with impact."
  }, {
    title: "Practice Exercise",
    content: "Let's practice putting all these elements together. Click the button below to record yourself reading this passage, focusing on incorporating all the vocal elements we've discussed: 'Remember that communication is not just about the words you choose, but how you deliver them. Your voice has the power to inspire, to comfort, to persuade, and to connect. By mastering these vocal elements, you're not just becoming a better speaker – you're becoming a more effective communicator in every aspect of your life.'\n\nPay special attention to your tonality and use strategic pauses for emphasis.",
    hasExercise: true
  }];

  const activeSteps = part === "2" ? vocalFoundationsPart2 : vocalFoundationsPart1;
  const totalSteps = activeSteps.length;
  const progress = (currentStep + 1) / totalSteps * 100;

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

  return <Layout hideNavigation>
      <div className="p-4 min-h-screen flex flex-col bg-gradient-to-br from-white to-blue-50">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-blue-700">
              Step {currentStep + 1} of {totalSteps}
            </div>
            <div className="text-sm text-gray-500">
              Part {part}
            </div>
          </div>
          <Progress value={progress} className="h-2.5 bg-blue-100" />
        </div>
        
        <Card className="flex-1 border-none shadow-md bg-white/90 backdrop-blur-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold text-blue-700">{activeSteps[currentStep].title}</h1>
            </div>
            
            <div className="prose prose-blue max-w-none text-gray-700 leading-relaxed whitespace-pre-line">
              {activeSteps[currentStep].content.split('\n\n').map((paragraph, index) => (
                <p key={index} className={index === 0 ? "text-lg font-medium" : "text-base"}>
                  {paragraph}
                </p>
              ))}
            </div>
            
            {activeSteps[currentStep].hasExercise && 
              <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => setShowPracticeDialog(true)}>
                  Practice Vocal Elements
                </Button>
              </div>
            }
          </CardContent>
        </Card>
        
        <div className="flex justify-between pt-4 border-t mt-auto">
          <Button 
            variant="outline" 
            onClick={handlePrevious}
            className="border-blue-200 hover:bg-blue-50 text-blue-700"
          >
            <ArrowLeft size={16} className="mr-2" />
            Previous
          </Button>
          
          <Button 
            onClick={handleNext}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === totalSteps - 1 ? "Start Exercise" : "Next"}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <Dialog open={showPracticeDialog} onOpenChange={setShowPracticeDialog}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-blue-700">Practice Vocal Elements</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md italic border-l-4 border-blue-300">
                {part === "2" ? "Remember that communication is not just about the words you choose, but how you deliver them. Your voice has the power to inspire, to comfort, to persuade, and to connect. By mastering these vocal elements, you're not just becoming a better speaker – you're becoming a more effective communicator in every aspect of your life." : "In the heart of a bustling city, every sound tells a story. As you speak, let your words flow at a comfortable pace—neither too fast nor too slow. Project your voice with a gentle strength, ensuring that each word is heard clearly. Embrace the natural rhythm of your speech by varying your pitch; let the highs express excitement and the lows convey calm reflection. Your voice is the melody that brings the narrative to life."}
              </p>
              
              <div className="flex-1 flex flex-col items-center justify-center py-6">
                {!isRecording && !audioUrl && <div className="text-center space-y-4">
                    <div className="record-button mx-auto bg-blue-500 hover:bg-blue-600 transition-colors" onClick={startRecording}>
                      <Mic size={32} />
                    </div>
                    <p className="text-sm text-gray-600">Tap to start recording</p>
                  </div>}
                
                {isRecording && <div className="text-center space-y-4">
                    <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
                    <div className="animate-pulse">
                      <div className="record-button mx-auto bg-red-500 hover:bg-red-600 transition-colors" onClick={stopRecording}>
                        <StopCircle size={32} />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Recording... Tap to stop</p>
                  </div>}
                
                {audioUrl && <div className="w-full space-y-4">
                    <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
                    
                    <div className="flex items-center justify-center space-x-4">
                      <Button 
                        variant="outline" 
                        className="w-12 h-12 rounded-full p-0 border-blue-200 hover:bg-blue-50" 
                        onClick={togglePlayback}
                      >
                        {isPlaying ? <Pause size={24} className="text-blue-700" /> : <Play size={24} className="text-blue-700" />}
                      </Button>
                    </div>
                    
                    <div className="flex justify-center space-x-4">
                      <Button 
                        variant="outline" 
                        className="border-blue-200 hover:bg-blue-50 text-blue-700"
                        onClick={() => {
                          setAudioUrl(null);
                          setRecordingTime(0);
                        }}
                      >
                        Record again
                      </Button>
                      
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => setShowPracticeDialog(false)}
                      >
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
