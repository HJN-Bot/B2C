
import { Progress } from "@/components/ui/progress";

interface LessonProgressProps {
  currentStep: number;
  totalSteps: number;
}

const LessonProgress = ({ currentStep, totalSteps }: LessonProgressProps) => {
  const progress = (currentStep + 1) / totalSteps * 100;
  
  return (
    <div className="mb-6">
      <Progress value={progress} className="h-2" />
      <div className="text-xs text-gray-500 mt-1 text-right">
        {currentStep + 1}/{totalSteps}
      </div>
    </div>
  );
};

export default LessonProgress;
