
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Volume2, BookOpen } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MOCK_LESSONS } from "@/models/lesson";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
            <h1 className="text-2xl font-bold text-gray-800">Lesson Not Found</h1>
          </div>
          <p className="text-gray-600">The lesson you're looking for doesn't exist.</p>
        </div>
      </Layout>
    );
  }
  
  const vocalFoundationsPart1 = [
    "Rate of Speech",
    "Volume",
    "Pitch"
  ];

  const vocalFoundationsPart2 = [
    "Tonality",
    "Pause",
    "Filler Words"
  ];
  
  const isVocalFoundations = lesson.title === "Vocal Foundations";
  const isPublicSpeakingIntro = lesson.id === "public-speaking-intro";
  
  return (
    <Layout>
      <div className="p-4 space-y-5 bg-gradient-to-br from-white to-blue-50 min-h-[calc(100vh-64px)]">
        <div className="flex items-center mb-4">
          <Button 
            variant="ghost" 
            className="p-0 mr-2 text-blue-700 hover:bg-blue-50"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl font-bold text-blue-700">
            {isVocalFoundations ? "Introduction to vocal foundations" : 
             isPublicSpeakingIntro ? "6 factors of vocal foundations" : 
             lesson.title}
          </h1>
        </div>
        
        <Card className="border-none shadow-md bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <Volume2 className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-gray-700 text-lg font-medium">
                {isPublicSpeakingIntro 
                  ? "Sticking to one pace can dull your message and confuse listeners. Adjust your speaking pace — speed up to excite, slow down to emphasize. Keep it varied to hold attention and clarify your message!" 
                  : lesson.description}
              </p>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4 border-t pt-4">
              <div className="flex items-center">
                <BookOpen size={16} className="mr-1 text-blue-500" />
                <span>{lesson.duration} minutes</span>
              </div>
              <div className="flex items-center">
                <CheckCircle size={16} className="mr-1 text-blue-500" />
                <span className="capitalize">{lesson.level}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {isPublicSpeakingIntro && (
          <div className="mt-6">
            <Tabs defaultValue="part1" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-blue-50">
                <TabsTrigger value="part1" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Part 1</TabsTrigger>
                <TabsTrigger value="part2" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Part 2</TabsTrigger>
              </TabsList>
              <TabsContent value="part1">
                <Card className="border border-blue-100 shadow-sm">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 p-4">
                    <CardTitle className="text-base text-blue-700">Rate, Volume & Pitch</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <ul className="space-y-3">
                      {vocalFoundationsPart1.map((topic, index) => (
                        <li key={index} className="flex items-center space-x-3 hover:bg-blue-50 p-2 rounded-md transition-colors">
                          <div className="flex h-5 items-center">
                            <Checkbox id={`topic1-${index}`} disabled checked={false} className="border-blue-300" />
                          </div>
                          <label htmlFor={`topic1-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">
                            {topic}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate(`/lessons/${lessonId}/learn?part=1&step=1`)}
                    >
                      Start Part 1
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="part2">
                <Card className="border border-blue-100 shadow-sm">
                  <CardHeader className="bg-blue-50 border-b border-blue-100 p-4">
                    <CardTitle className="text-base text-blue-700">Tonality, Pause & Filler Words</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <ul className="space-y-3">
                      {vocalFoundationsPart2.map((topic, index) => (
                        <li key={index} className="flex items-center space-x-3 hover:bg-blue-50 p-2 rounded-md transition-colors">
                          <div className="flex h-5 items-center">
                            <Checkbox id={`topic2-${index}`} disabled checked={false} className="border-blue-300" />
                          </div>
                          <label htmlFor={`topic2-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">
                            {topic}
                          </label>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => navigate(`/lessons/${lessonId}/learn?part=2`)}
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
          <div className="space-y-4 mt-6 bg-white p-5 rounded-lg border border-blue-100 shadow-sm">
            <h2 className="text-lg font-semibold text-blue-700 flex items-center">
              <BookOpen size={18} className="mr-2" />
              What you'll learn:
            </h2>
            <ul className="space-y-3">
              {vocalFoundationsPart1.concat(vocalFoundationsPart2).map((topic, index) => (
                <li key={index} className="flex items-center space-x-3 hover:bg-blue-50 p-2 rounded-md transition-colors">
                  <div className="flex h-5 items-center">
                    <Checkbox id={`topic-${index}`} disabled checked={false} className="border-blue-300" />
                  </div>
                  <label htmlFor={`topic-${index}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700">
                    {topic}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {!isPublicSpeakingIntro && (
          <div className="mt-6 pt-4">
            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md"
              onClick={() => navigate(`/lessons/${lessonId}/learn`)}
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
