
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Volume2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MOCK_LESSONS } from "@/models/lesson";
import { Checkbox } from "@/components/ui/checkbox";

const LessonDetail = () => {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  
  // Find the lesson or create a new one for vocal foundations
  let lesson = MOCK_LESSONS.find((l) => l.id === lessonId);
  
  if (lessonId === "vocal-foundations" || (lesson && lesson.title === "Vocal Foundations")) {
    lesson = {
      id: "vocal-foundations",
      title: "Vocal Foundations",
      description: "Creating a strong and versatile speaking voice.",
      category: "articulation",
      level: "beginner",
      duration: 15,
      slides: [],
      exercises: [],
      completed: false,
      progress: 0
    };
  }
  
  if (!lesson) {
    return (
      <Layout>
        <div className="p-4">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              className="p-0 mr-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft size={24} />
            </Button>
            <h1 className="text-2xl font-bold">Lesson Not Found</h1>
          </div>
          <p>The lesson you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }
  
  const vocalFoundationTopics = [
    "Rate of Speech",
    "Volume",
    "Pitch",
    "Tonality",
    "Pause"
  ];
  
  const isVocalFoundations = lesson.title === "Vocal Foundations";
  
  return (
    <Layout>
      <div className="p-4 space-y-5">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            className="p-0 mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold">
            {isVocalFoundations ? "Introduction to vocal foundations" : lesson.title}
          </h1>
        </div>
        
        <p className="text-gray-600">{lesson.description}</p>
        
        <div className="text-sm text-gray-500 flex space-x-4">
          <span>{lesson.duration} minutes</span>
          <span className="capitalize">{lesson.level}</span>
        </div>
        
        {isVocalFoundations && (
          <div className="space-y-4 mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">What you'll learn:</h2>
            <ul className="space-y-3">
              {vocalFoundationTopics.map((topic, index) => (
                <li key={index} className="flex items-center space-x-3">
                  <div className="flex h-5 items-center">
                    <Checkbox id={`topic-${index}`} disabled checked={false} />
                  </div>
                  <label htmlFor={`topic-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {topic}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6 pt-4 border-t">
          <Button 
            className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200"
            onClick={() => navigate(`/lessons/${lessonId}/learn`)}
          >
            Start
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default LessonDetail;
