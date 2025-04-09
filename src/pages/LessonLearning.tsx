import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import VocalExercise from "@/components/VocalExercise";
import LessonProgress from "@/components/LessonProgress";
import LessonContent from "@/components/LessonContent";
import PracticeCard from "@/components/PracticeCard";
import PracticeDialog from "@/components/PracticeDialog";
import HighlightedText from "@/components/HighlightedText";

const LessonLearning = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const part = searchParams.get('part') || "1";
  const stepParam = searchParams.get('step');
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(stepParam ? parseInt(stepParam, 10) - 1 : 0);
  const [showExercise, setShowExercise] = useState(false);
  const [showPracticeDialog, setShowPracticeDialog] = useState(false);
  const [showPracticeExercise, setShowPracticeExercise] = useState(false);
  
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

  return (
    <Layout hideNavigation>
      <div className="p-4 min-h-screen flex flex-col">
        <LessonProgress currentStep={currentStep} totalSteps={totalSteps} />
        
        <div className="flex-1 flex flex-col">
          <LessonContent 
            title={activeSteps[currentStep].title} 
            content={activeSteps[currentStep].content} 
          />
          
          {showPracticeExercise && (
            <PracticeCard onPracticeClick={() => setShowPracticeDialog(true)} />
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

        <PracticeDialog 
          open={showPracticeDialog} 
          onOpenChange={setShowPracticeDialog}
          showPracticeExercise={showPracticeExercise}
          focusArea={focusArea}
        />
      </div>
    </Layout>
  );
};

export default LessonLearning;
