
import { useState } from "react";
import { Award, TrendingUp, Calendar, CheckCircle } from "lucide-react";
import Layout from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MOCK_USER } from "@/models/user";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const ProgressPage = () => {
  const [user] = useState(MOCK_USER);
  
  const Streak = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Current Streak</h3>
          <span className="text-xl font-bold text-communi-primary">{user.streak} days</span>
        </div>
        <div className="flex justify-between mt-4">
          {Array.from({ length: 7 }).map((_, i) => {
            const isActive = i < user.streak;
            const isToday = i === user.streak - 1;
            return (
              <div key={i} className="flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isActive ? "bg-communi-primary text-white" : "bg-gray-100",
                  isToday && "animate-pulse-light"
                )}>
                  {isActive ? <CheckCircle size={16} /> : (i + 1)}
                </div>
                <span className="text-xs mt-1">
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
  
  return (
    <Layout>
      <div className="p-4 space-y-5">
        <h1 className="text-2xl font-bold">My Progress</h1>
        
        <Streak />
        
        <Tabs defaultValue="stats">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
          </TabsList>
          
          <TabsContent value="stats" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <StatCard 
                icon={<Calendar className="text-communi-primary" />}
                label="Lessons Completed"
                value={user.stats.lessonsCompleted}
              />
              <StatCard 
                icon={<CheckCircle className="text-communi-tertiary" />}
                label="Exercises Done"
                value={user.stats.exercisesCompleted}
              />
              <StatCard 
                icon={<TrendingUp className="text-communi-quaternary" />}
                label="Minutes Practiced"
                value={user.stats.practiceMinutes}
              />
              <StatCard 
                icon={<Award className="text-communi-secondary" />}
                label="Average Score"
                value={`${user.stats.averageScore}%`}
              />
            </div>
            
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Level Progress</h3>
                  <span className="text-sm">Level {user.level}</span>
                </div>
                <div className="mb-2 flex justify-between text-sm">
                  <span>{user.xp} XP</span>
                  <span>{user.xpToNextLevel} XP</span>
                </div>
                <Progress value={(user.xp / user.xpToNextLevel) * 100} className="h-2" />
                <p className="text-xs text-center mt-2 text-gray-500">
                  {user.xpToNextLevel - user.xp} XP until next level
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="skills" className="space-y-4 pt-4">
            {Object.entries(user.stats.skillBreakdown).map(([key, value]) => (
              <div key={key} className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium capitalize">
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm font-medium">
                    {value}/100
                  </span>
                </div>
                <Progress value={value} className="h-2" />
              </div>
            ))}
          </TabsContent>
          
          <TabsContent value="badges" className="pt-4">
            <div className="grid grid-cols-2 gap-3">
              {user.badges.map((badge) => (
                <div 
                  key={badge.id}
                  className={cn(
                    "border rounded-lg p-3 text-center",
                    badge.achieved ? "bg-white" : "bg-gray-50 opacity-70"
                  )}
                >
                  <div className="text-3xl mb-1">{badge.icon}</div>
                  <h3 className="font-medium text-sm">{badge.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  {badge.achieved && (
                    <div className="mt-2 text-xs text-communi-secondary">
                      <CheckCircle size={14} className="inline mr-1" /> Achieved
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

const StatCard = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <Card>
    <CardContent className="p-3 flex items-center space-x-3">
      <div className="bg-gray-100 p-2 rounded-full">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);

export default ProgressPage;
