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

  const activeListeningPart1 = [{
    title: "Introduction to Active Listening",
    description: "Understand what makes listening truly active",
    content: "Active listening is the foundation of meaningful connection. It requires your full attention, genuine curiosity, and a commitment to understanding before responding. Unlike passive hearing, active listening involves being fully present and engaged with the speaker."
  }, {
    title: "The 75/25 Rule of Conversation",
    description: "Balance listening and speaking for better conversations",
    content: <>
      <p className="mb-4">In effective conversations, listening should occupy about 75% of your role, while speaking takes up only 25%.</p>
      <p className="mb-4">When you prioritize listening:</p>
      <ul className="list-disc pl-5 mb-4">
        <li>The speaker feels valued and understood</li>
        <li>You gather more accurate information</li>
        <li>Trust develops more quickly</li>
        <li>Your responses become more thoughtful and relevant</li>
      </ul>
      <Button onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("Practice the 75/25 rule by having a 2-minute conversation where you focus on asking questions and listening rather than sharing your own thoughts or experiences.");
        setShowPracticeDialog(true);
      }} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 py-[14px] mt-4">
        Practice the 75/25 Rule
      </Button>
    </>
  }, {
    title: "Reflective Listening Technique",
    description: "Learn to mirror and validate what others say",
    content: <>
      <p className="mb-4">Reflective listening is showing the speaker that you truly understand by paraphrasing what they've said in your own words.</p>
      <p className="mb-4">Useful phrases to start reflective responses:</p>
      <div className="space-y-2 mb-4">
        <div><HighlightedText color="red">"So what you're saying is..."</HighlightedText></div>
        <div><HighlightedText>"It sounds like you feel..."</HighlightedText></div>
        <div><HighlightedText>"Let me make sure I understand..."</HighlightedText></div>
      </div>
      <p className="mb-4">This technique validates the speaker and ensures you've interpreted their message correctly.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("Listen to this statement: 'I've been overwhelmed lately with all my responsibilities and don't feel like I have time for myself.' Now reflect it back, starting with 'What I'm hearing is...'");
        setShowPracticeDialog(true);
      }}>
        Practice Reflective Listening
      </Button>
    </>
  }, {
    title: "Practice Exercise",
    description: "Apply reflective listening to show understanding",
    content: <>
      <p className="mb-4">Listen to this scenario and respond with reflective listening:</p>
      <p className="mb-6">
        "I <HighlightedText color="red">applied for a promotion</HighlightedText> I really wanted but didn't get it. The feedback was that I need more experience, but <HighlightedText>someone with less experience than me got the role</HighlightedText>. I'm trying not to take it personally, but it's <HighlightedText>hard not to feel overlooked</HighlightedText>."
      </p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("I applied for a promotion I really wanted but didn't get it. The feedback was that I need more experience, but someone with less experience than me got the role. I'm trying not to take it personally, but it's hard not to feel overlooked.");
        setShowPracticeDialog(true);
      }}>
        Start Recording
      </Button>
    </>,
    hasExercise: true
  }];

  const activeListeningPart2 = [{
    title: "Open-Ended Questions",
    description: "Learn to ask questions that encourage deeper sharing",
    content: "Open-ended questions invite detailed responses rather than simple yes/no answers. They typically begin with what, how, why, or tell me about... These questions demonstrate genuine interest and help the speaker explore their thoughts more deeply."
  }, {
    title: "Transforming Closed Questions",
    description: "Convert limiting questions into conversation openers",
    content: <>
      <p className="mb-4">Compare these closed vs. open-ended questions:</p>
      <div className="space-y-4 mb-4">
        <div>
          <p className="font-semibold">Closed: <span className="text-gray-500">Did you have a good weekend?</span></p>
          <p className="font-semibold">Open: <HighlightedText>What did you do this weekend that you enjoyed?</HighlightedText></p>
        </div>
        <div>
          <p className="font-semibold">Closed: <span className="text-gray-500">Was the meeting productive?</span></p>
          <p className="font-semibold">Open: <HighlightedText>What aspects of the meeting did you find most valuable?</HighlightedText></p>
        </div>
      </div>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("Transform these closed questions into open-ended ones: 1) Did you like the movie? 2) Are you ready for the presentation? 3) Was your vacation relaxing?");
        setShowPracticeDialog(true);
      }}>
        Practice Question Transformation
      </Button>
    </>
  }, {
    title: "Mindful Presence",
    description: "Master the non-verbal aspects of active listening",
    content: <>
      <p className="mb-4">Being physically and mentally present is essential for active listening:</p>
      <ul className="list-disc pl-5 mb-4">
        <li>Put away distractions (especially phones)</li>
        <li>Maintain appropriate eye contact</li>
        <li>Use affirming body language (nodding, leaning in)</li>
        <li>Be aware of your facial expressions</li>
      </ul>
      <p className="mb-4">Non-verbal cues often communicate more than words – make sure yours convey attention and respect.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("Practice mindful presence by recording yourself discussing a topic while consciously maintaining appropriate eye contact, positive body language, and avoiding distractions.");
        setShowPracticeDialog(true);
      }}>
        Practice Mindful Presence
      </Button>
    </>
  }, {
    title: "Practice Exercise",
    description: "Apply all active listening techniques in conversation",
    content: <>
      <p className="mb-4">Imagine you're having a conversation with someone who says:</p>
      <p className="mb-6">
        "I'm <HighlightedText color="red">considering a career change</HighlightedText>. I've been in my field for over ten years, but lately I've been feeling <HighlightedText>stagnant and uninspired</HighlightedText>. The thought of starting over is scary, but <HighlightedText>continuing on this path feels even worse</HighlightedText>."
      </p>
      <p className="mb-4">Respond using the active listening techniques you've learned:</p>
      <ol className="list-decimal pl-5 mb-4">
        <li>Use reflective listening to mirror their concerns</li>
        <li>Ask an open-ended question to explore deeper</li>
        <li>Describe how you would show mindful presence</li>
      </ol>
      <Button className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("I'm considering a career change. I've been in my field for over ten years, but lately I've been feeling stagnant and uninspired. The thought of starting over is scary, but continuing on this path feels even worse.");
        setShowPracticeDialog(true);
      }}>
        Start Recording
      </Button>
    </>,
    hasExercise: true
  }];

  const activeListeningPart3 = [{
    title: "Overcoming Listening Barriers",
    description: "Identify and address common obstacles to effective listening",
    content: "Even with the best intentions, we all face barriers to effective listening. Recognizing these barriers is the first step to overcoming them."
  }, {
    title: "Common Listening Barriers",
    description: "Recognize what blocks effective listening",
    content: <>
      <p className="mb-4">Four major barriers to effective listening:</p>
      <ol className="list-decimal pl-5 mb-4">
        <li className="mb-2"><span className="font-semibold">Rehearsing:</span> Formulating your response while the other person is still speaking</li>
        <li className="mb-2"><span className="font-semibold">Filtering:</span> Hearing some parts while ignoring others</li>
        <li className="mb-2"><span className="font-semibold">Judging:</span> Dismissing the speaker's message based on your prejudgments</li>
        <li className="mb-2"><span className="font-semibold">Identifying:</span> Relating everything back to your own experience instead of understanding theirs</li>
      </ol>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("Reflect on a recent conversation where you noticed one of these barriers affecting your listening. Which barrier was it? How did it impact the conversation? What could you do differently next time?");
        setShowPracticeDialog(true);
      }}>
        Reflect on Listening Barriers
      </Button>
    </>
  }, {
    title: "Empathetic Listening",
    description: "Listen to understand emotions, not just words",
    content: <>
      <p className="mb-4">Empathetic listening means tuning into the emotional content beneath the words. It involves:</p>
      <ul className="list-disc pl-5 mb-4">
        <li>Sensing the emotions present (even when unstated)</li>
        <li>Acknowledging feelings before moving to solutions</li>
        <li>Making it safe for the speaker to be vulnerable</li>
        <li>Suspending judgment, even when you disagree</li>
      </ul>
      <p className="mb-4">Remember: People rarely forget how you made them feel when they shared something important.</p>
      <Button className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 mt-4" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("Respond with empathy to this statement: 'My manager gave me critical feedback in front of everyone today. I know I made a mistake on the report, but it was embarrassing to be called out like that.'");
        setShowPracticeDialog(true);
      }}>
        Practice Empathetic Listening
      </Button>
    </>
  }, {
    title: "Practice Exercise",
    description: "Apply all active listening skills in a challenging scenario",
    content: <>
      <p className="mb-4">Imagine someone shares this difficult situation:</p>
      <p className="mb-6">
        "I'm <HighlightedText color="red">facing a really tough decision</HighlightedText>. My elderly parents need more care, and my siblings think we should <HighlightedText>move them to an assisted living facility</HighlightedText>. But I promised my parents years ago that I'd never put them in a home. I'm <HighlightedText>feeling torn between my siblings' practical concerns and my promise</HighlightedText>. I don't know what the right thing is anymore."
      </p>
      <p className="mb-4">Respond using all the active listening skills you've learned:</p>
      <ol className="list-decimal pl-5 mb-4">
        <li>Demonstrate reflective listening</li>
        <li>Ask an open-ended question</li>
        <li>Show empathy for the emotional content</li>
        <li>Avoid the common listening barriers</li>
      </ol>
      <Button className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => {
        setExerciseFocusArea('all');
        setExerciseText("I'm facing a really tough decision. My elderly parents need more care, and my siblings think we should move them to an assisted living facility. But I promised my parents years ago that I'd never put them in a home. I'm feeling torn between my siblings' practical concerns and my promise. I don't know what the right thing is anymore.");
        setShowPracticeDialog(true);
      }}>
        Start Recording
      </Button>
    </>,
    hasExercise: true
  }];

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
      <Button className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => {
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
      <Button className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => {
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
      <Button className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-blue-600 hover:bg-blue-700" onClick={() => {
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

  if (lessonId === 'active-listening-basics') {
    switch (part) {
      case "2":
        activeSteps = activeListeningPart2;
        focusArea = 'all';
        break;
      case "3":
        activeSteps = activeListeningPart3;
        focusArea = 'all';
        break;
      default:
        activeSteps = activeListeningPart1;
        focusArea = 'all';
    }
  } else {
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
      <div className="p-4 min-h-screen flex flex-col bg-lime-100">
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
