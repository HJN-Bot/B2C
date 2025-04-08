
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Mic, BookOpen, Star, Shield } from "lucide-react";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_LESSONS, Lesson, LessonCategory } from "@/models/lesson";
import { cn } from "@/lib/utils";

const Lessons = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const categories: { id: string; label: string; icon: React.ElementType }[] = [
    { id: "all", label: "All", icon: BookOpen },
    { id: "public_speaking", label: "Public Speaking", icon: Mic },
    { id: "active_listening", label: "Active Listening", icon: BookOpen },
    { id: "storytelling", label: "Storytelling", icon: Star },
    { id: "conflict_resolution", label: "Conflict Resolution", icon: Shield }
  ];
  
  const filteredLessons = MOCK_LESSONS.filter(lesson => {
    // Filter by search query
    const matchesSearch = searchQuery === "" || 
      lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lesson.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = activeCategory === "all" || 
      lesson.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  return (
    <Layout>
      <div className="p-4 space-y-5">
        <h1 className="text-2xl font-bold">Lessons</h1>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input 
            placeholder="Search lessons" 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Categories */}
        <div className="overflow-x-auto pb-2">
          <div className="flex space-x-2 min-w-max">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = activeCategory === category.id;
              
              return (
                <Button
                  key={category.id}
                  variant={isActive ? "default" : "outline"}
                  className={cn(
                    "px-3 py-1 h-auto",
                    isActive ? "bg-communi-primary" : ""
                  )}
                  onClick={() => setActiveCategory(category.id)}
                >
                  <Icon size={16} className="mr-2" />
                  {category.label}
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Lessons List */}
        <Tabs defaultValue="all">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="all">All Levels</TabsTrigger>
            <TabsTrigger value="beginner">Beginner</TabsTrigger>
            <TabsTrigger value="intermediate">Intermediate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-3 mt-4">
            {filteredLessons.length > 0 ? (
              filteredLessons.map((lesson) => (
                <LessonCard 
                  key={lesson.id} 
                  lesson={lesson} 
                  onClick={() => navigate(`/lessons/${lesson.id}`)}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No lessons found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="beginner" className="space-y-3 mt-4">
            {filteredLessons.filter(l => l.level === "beginner").length > 0 ? (
              filteredLessons
                .filter(l => l.level === "beginner")
                .map((lesson) => (
                  <LessonCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    onClick={() => navigate(`/lessons/${lesson.id}`)}
                  />
                ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No beginner lessons found</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="intermediate" className="space-y-3 mt-4">
            {filteredLessons.filter(l => l.level === "intermediate").length > 0 ? (
              filteredLessons
                .filter(l => l.level === "intermediate")
                .map((lesson) => (
                  <LessonCard 
                    key={lesson.id} 
                    lesson={lesson} 
                    onClick={() => navigate(`/lessons/${lesson.id}`)}
                  />
                ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No intermediate lessons found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const LessonCard = ({ lesson, onClick }: { lesson: Lesson; onClick: () => void }) => {
  const getCategoryIcon = (category: LessonCategory) => {
    switch (category) {
      case "public_speaking":
        return <Mic size={20} className="text-communi-primary" />;
      case "active_listening":
        return <BookOpen size={20} className="text-communi-tertiary" />;
      case "storytelling":
        return <Star size={20} className="text-communi-quaternary" />;
      case "conflict_resolution":
        return <Shield size={20} className="text-communi-secondary" />;
      default:
        return <BookOpen size={20} className="text-communi-primary" />;
    }
  };
  
  const getCategoryClass = (category: LessonCategory) => {
    switch (category) {
      case "public_speaking":
        return "bg-communi-primary/10 text-communi-primary";
      case "active_listening":
        return "bg-communi-tertiary/10 text-communi-tertiary";
      case "storytelling":
        return "bg-communi-quaternary/10 text-communi-quaternary";
      case "conflict_resolution":
        return "bg-communi-secondary/10 text-communi-secondary";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };
  
  return (
    <div className="module-card cursor-pointer" onClick={onClick}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium">{lesson.title}</h3>
        <span className="badge text-xs px-2 py-1 rounded-full bg-gray-100">
          {lesson.duration} min
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3">{lesson.description}</p>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <div className={cn(
            "rounded-full p-1.5 mr-2",
            getCategoryClass(lesson.category)
          )}>
            {getCategoryIcon(lesson.category)}
          </div>
          <span className="text-xs capitalize">
            {lesson.category.replace("_", " ")}
          </span>
        </div>
        
        <span className={cn(
          "text-xs px-2 py-0.5 rounded-full",
          lesson.level === "beginner" ? "bg-blue-100 text-blue-700" :
          lesson.level === "intermediate" ? "bg-yellow-100 text-yellow-700" :
          "bg-red-100 text-red-700"
        )}>
          {lesson.level}
        </span>
      </div>
      
      {lesson.progress > 0 && (
        <div className="progress-bar mt-3">
          <div 
            className="progress-value" 
            style={{ width: `${lesson.progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default Lessons;
