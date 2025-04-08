
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Volume2, MoveHorizontal, Music, MessageSquareText, Pause, XCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { MOCK_LESSONS } from "@/models/lesson";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
  
  const communicationFactors = {
    part1: {
      title: "Lifeblood of Voice",
      description: "The foundational elements that give your voice its power and clarity",
      factors: [
        {
          name: "Rate of Speech",
          icon: <MoveHorizontal className="h-5 w-5 text-communi-primary" />,
          description: "Speaking with one pace can dull your message and confuse listeners. Adjust your speaking pace — speed up to excite, slow down to emphasize."
        },
        {
          name: "Volume",
          icon: <Volume2 className="h-5 w-5 text-communi-primary" />,
          description: "The lifeblood of your voice. Ensure your voice is as big as the room. This requires adjusting your energy to suit your audience."
        }
      ]
    },
    part2: {
      title: "Energizer of Communication",
      description: "Elements that bring emotion and personality to your delivery",
      factors: [
        {
          name: "Pitch",
          icon: <Music className="h-5 w-5 text-communi-secondary" />,
          description: "How high or low your voice sounds. Varying your pitch helps keep your audience engaged and conveys different emotions."
        },
        {
          name: "Tonality",
          icon: <MessageSquareText className="h-5 w-5 text-communi-secondary" />,
          description: "The emotional quality of your voice. It conveys how you feel about what you're saying and helps connect with your audience."
        }
      ]
    },
    part3: {
      title: "Breather of Talking",
      description: "Techniques that provide rhythm and clarity to your speech",
      factors: [
        {
          name: "Pause",
          icon: <Pause className="h-5 w-5 text-communi-tertiary" />,
          description: "Strategic pauses can be powerful. They give your audience time to process information and create emphasis."
        },
        {
          name: "Filler Words",
          icon: <XCircle className="h-5 w-5 text-communi-tertiary" />,
          description: "Words like 'um,' 'uh,' 'like,' can distract from your message. Practice speaking slowly and pausing instead of using fillers."
        }
      ]
    }
  };
  
  const isVocalFoundations = lesson.title === "Vocal Foundations";
  const isPublicSpeakingIntro = lesson.id === "public-speaking-intro";
  
  return (
    <Layout>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            className="p-0 mr-3"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={24} />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">
            {isVocalFoundations ? "Introduction to vocal foundations" : 
             isPublicSpeakingIntro ? "Communication Factors" : 
             lesson.title}
          </h1>
        </div>
        
        <div className="bg-gray-50 p-5 rounded-lg border border-gray-100 mb-6">
          <p className="text-gray-700 leading-relaxed">
            {isPublicSpeakingIntro 
              ? "Your voice is your most powerful communication tool. How you speak significantly impacts how your message is received. Master these six key elements to transform your vocal delivery." 
              : lesson.description}
          </p>
          
          <div className="flex flex-wrap mt-4 text-sm text-gray-500 gap-4">
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-communi-primary rounded-full mr-2"></span>
              <span>{lesson.duration} minutes</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block w-4 h-4 bg-communi-secondary rounded-full mr-2"></span>
              <span className="capitalize">{lesson.level}</span>
            </div>
          </div>
        </div>
        
        {isPublicSpeakingIntro && (
          <div className="mt-6">
            <Tabs defaultValue="part1" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="part1" className="data-[state=active]:bg-blue-50 data-[state=active]:text-communi-primary">
                  Part 1
                </TabsTrigger>
                <TabsTrigger value="part2" className="data-[state=active]:bg-pink-50 data-[state=active]:text-communi-secondary">
                  Part 2
                </TabsTrigger>
                <TabsTrigger value="part3" className="data-[state=active]:bg-green-50 data-[state=active]:text-communi-tertiary">
                  Part 3
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="part1">
                <Card className="border-blue-100">
                  <CardHeader className="bg-blue-50 rounded-t-lg">
                    <CardTitle className="text-xl text-communi-primary">{communicationFactors.part1.title}</CardTitle>
                    <CardDescription>{communicationFactors.part1.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <TooltipProvider>
                      <ul className="space-y-6">
                        {communicationFactors.part1.factors.map((factor, index) => (
                          <li key={index} className="group">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 p-2 bg-blue-50 rounded-full">
                                {factor.icon}
                              </div>
                              <div className="flex-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-3">
                                      <h3 className="text-lg font-medium">{factor.name}</h3>
                                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs opacity-70 group-hover:opacity-100">?</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p>{factor.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="mt-1 hidden sm:block text-gray-600 text-sm">{factor.description}</div>
                              </div>
                              <div className="flex h-5 items-center">
                                <Checkbox id={`topic1-${index}`} disabled checked={false} />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </TooltipProvider>
                    <Button 
                      className="w-full mt-6 bg-communi-primary hover:bg-blue-600 text-white"
                      onClick={() => navigate(`/lessons/${lessonId}/learn?part=1&step=1`)}
                    >
                      Start Part 1
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="part2">
                <Card className="border-pink-100">
                  <CardHeader className="bg-pink-50 rounded-t-lg">
                    <CardTitle className="text-xl text-communi-secondary">{communicationFactors.part2.title}</CardTitle>
                    <CardDescription>{communicationFactors.part2.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <TooltipProvider>
                      <ul className="space-y-6">
                        {communicationFactors.part2.factors.map((factor, index) => (
                          <li key={index} className="group">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 p-2 bg-pink-50 rounded-full">
                                {factor.icon}
                              </div>
                              <div className="flex-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-3">
                                      <h3 className="text-lg font-medium">{factor.name}</h3>
                                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs opacity-70 group-hover:opacity-100">?</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p>{factor.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="mt-1 hidden sm:block text-gray-600 text-sm">{factor.description}</div>
                              </div>
                              <div className="flex h-5 items-center">
                                <Checkbox id={`topic2-${index}`} disabled checked={false} />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </TooltipProvider>
                    <Button 
                      className="w-full mt-6 bg-communi-secondary hover:bg-pink-600 text-white"
                      onClick={() => navigate(`/lessons/${lessonId}/learn?part=2`)}
                    >
                      Start Part 2
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="part3">
                <Card className="border-green-100">
                  <CardHeader className="bg-green-50 rounded-t-lg">
                    <CardTitle className="text-xl text-communi-tertiary">{communicationFactors.part3.title}</CardTitle>
                    <CardDescription>{communicationFactors.part3.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <TooltipProvider>
                      <ul className="space-y-6">
                        {communicationFactors.part3.factors.map((factor, index) => (
                          <li key={index} className="group">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0 p-2 bg-green-50 rounded-full">
                                {factor.icon}
                              </div>
                              <div className="flex-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center space-x-3">
                                      <h3 className="text-lg font-medium">{factor.name}</h3>
                                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs opacity-70 group-hover:opacity-100">?</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-sm">
                                    <p>{factor.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                                <div className="mt-1 hidden sm:block text-gray-600 text-sm">{factor.description}</div>
                              </div>
                              <div className="flex h-5 items-center">
                                <Checkbox id={`topic3-${index}`} disabled checked={false} />
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </TooltipProvider>
                    <Button 
                      className="w-full mt-6 bg-communi-tertiary hover:bg-green-600 text-white"
                      onClick={() => navigate(`/lessons/${lessonId}/learn?part=3`)}
                    >
                      Start Part 3
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
