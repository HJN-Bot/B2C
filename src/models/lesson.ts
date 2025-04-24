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
    description: "Master the art of storytelling by learning essential narrative structures, character development, and emotional engagement techniques that captivate your audience.",
    category: "storytelling",
    level: "intermediate",
    duration: 20,
    slides: [
      {
        id: "st-intro-1",
        type: "text",
        content: "Effective storytelling is built on three pillars: Structure, Emotion, and Purpose. Every great story, whether personal or professional, needs these elements to resonate with its audience."
      },
      {
        id: "st-structure-1",
        type: "text",
        content: "The Classic Story Arc: 1) Hook - Grab attention with an intriguing opening, 2) Build - Develop tension through challenges, 3) Climax - Reach the key moment of change, 4) Resolution - Share the lessons learned or transformation."
      },
      {
        id: "st-emotion-1",
        type: "text",
        content: "Emotional connection is created through: Authenticity - Being genuine in your delivery, Vulnerability - Sharing real challenges or mistakes, Relatability - Finding universal themes that connect with your audience."
      },
      {
        id: "st-technique-1",
        type: "text",
        content: "Key storytelling techniques: Use sensory details to make scenes vivid, Create tension through pacing, Include dialogue to bring characters to life, Show don't tell - let audiences draw their own conclusions."
      }
    ],
    exercises: [
      {
        id: "st-ex-1",
        title: "Story Structure Practice",
        description: "Create a brief story following the classic arc structure",
        type: "writing",
        prompt: "Write a 2-minute story about a challenging moment in your life. Include: 1) An attention-grabbing opening, 2) The challenge you faced, 3) The turning point, 4) What you learned. Focus on making each part distinct and compelling.",
        completed: false
      },
      {
        id: "st-ex-2",
        title: "Emotional Engagement",
        description: "Practice creating emotional resonance in storytelling",
        type: "recording",
        prompt: "Tell a story about a time you made a mistake and what you learned from it. Focus on being vulnerable and authentic, and include how you felt at each stage of the story.",
        completed: false
      },
      {
        id: "st-ex-3",
        title: "Descriptive Detail",
        description: "Enhance your story with vivid sensory details",
        type: "writing",
        prompt: "Describe a significant moment in your life using all five senses. What did you see, hear, smell, taste, and feel? How did these details contribute to the emotional impact of the moment?",
        completed: false
      },
      {
        id: "st-ex-4",
        title: "Dialogue Integration",
        description: "Practice incorporating dialogue into your stories",
        type: "recording",
        prompt: "Tell a story about an important conversation in your life. Include actual dialogue to bring the scene to life, focusing on the key exchanges that moved the story forward.",
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
  },
  {
    id: "non-violent-communication",
    title: "Non-Violent Communication Basics",
    description: "Learn how to communicate with empathy and clarity while avoiding conflict triggers.",
    category: "non_violent_communication",
    level: "intermediate",
    duration: 20,
    slides: [
      {
        id: "nvc-intro-1",
        type: "text",
        content: "Non-violent communication (NVC) is a method that helps us connect with ourselves and others from the heart, creating mutual understanding and respect."
      },
      {
        id: "nvc-principles",
        type: "text",
        content: "The four components of NVC are: 1) Observation without judgment, 2) Feelings identification, 3) Needs expression, and 4) Making clear requests."
      },
      {
        id: "nvc-examples",
        type: "text",
        content: "Instead of 'You never listen to me' (judgment), try 'When I share my concerns and don't receive a response (observation), I feel discouraged (feeling) because I need understanding (need). Would you be willing to share what you heard me say? (request)'"
      }
    ],
    exercises: [
      {
        id: "nvc-ex-1",
        title: "Transforming Judgments to Observations",
        description: "Practice converting judgmental statements into objective observations.",
        type: "writing",
        prompt: "Transform these judgments into observations: 1) 'You're always late' 2) 'They're lazy' 3) 'She's inconsiderate'",
        completed: false
      },
      {
        id: "nvc-ex-2",
        title: "Expressing Needs Clearly",
        description: "Practice expressing needs without criticism or demand.",
        type: "recording",
        prompt: "Express a need you have at work or in a relationship using the NVC format: observation, feeling, need, and request.",
        completed: false
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: "voice-articulation",
    title: "Clear Speech and Articulation",
    description: "Master the art of clear pronunciation and speech delivery for effective communication.",
    category: "articulation",
    level: "beginner",
    duration: 15,
    slides: [
      {
        id: "art-intro-1",
        type: "text",
        content: "Clear articulation is fundamental to effective communication. It involves precise pronunciation, appropriate pace, and mindful breathing."
      },
      {
        id: "art-techniques",
        type: "text",
        content: "Key techniques: 1) Tongue twisters for flexibility, 2) Diaphragmatic breathing for support, 3) Resonance exercises for voice projection."
      },
      {
        id: "art-practice",
        type: "text",
        content: "Daily practice tip: Read aloud for 5 minutes each day, focusing on clear endings of words and appropriate pausing between phrases."
      }
    ],
    exercises: [
      {
        id: "art-ex-1",
        title: "Tongue Twister Challenge",
        description: "Practice articulation with progressive tongue twisters.",
        type: "recording",
        prompt: "Record yourself saying: 'She sells seashells by the seashore' three times, gradually increasing speed while maintaining clarity.",
        completed: false
      },
      {
        id: "art-ex-2",
        title: "Pace and Clarity",
        description: "Practice speaking clearly at different speeds.",
        type: "recording",
        prompt: "Read the provided paragraph at three different speeds while maintaining clear articulation.",
        completed: false
      }
    ],
    completed: false,
    progress: 0
  },
  {
    id: "storytelling-advanced",
    title: "Advanced Storytelling Techniques",
    description: "Master advanced narrative techniques to create compelling and memorable stories.",
    category: "storytelling",
    level: "advanced",
    duration: 25,
    slides: [
      {
        id: "st-adv-1",
        type: "text",
        content: "Advanced storytelling involves creating emotional resonance, using vivid imagery, and mastering narrative pacing."
      },
      {
        id: "st-adv-2",
        type: "text",
        content: "The Hero's Journey structure: 1) The Call to Adventure, 2) The Challenge, 3) The Transformation, 4) The Return with New Wisdom."
      },
      {
        id: "st-adv-3",
        type: "text",
        content: "Sensory details and emotional hooks make stories memorable. Use specific details that engage the five senses and universal emotions."
      }
    ],
    exercises: [
      {
        id: "st-adv-ex1",
        title: "Story Structure Practice",
        description: "Create a story following the Hero's Journey format.",
        type: "writing",
        prompt: "Write a 3-minute story about a personal challenge using the Hero's Journey structure.",
        completed: false
      },
      {
        id: "st-adv-ex2",
        title: "Sensory Storytelling",
        description: "Practice incorporating sensory details in storytelling.",
        type: "recording",
        prompt: "Tell a story about a memorable meal, incorporating at least three different sensory details.",
        completed: false
      }
    ],
    completed: false,
    progress: 0
  }
];
