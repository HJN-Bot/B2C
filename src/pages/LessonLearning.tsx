
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MOCK_LESSONS } from "@/models/lesson";
import VocalExercise from "@/components/VocalExercise";

const LessonLearning = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const part = searchParams.get("part") || "1";
  const step = searchParams.get("step") || "1";
  
  // Find the lesson or default to empty
  const lesson = MOCK_LESSONS.find((l) => l.id === lessonId) || {
    id: "",
    title: "",
    description: "",
    category: "",
    level: "",
    duration: 0,
    slides: [],
    exercises: [],
    completed: false,
    progress: 0
  };
  
  const isPublicSpeakingIntro = lessonId === "public-speaking-intro";
  
  // Content based on part and step
  let content;
  
  if (isPublicSpeakingIntro && part === "1" && step === "1") {
    content = (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Rate of Speech</h2>
        <p className="text-gray-700">
          Sticking to one pace can dull your message and confuse listeners. Adjust your speaking pace — speed up to excite, slow down to emphasize. Keep it varied to hold attention and clarify your message!
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Try this exercise:</h3>
          <p className="mb-4">Read the following passage aloud, experimenting with different rates of speech:</p>
          <blockquote className="border-l-4 border-blue-300 pl-4 italic">
            "The journey of a thousand miles begins with a single step. Today, I'm taking that step. I'm excited about what lies ahead, but I know there will be challenges. Nevertheless, I'm committed to this path."
          </blockquote>
        </div>
        
        <VocalExercise />
      </div>
    );
  } else if (isPublicSpeakingIntro && part === "1" && step === "2") {
    content = (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Volume</h2>
        <p className="text-gray-700">
          Your volume should be appropriate for the environment and audience size. Practice projecting your voice without shouting, and varying your volume for emphasis.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Try this exercise:</h3>
          <p className="mb-4">Read the following passage, practicing different volumes:</p>
          <blockquote className="border-l-4 border-blue-300 pl-4 italic">
            "Listen carefully to what I'm about to tell you. This is important. (lower volume) Some things are meant to be shared in confidence. (raise volume) But this message needs to be heard by everyone!"
          </blockquote>
        </div>
        
        <VocalExercise />
      </div>
    );
  } else if (isPublicSpeakingIntro && part === "1" && step === "3") {
    content = (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Pitch</h2>
        <p className="text-gray-700">
          Varying your pitch adds interest to your speech. Monotone delivery can make even the most interesting content sound boring.
        </p>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Try this exercise:</h3>
          <p className="mb-4">Say the word "really" with different pitch patterns to express:</p>
          <ul className="list-disc list-inside space-y-2">
            <li>Excitement: "Really?" (rising pitch)</li>
            <li>Disbelief: "Really..." (falling pitch)</li>
            <li>Sarcasm: "Reeaally." (exaggerated rise and fall)</li>
          </ul>
        </div>
        
        <VocalExercise />
      </div>
    );
  } else {
    content = (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Lesson Content</h2>
        <p className="text-gray-700">
          This section is under development. Please check back later.
        </p>
      </div>
    );
  }
  
  return (
    <Layout>
      <div className="p-4 space-y-6">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            className="p-0 mr-2"
            onClick={() => navigate(`/lessons/${lessonId}`)}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold">{lesson.title}</h1>
        </div>
        
        {content}
        
        <div className="flex justify-between pt-6 mt-8 border-t">
          <Button 
            variant="outline"
            onClick={() => {
              if (isPublicSpeakingIntro && part === "1") {
                if (step === "2") {
                  navigate(`/lessons/${lessonId}/learn?part=1&step=1`);
                } else if (step === "3") {
                  navigate(`/lessons/${lessonId}/learn?part=1&step=2`);
                } else {
                  navigate(`/lessons/${lessonId}`);
                }
              } else {
                navigate(`/lessons/${lessonId}`);
              }
            }}
          >
            Back
          </Button>
          
          <Button 
            onClick={() => {
              if (isPublicSpeakingIntro && part === "1") {
                if (step === "1") {
                  navigate(`/lessons/${lessonId}/learn?part=1&step=2`);
                } else if (step === "2") {
                  navigate(`/lessons/${lessonId}/learn?part=1&step=3`);
                } else {
                  navigate(`/lessons/${lessonId}`);
                }
              } else {
                navigate(`/lessons/${lessonId}`);
              }
            }}
          >
            {isPublicSpeakingIntro && part === "1" && step !== "3" ? "Next" : "Finish"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default LessonLearning;
