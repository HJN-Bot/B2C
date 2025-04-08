
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Star, Mic, BookOpen, Award, Volume2 } from "lucide-react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MOCK_USER } from "@/models/user";
import { MOCK_LESSONS } from "@/models/lesson";
import { cn } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(MOCK_USER);
  const [greeting, setGreeting] = useState("");
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);
  
  const allLessons = [
    ...MOCK_LESSONS.map(lesson => {
      // Change the lesson title if it's "Introduction to Public Speaking"
      if (lesson.title === "Introduction to Public Speaking") {
        return {
          ...lesson,
          title: "Vocal Foundations",
          category: "articulation"
        };
      }
      return lesson;
    }),
    {
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
    }
  ];
  
  // Filter out duplicates (in case we already have Vocal Foundations)
  const uniqueLessons = allLessons.filter((lesson, index, self) => 
    index === self.findIndex((l) => l.title === lesson.title)
  );
  
  const recommendedLessons = uniqueLessons.slice(0, 3);
  
  return (
    <Layout>
      <div className="p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{greeting}, {user.name}</h1>
            <p className="text-gray-500">Level {user.level} • {user.streak} day streak 🔥</p>
          </div>
          <div 
            className="w-12 h-12 rounded-full bg-gray-200 cursor-pointer"
            onClick={() => navigate("/profile")}
          >
            {/* Profile Avatar placeholder */}
          </div>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">XP Progress</span>
              <span className="text-sm text-gray-500">{user.xp}/{user.xpToNextLevel} XP</span>
            </div>
            <Progress value={(user.xp / user.xpToNextLevel) * 100} className="h-2" />
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-3 gap-4">
          <Button 
            variant="outline" 
            className="h-auto flex flex-col items-center py-4 space-y-2"
            onClick={() => navigate("/lessons")}
          >
            <BookOpen size={24} className="text-communi-primary" />
            <span className="text-xs">Lessons</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto flex flex-col items-center py-4 space-y-2"
            onClick={() => navigate("/practice")}
          >
            <Mic size={24} className="text-communi-secondary" />
            <span className="text-xs">Practice</span>
          </Button>
          
          <Button 
            variant="outline" 
            className="h-auto flex flex-col items-center py-4 space-y-2"
            onClick={() => navigate("/progress")}
          >
            <Award size={24} className="text-communi-tertiary" />
            <span className="text-xs">Progress</span>
          </Button>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Continue Learning</h2>
            <Button 
              variant="ghost" 
              className="p-0 h-auto text-sm text-communi-primary flex items-center"
              onClick={() => navigate("/lessons")}
            >
              See all <ChevronRight size={16} />
            </Button>
          </div>
          
          <div className="space-y-3">
            {recommendedLessons.map((lesson) => (
              <div 
                key={lesson.id}
                className="module-card flex items-center cursor-pointer"
                onClick={() => navigate(`/lessons/${lesson.id}`)}
              >
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center mr-4",
                  lesson.category === "public_speaking" ? "bg-communi-primary/20" :
                  lesson.category === "active_listening" ? "bg-communi-tertiary/20" :
                  lesson.category === "storytelling" ? "bg-communi-quaternary/20" :
                  lesson.category === "articulation" ? "bg-communi-secondary/20" :
                  "bg-communi-secondary/20"
                )}>
                  {lesson.category === "public_speaking" && <Mic size={24} className="text-communi-primary" />}
                  {lesson.category === "active_listening" && <BookOpen size={24} className="text-communi-tertiary" />}
                  {lesson.category === "storytelling" && <Star size={24} className="text-communi-quaternary" />}
                  {lesson.category === "articulation" && <Volume2 size={24} className="text-communi-secondary" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{lesson.title}</h3>
                  <p className="text-xs text-gray-500">{lesson.duration} min • {lesson.level}</p>
                  <div className="progress-bar mt-1">
                    <div 
                      className="progress-value" 
                      style={{ width: `${lesson.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-3">Daily Challenge</h2>
          <Card className="bg-gradient-to-r from-communi-primary/20 to-communi-tertiary/20 border-none">
            <CardContent className="p-4">
              <h3 className="font-medium">Practice Active Listening</h3>
              <p className="text-sm mt-1 mb-3">Have a 2-minute conversation where you practice rephrasing what the other person said.</p>
              <Button 
                className="bg-white text-communi-primary hover:bg-gray-100"
                onClick={() => navigate("/practice")}
              >
                Start Challenge
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
