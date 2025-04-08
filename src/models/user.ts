
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  badges: Badge[];
  stats: UserStats;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  achieved: boolean;
  achievedDate?: Date;
}

export interface UserStats {
  lessonsCompleted: number;
  exercisesCompleted: number;
  practiceMinutes: number;
  averageScore: number;
  skillBreakdown: {
    [key: string]: number; // category: score (0-100)
  };
}

// Mock user data
export const MOCK_USER: User = {
  id: "user1",
  name: "Alex Johnson",
  email: "alex@example.com",
  level: 4,
  xp: 350,
  xpToNextLevel: 500,
  streak: 3,
  badges: [
    {
      id: "first-lesson",
      name: "First Step",
      description: "Completed your first lesson",
      icon: "🏆",
      achieved: true,
      achievedDate: new Date(2023, 3, 15)
    },
    {
      id: "three-day-streak",
      name: "On Fire",
      description: "Maintained a 3-day streak",
      icon: "🔥",
      achieved: true,
      achievedDate: new Date()
    },
    {
      id: "storyteller",
      name: "Storyteller",
      description: "Completed all storytelling lessons",
      icon: "📚",
      achieved: false
    }
  ],
  stats: {
    lessonsCompleted: 8,
    exercisesCompleted: 15,
    practiceMinutes: 45,
    averageScore: 78,
    skillBreakdown: {
      "public_speaking": 82,
      "active_listening": 75,
      "storytelling": 65,
      "conflict_resolution": 70
    }
  }
};
