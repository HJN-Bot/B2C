export interface Lesson {
  id: string;
  title: string;
  description: string;
  category: LessonCategory;
  level: LessonLevel;
  duration: number; // in minutes
  slides: LessonSlide[];
  exercises: Exercise[];
  completed: boolean;
  progress: number; // 0-100
}

export type LessonCategory = 
  | "public_speaking" 
  | "conflict_resolution" 
  | "storytelling" 
  | "active_listening" 
  | "non_violent_communication" 
  | "articulation";

export type LessonLevel = "beginner" | "intermediate" | "advanced";

export interface LessonSlide {
  id: string;
  type: "text" | "video" | "image" | "quiz";
  content: string;
  mediaUrl?: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  type: "recording" | "writing" | "multiple_choice";
  prompt: string;
  completed: boolean;
}

// Mock data
export const MOCK_LESSONS: Lesson[] = [
  {
    id: "public-speaking-intro",
    title: "Introduction to Public Speaking",
    description: "Learn the basics of effective public speaking and overcome stage fright.",
    category: "public_speaking",
    level: "beginner",
    duration: 10,
    slides: [
      {
        id: "ps-intro-1",
        type: "text",
        content: "Public speaking is a vital skill in both personal and professional life. This lesson will introduce you to the fundamentals."
      },
      {
        id: "ps-intro-2",
        type: "text",
        content: "The three pillars of public speaking are: 1) Clear structure, 2) Confident delivery, and 3) Engaging content."
      }
    ],
    exercises: [
      {
        id: "ps-ex-1",
        title: "Your First 30-Second Introduction",
        description: "Practice introducing yourself clearly and confidently in 30 seconds.",
        type: "recording",
        prompt: "Introduce yourself, mention what you do, and share one interesting fact about yourself in 30 seconds.",
        completed: false
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: "active-listening-basics",
    title: "The Art of Active Listening",
    description: "Transform your communication skills by mastering the essential techniques of truly hearing and understanding others.",
    category: "active_listening",
    level: "beginner",
    duration: 12,
    slides: [
      {
        id: "al-intro-1",
        type: "text",
        content: "Active listening is more than just hearing words—it's about fully engaging with the speaker, understanding their perspective, and showing genuine empathy."
      },
      {
        id: "al-intro-2",
        type: "text",
        content: "The core principles of active listening include: maintaining eye contact, providing verbal and non-verbal feedback, and suspending judgment."
      }
    ],
    exercises: [
      {
        id: "al-ex-1",
        title: "Empathetic Paraphrasing",
        description: "Practice reflecting back what you've heard to ensure understanding and show you're truly listening.",
        type: "recording",
        prompt: "Listen carefully to a partner describing a recent challenge. Then, paraphrase their story, focusing on their emotions and key points.",
        completed: false
      },
      {
        id: "al-ex-2",
        title: "Non-Verbal Communication Awareness",
        description: "Learn to recognize and use non-verbal cues that enhance active listening.",
        type: "recording",
        prompt: "Have a conversation with a partner and pay attention to your body language, facial expressions, and nodding to show you're engaged.",
        completed: false
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: "storytelling-structure",
    title: "Crafting Compelling Stories",
    description: "Learn the essential structure of engaging stories that captivate your audience.",
    category: "storytelling",
    level: "intermediate",
    duration: 12,
    slides: [
      {
        id: "st-intro-1",
        type: "text",
        content: "A good story has a clear beginning, middle, and end, with a compelling character who faces a challenge."
      }
    ],
    exercises: [
      {
        id: "st-ex-1",
        title: "Your Personal Story",
        description: "Create and tell a short personal story that follows the structure we learned.",
        type: "recording",
        prompt: "Share a 1-minute personal story about a time when you overcame a challenge.",
        completed: false
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: "conflict-resolution-intro",
    title: "Navigating Difficult Conversations",
    description: "Master the art of resolving conflicts and having productive difficult conversations.",
    category: "conflict_resolution",
    level: "intermediate",
    duration: 15,
    slides: [
      {
        id: "cr-intro-1",
        type: "text",
        content: "Conflict is natural, but how we handle it determines whether it becomes destructive or constructive."
      }
    ],
    exercises: [
      {
        id: "cr-ex-1",
        title: "Addressing a Disagreement",
        description: "Practice expressing your position in a disagreement without escalating tension.",
        type: "recording",
        prompt: "Role-play addressing a disagreement with a colleague about a project approach.",
        completed: false
      }
    ],
    completed: false,
    progress: 0
  }
];
