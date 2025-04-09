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
  const [exerciseFocusArea, setExerciseFocusArea] = useState<'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'>('all');
  const [exerciseText, setExerciseText] = useState("");
  const vocalFoundationsPart1 = [{
    title: "Introduction to the Lifeblood of Voice",
    description: "Discover the foundational elements that give your voice its power and clarity",
    content: "Your voice is your most powerful communication tool. The way you speak can significantly impact how your message is received. In this lesson, we'll explore the key components of effective vocal delivery, focusing on the rate of speech and volume."
  }, {
    title: "Rate of Speech",
    description: "Master the pace of your delivery for maximum impact",
    content: <>
      <p className="mb-4 py-0 my-0">Speaking with one pace can dull your message and confuse listeners.</p>
      <p className="mb-4">Adjust your speaking pace with below rule:</p>
      <div className="space-y-2 mb-4">
        <div><HighlightedText color="red">Speed up to excite,</HighlightedText></div>
        <div><HighlightedText>slow down to emphasize.</HighlightedText></div>
      </div>
      <p className="mb-6">Keep it varied to hold attention and clarify your message!</p>
      <Button onClick={() => {
        setExerciseFocusArea('rate-volume');
        setExerciseText("Practice varying your speed. The QUICK brown fox jumped over the LAZY dog. Speed up for 'quick' and slow down for 'lazy' to emphasize the contrast.");
        setShowPracticeDialog(true);
      }} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-[14px] my-[90px]">
        Practice Rate of Speech
      </Button>
    </>
  }, {
    title: "Volume",
    description: "Control the volume of your voice to enhance your message",
    content: <>
      <p className="mb-4">Volume = Vitality</p>
      <p className="mb-4">Rule of thumb: Ensure your voice is as big as the room. This requires adjusting your energy and presentation style to suit the scale and dynamics of your audience.</p>
      <p className="mb-6">For instance, a high-energy approach might overwhelm a single conversation partner but could be ideal for a large audience.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700" onClick={() => {
        setExerciseFocusArea('rate-volume');
        setExerciseText("Practice volume control by reading this sentence with varying volume: Start QUIETLY and gradually increase volume until you reach the LOUDEST part, then return to a conversational level.");
        setShowPracticeDialog(true);
      }}>
        Practice Volume Control
      </Button>
    </>
  }, {
    title: "Practice Exercise",
    description: "Apply what you've learned to improve your vocal delivery",
    content: <>
      <p className="mb-4">Read this sentence aloud:</p>
      <p className="mb-6">
        "Don't be so <HighlightedText color="red">attached to who you are</HighlightedText> in the present, that you don't give <HighlightedText>the future version of you a chance</HighlightedText>!"
      </p>
      <Button className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => {
        setExerciseFocusArea('rate-volume');
        setExerciseText("Don't be so attached to who you are in the present, that you don't give the future version of you a chance!");
        setShowPracticeDialog(true);
      }}>
        Start Recording
      </Button>
    </>,
    hasExercise: true
  }];
  const vocalFoundationsPart2 = [{
    title: "Introduction to Pitch and Tonality",
    description: "Enhance your communication with pitch and tonality",
    content: "In this section, we focus on the energizers of communication: pitch and tonality. These elements add life and emotion to your words, helping you connect with your audience on a deeper level."
  }, {
    title: "Pitch",
    description: "Vary your pitch to engage your audience",
    content: <>
      <p className="mb-4">Pitch refers to how high or low your voice sounds. A monotone voice can be boring to listen to, so varying your pitch helps keep your audience engaged. Try to find your natural pitch range and practice moving comfortably within it.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('pitch-tonality');
        setExerciseText("Read with pitch variation: 'Is THIS the QUESTION you're asking?' (high pitch) followed by 'This is the ANSWER I'm giving.' (lower pitch)");
        setShowPracticeDialog(true);
      }}>
        Practice Pitch Variation
      </Button>
    </>
  }, {
    title: "Tonality",
    description: "Convey emotions through your voice",
    content: <>
      <p className="mb-4">Tonality is the emotional quality of your voice. It conveys how you feel about what you're saying. Be mindful of whether your tone matches your message. Practice conveying different emotions through your voice such as enthusiasm, concern, or confidence.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('pitch-tonality');
        setExerciseText("Say 'I'm really excited about this opportunity' with genuine enthusiasm, then say 'I'm concerned about these results' with an appropriate tone of concern.");
        setShowPracticeDialog(true);
      }}>
        Practice Emotional Tonality
      </Button>
    </>
  }, {
    title: "Practice Exercise",
    description: "Apply pitch and tonality to improve your communication",
    content: <>
      <p className="mb-4">Read this sentence aloud:</p>
      <p className="mb-6">
        "Embrace the <HighlightedText color="red">natural rhythm</HighlightedText> of your speech by varying your pitch; let the <HighlightedText>highs express excitement</HighlightedText> and the <HighlightedText>lows convey calm reflection</HighlightedText>."
      </p>
      <Button className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => {
        setExerciseFocusArea('pitch-tonality');
        setExerciseText("Embrace the natural rhythm of your speech by varying your pitch; let the highs express excitement and the lows convey calm reflection.");
        setShowPracticeDialog(true);
      }}>
        Start Recording
      </Button>
    </>,
    hasExercise: true
  }];
  const vocalFoundationsPart3 = [{
    title: "Introduction to Pauses and Filler Words",
    description: "Master the breathers of talking: pauses and filler words",
    content: "In this section, we explore the breathers of talking: strategic pauses and the elimination of filler words. Mastering these elements can dramatically improve the clarity and impact of your communication."
  }, {
    title: "Pause",
    description: "Use pauses to emphasize your message",
    content: <>
      <p className="mb-4">Strategic pauses can be powerful. They give your audience time to process information, create emphasis, and help you control the pace of your delivery. Don't be afraid of silence – it can be one of your most effective tools.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('pause-fillers');
        setExerciseText("Practice strategic pauses: 'The decision isn't just important... [pause] it's critical to our future success.' Use the pause for dramatic effect.");
        setShowPracticeDialog(true);
      }}>
        Practice Strategic Pauses
      </Button>
    </>
  }, {
    title: "Filler Words",
    description: "Eliminate filler words to improve your delivery",
    content: <>
      <p className="mb-4">Filler words like 'um,' 'uh,' 'like,' and 'you know' can distract from your message and make you sound less confident. Practice speaking slowly and pausing instead of using fillers. Record yourself speaking and note when you use fillers to become more aware of this habit.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('pause-fillers');
        setExerciseText("Describe your favorite hobby for 30 seconds without using any filler words. Replace any urge to say 'um' or 'uh' with a brief pause.");
        setShowPracticeDialog(true);
      }}>
        Practice Eliminating Fillers
      </Button>
    </>
  }, {
    title: "Practice Exercise",
    description: "Apply pauses and filler words to improve your communication",
    content: <>
      <p className="mb-4">Read this sentence aloud:</p>
      <p className="mb-6">
        "Remember that <HighlightedText color="red">communication is not just about</HighlightedText> the words you choose, but <HighlightedText>how you deliver them</HighlightedText>. Your voice has the power to <HighlightedText>inspire, to comfort, to persuade</HighlightedText>."
      </p>
      <Button className="w-full flex items-center justify-center gap-2 py-6 text-lg bg-blue-600 hover:bg-blue-700" onClick={() => {
        setExerciseFocusArea('pause-fillers');
        setExerciseText("Remember that communication is not just about the words you choose, but how you deliver them. Your voice has the power to inspire, to comfort, to persuade.");
        setShowPracticeDialog(true);
      }}>
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
    navigate(`/lessons/${lessonId}/learn?${newSearchParams.toString()}`, {
      replace: true
    });
  }, [currentStep, lessonId, navigate, searchParams]);
  if (showExercise) {
    return <VocalExercise lessonId={lessonId} focusArea={focusArea} onComplete={() => navigate("/progress")} />;
  }
  return <Layout hideNavigation>
      <div className="p-4 min-h-screen flex flex-col">
        <LessonProgress currentStep={currentStep} totalSteps={totalSteps} />
        
        <div className="flex-1 flex flex-col">
          <LessonContent title={activeSteps[currentStep].title} description={activeSteps[currentStep].description} content={activeSteps[currentStep].content} />
        </div>
        
        <div className="flex justify-between pt-4 border-t mt-6">
          <Button variant="outline" onClick={handlePrevious}>
            <ArrowLeft size={16} className="mr-2" />
            Previous
          </Button>
          
          <Button onClick={handleNext}>
            {currentStep === totalSteps - 1 ? "Start Exercise" : "Next"}
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <PracticeDialog open={showPracticeDialog} onOpenChange={setShowPracticeDialog} showPracticeExercise={true} focusArea={exerciseFocusArea} exerciseText={exerciseText} />
      </div>
    </Layout>;
};
export default LessonLearning;
