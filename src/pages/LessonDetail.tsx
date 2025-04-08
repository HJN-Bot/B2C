
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Volume2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MOCK_LESSONS } from "@/models/lesson";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";

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
  
  const vocalFoundationsPart1 = [
    "Rate of Speech",
    "Volume",
    "Pitch",
    "Melody"
  ];

  const vocalFoundationsPart2 = [
    "Tonality",
    "Pause",
    "Filler Words"
  ];
  
  const isVocalFoundations = lesson.title === "Vocal Foundations";
  const isPublicSpeakingIntro = lesson.id === "public-speaking-intro";

  const handleStartLessonPart = (part: string, specificTopic?: string) => {
    toast({
      title: specificTopic ? `Starting: ${specificTopic}` : `Lesson Started`,
      description: specificTopic 
        ? `You're now learning about ${specificTopic}, a key component of vocal delivery.` 
        : `You've started Part ${part} of the lesson.`,
    });
    // Directly navigate to progress instead of the lesson learning page
    navigate("/progress");
  };
  
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
            {isVocalFoundations ? "Introduction to vocal foundations" : 
             isPublicSpeakingIntro ? "6 factors of vocal foundations" : 
             lesson.title}
          </h1>
        </div>
        
        <p className="text-gray-600">
          {isPublicSpeakingIntro 
            ? "Your voice is your most powerful communication tool. The way you speak can significantly impact how your message is received. In this lesson, we'll explore the key components of effective vocal delivery." 
            : lesson.description}
        </p>
        
        <div className="text-sm text-gray-500 flex space-x-4">
          <span>{lesson.duration} minutes</span>
          <span className="capitalize">{lesson.level}</span>
        </div>
        
        {isPublicSpeakingIntro && (
          <div className="mt-6">
            <Tabs defaultValue="part1" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="part1">Part 1</TabsTrigger>
                <TabsTrigger value="part2">Part 2</TabsTrigger>
              </TabsList>
              <TabsContent value="part1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Rate, Volume, Pitch & Melody</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {vocalFoundationsPart1.map((topic, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="flex h-5 items-center">
                            <Checkbox id={`topic1-${index}`} disabled checked={false} />
                          </div>
                          <label htmlFor={`topic1-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {topic}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-4 bg-blue-100 text-blue-700 hover:bg-blue-200"
                      onClick={() => handleStartLessonPart("1", "Rate of Speech")}
                    >
                      Start Part 1
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="part2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Tonality, Pause & Filler Words</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {vocalFoundationsPart2.map((topic, index) => (
                        <li key={index} className="flex items-center space-x-3">
                          <div className="flex h-5 items-center">
                            <Checkbox id={`topic2-${index}`} disabled checked={false} />
                          </div>
                          <label htmlFor={`topic2-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {topic}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-4 bg-blue-100 text-blue-700 hover:bg-blue-200"
                      onClick={() => handleStartLessonPart("2", "Tonality")}
                    >
                      Start Part 2
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {isVocalFoundations && (
          <div className="space-y-4 mt-6 bg-gray-50 p-4 rounded-lg">
            <h2 className="text-lg font-semibold">What you'll learn:</h2>
            <ul className="space-y-3">
              {vocalFoundationsPart1.concat(vocalFoundationsPart2).map((topic, index) => (
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
        
        {!isPublicSpeakingIntro && (
          <div className="mt-6 pt-4 border-t">
            <Button 
              className="w-full bg-blue-100 text-blue-700 hover:bg-blue-200"
              onClick={() => handleStartLessonPart("all")}
            >
              Start
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default LessonDetail;
