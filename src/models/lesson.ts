
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
    duration: 15,
    slides: [
      {
        id: "al-intro-1",
        type: "text",
        content: "Active listening is the foundation of meaningful connection. It requires your full attention, genuine curiosity, and a commitment to understanding before responding."
      },
      {
        id: "al-intro-2",
        type: "text",
        content: "The 75/25 rule: In effective conversations, you should be listening 75% of the time and speaking only 25% of the time. Quality communication is more about understanding than being understood."
      },
      {
        id: "al-techniques-1",
        type: "text",
        content: "Technique #1: Reflective Listening - Paraphrase what you've heard to confirm understanding, starting with phrases like 'So what you're saying is...' or 'It sounds like you feel...'"
      },
      {
        id: "al-techniques-2",
        type: "text",
        content: "Technique #2: Ask Open-Ended Questions - Questions that require more than a yes/no answer encourage deeper sharing. 'What was that experience like for you?' instead of 'Did you like it?'"
      },
      {
        id: "al-techniques-3",
        type: "text",
        content: "Technique #3: Mindful Presence - Put away distractions, maintain appropriate eye contact, and use affirming body language that shows you're fully engaged."
      }
    ],
    exercises: [
      {
        id: "al-ex-1",
        title: "The Mirror Exercise",
        description: "Practice reflecting back what someone says without adding your own interpretation.",
        type: "recording",
        prompt: "Listen to this statement: 'I've been overwhelmed lately with all my responsibilities and don't feel like I have time for myself.' Now reflect it back, starting with 'What I'm hearing is...'",
        completed: false
      },
      {
        id: "al-ex-2",
        title: "Open-Ended Question Transformation",
        description: "Convert closed questions into open-ended ones that encourage deeper conversation.",
        type: "writing",
        prompt: "Transform these closed questions into open-ended ones: 1) Did you have a good weekend? 2) Was the meeting productive? 3) Are you upset about what happened?",
        completed: false
      },
      {
        id: "al-ex-3",
        title: "Active Listening Self-Assessment",
        description: "Identify your listening barriers and strengths.",
        type: "multiple_choice",
        prompt: "Which of these listening barriers do you most often experience? A) Formulating a response while the other person is still talking, B) Getting distracted by environmental factors, C) Judging the speaker's message before they finish, D) Focusing on facts while missing emotional cues",
        completed: false
      },
      {
        id: "al-ex-4",
        title: "Empathy in Action",
        description: "Practice showing empathy through your listening response.",
        type: "recording",
        prompt: "Respond with empathy to this statement: 'I applied for a promotion I really wanted but didn't get it. I'm trying not to take it personally, but it's hard.'",
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
