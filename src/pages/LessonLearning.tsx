
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import VocalExercise from "@/components/VocalExercise";

const LessonLearning = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showExercise, setShowExercise] = useState(false);
  
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
      </div>
    </Layout>
  );
};

export default LessonLearning;
