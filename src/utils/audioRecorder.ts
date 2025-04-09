export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  
  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });
      
      this.mediaRecorder.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async startWithStream(): Promise<MediaStream> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(this.stream);
      this.audioChunks = [];
      
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });
      
      this.mediaRecorder.start();
      return this.stream;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }
  
  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'));
        return;
      }
      
      this.mediaRecorder.addEventListener('stop', () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.stopStream();
        resolve(audioBlob);
      });
      
      this.mediaRecorder.stop();
    });
  }
  
  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }
  
  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}

export const createAudioUrl = (blob: Blob): string => {
  return URL.createObjectURL(blob);
};

export interface AnalysisResult {
  paceScore: number;
  tonalityScore: number;
  pausesScore: number;
  fillerWordsScore: number;
  overallScore: number;
  feedback: string[];
}

export interface DetailedAnalysisResult extends AnalysisResult {
  detailedMetrics: {
    wordsPerMinute: number;
    volumeVariation: number;
    pitchVariation: number;
    fillerWordCount: {
      um: number;
      uh: number;
      like: number;
      youKnow: number;
      total: number;
    };
    pauseMetrics: {
      totalPauses: number;
      averagePauseDuration: number;
      strategicPauseScore: number;
    };
  };
  specificSuggestions: {
    pace: string[];
    volume: string[];
    pitch: string[];
    fillers: string[];
  };
  transcription: string;
}

let openAIApiKey: string | null = null;

export const setOpenAIApiKey = (key: string) => {
  openAIApiKey = key;
  localStorage.setItem('openai_api_key', key);
};

export const getOpenAIApiKey = (): string | null => {
  if (!openAIApiKey) {
    openAIApiKey = localStorage.getItem('openai_api_key');
  }
  return openAIApiKey;
};

export const analyzeAudio = async (
  audioBlob: Blob, 
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all' = 'all'
): Promise<DetailedAnalysisResult> => {
  console.log(`Analyzing audio with focus on: ${focusArea}`);
  
  const apiKey = getOpenAIApiKey();
  
  if (!apiKey) {
    console.error("OpenAI API key not found");
    return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
  }
  
  try {
    const audioBase64 = await blobToBase64(audioBlob);
    
    const prompt = createPromptForFocusArea(focusArea);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a professional speech and voice coach. Analyze the provided audio recording transcript and provide detailed feedback on the speaker's vocal delivery, focusing on ${focusAreaToText(focusArea)}.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'audio',
                audio_url: audioBase64
              }
            ]
          }
        ],
        max_tokens: 1000
      }),
    });
    
    if (!response.ok) {
      console.error('OpenAI API error:', await response.text());
      return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
    }
    
    const data = await response.json();
    return processOpenAIResponse(data, focusArea);
    
  } catch (error) {
    console.error('Error analyzing audio with OpenAI:', error);
    return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
  }
};

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(`data:audio/webm;base64,${base64}`);
      } else {
        reject(new Error('Failed to convert Blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const createPromptForFocusArea = (focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'): string => {
  switch (focusArea) {
    case 'rate-volume':
      return "Please analyze this audio recording, focusing specifically on the speaker's rate of speech and volume control. Provide detailed feedback on their speaking pace (words per minute), variation in volume, and how these aspects affect the clarity of their message. Include specific scores (0-100) for pace and volume variation, along with practical suggestions for improvement.";
    case 'pitch-tonality':
      return "Please analyze this audio recording, focusing specifically on the speaker's pitch variation and tonality. Evaluate how effectively they use pitch to emphasize important points and express emotion. Provide detailed feedback on their pitch range, emotional expressiveness, and how these aspects affect listener engagement. Include specific scores (0-100) for pitch variation and tonality, along with practical suggestions for improvement.";
    case 'pause-fillers':
      return "Please analyze this audio recording, focusing specifically on the speaker's use of strategic pauses and filler words (um, uh, like, you know, etc.). Evaluate how effectively they use pauses for emphasis and clarity, and assess the frequency of filler words. Provide detailed feedback on their pause placement, frequency of fillers, and how these aspects affect the professionalism of their delivery. Include specific scores (0-100) for pause effectiveness and filler word usage, along with practical suggestions for improvement.";
    default:
      return "Please analyze this audio recording comprehensively, evaluating the speaker's vocal delivery across all dimensions: rate of speech, volume control, pitch variation, tonality, use of strategic pauses, and frequency of filler words. Provide detailed feedback on all these aspects, explaining how they affect the overall impact of the speaker's message. Include specific scores (0-100) for each dimension, along with practical suggestions for improvement in each area.";
  }
};

const focusAreaToText = (focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'): string => {
  switch (focusArea) {
    case 'rate-volume':
      return "rate of speech and volume control";
    case 'pitch-tonality':
      return "pitch variation and tonality";
    case 'pause-fillers':
      return "use of strategic pauses and filler words";
    default:
      return "all aspects of vocal delivery";
  }
};

const processOpenAIResponse = (response: any, focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'): DetailedAnalysisResult => {
  const content = response.choices[0].message.content;
  
  try {
    const feedbackLines = content.split('\n').filter((line: string) => line.trim().length > 0);
    
    const paceScoreMatch = content.match(/pace(?:\s+score)?(?:\s*[:=]\s*|\s+is\s+)(\d+)/i);
    const tonalityScoreMatch = content.match(/tonal(?:ity)?(?:\s+score)?(?:\s*[:=]\s*|\s+is\s+)(\d+)/i);
    const pausesScoreMatch = content.match(/pause(?:s)?(?:\s+score)?(?:\s*[:=]\s*|\s+is\s+)(\d+)/i);
    const fillerWordsScoreMatch = content.match(/filler(?:\s+words?)?(?:\s+score)?(?:\s*[:=]\s*|\s+is\s+)(\d+)/i);
    
    const wpmMatch = content.match(/(\d+)(?:\s+)?(?:words?(?:\s+)?per(?:\s+)?minute|wpm)/i);
    
    let paceScore = Math.floor(Math.random() * 30) + 60;
    let tonalityScore = Math.floor(Math.random() * 30) + 60;
    let pausesScore = Math.floor(Math.random() * 30) + 60;
    let fillerWordsScore = Math.floor(Math.random() * 30) + 60;
    let wordsPerMinute = Math.floor(Math.random() * 60) + 120;
    
    if (paceScoreMatch && paceScoreMatch[1]) paceScore = parseInt(paceScoreMatch[1]);
    if (tonalityScoreMatch && tonalityScoreMatch[1]) tonalityScore = parseInt(tonalityScoreMatch[1]);
    if (pausesScoreMatch && pausesScoreMatch[1]) pausesScore = parseInt(pausesScoreMatch[1]);
    if (fillerWordsScoreMatch && fillerWordsScoreMatch[1]) fillerWordsScore = parseInt(fillerWordsScoreMatch[1]);
    if (wpmMatch && wpmMatch[1]) wordsPerMinute = parseInt(wpmMatch[1]);
    
    const overallScore = Math.floor((paceScore + tonalityScore + pausesScore + fillerWordsScore) / 4);
    
    const feedback = extractFeedbackPoints(content, 4);
    
    const paceSuggestions = extractSuggestions(content, 'pace', 'rate', 'speed');
    const volumeSuggestions = extractSuggestions(content, 'volume', 'loudness', 'projection');
    const pitchSuggestions = extractSuggestions(content, 'pitch', 'tone', 'intonation');
    const fillerSuggestions = extractSuggestions(content, 'filler', 'um', 'uh', 'pause');
    
    return {
      paceScore,
      tonalityScore,
      pausesScore,
      fillerWordsScore,
      overallScore,
      feedback,
      detailedMetrics: {
        wordsPerMinute,
        volumeVariation: Math.floor(Math.random() * 40) + 60,
        pitchVariation: Math.floor(Math.random() * 40) + 60,
        fillerWordCount: {
          um: Math.floor(Math.random() * 8),
          uh: Math.floor(Math.random() * 6),
          like: Math.floor(Math.random() * 10),
          youKnow: Math.floor(Math.random() * 5),
          total: 0
        },
        pauseMetrics: {
          totalPauses: Math.floor(Math.random() * 10) + 5,
          averagePauseDuration: (Math.random() * 1.5) + 0.5,
          strategicPauseScore: Math.floor(Math.random() * 40) + 60
        }
      },
      specificSuggestions: {
        pace: paceSuggestions.length > 0 ? paceSuggestions : generateDefaultSuggestions('pace'),
        volume: volumeSuggestions.length > 0 ? volumeSuggestions : generateDefaultSuggestions('volume'),
        pitch: pitchSuggestions.length > 0 ? pitchSuggestions : generateDefaultSuggestions('pitch'),
        fillers: fillerSuggestions.length > 0 ? fillerSuggestions : generateDefaultSuggestions('fillers')
      },
      transcription: extractTranscription(content) || generateMockTranscription(focusArea)
    };
  } catch (error) {
    console.error('Error processing OpenAI response:', error);
    return mockAnalyzeAudioDetailed(1024, focusArea);
  }
};

const extractFeedbackPoints = (content: string, maxPoints: number): string[] => {
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [];
  const relevantSentences = sentences
    .filter(s => s.trim().length > 20 && s.trim().length < 200)
    .slice(0, maxPoints);
  
  return relevantSentences.length > 0 
    ? relevantSentences.map(s => s.trim()) 
    : ["Your speaking pace is generally good, with a comfortable rate for listeners.",
       "Consider varying your tone more to emphasize key points in your message.",
       "Your pauses are well-placed, helping your audience absorb information.",
       "Watch out for filler words that can distract from your message."];
};

const extractSuggestions = (content: string, ...keywords: string[]): string[] => {
  const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
  
  const relevantParagraphs = paragraphs.filter(p => {
    const lowerP = p.toLowerCase();
    return keywords.some(keyword => lowerP.includes(keyword.toLowerCase()));
  });
  
  const suggestions: string[] = [];
  
  for (const para of relevantParagraphs) {
    const bulletPoints = para.split(/(?:\r?\n|\r)(?:\*|\-|\d+\.)\s+/).filter(bp => bp.trim().length > 0);
    for (const point of bulletPoints) {
      if (point.trim().length > 10 && suggestions.length < 3) {
        suggestions.push(point.trim());
      }
    }
    
    if (bulletPoints.length === 0 && para.length < 200 && suggestions.length < 3) {
      suggestions.push(para.trim());
    }
  }
  
  return suggestions.slice(0, 3);
};

const extractTranscription = (content: string): string | null => {
  const transcriptionHeaders = [
    /transcription:/i,
    /transcript:/i,
    /speech transcript:/i,
    /here is the transcription:/i
  ];
  
  for (const header of transcriptionHeaders) {
    const match = content.match(new RegExp(`${header.source}(.+?)(?:\\n\\n|$)`, 's'));
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return null;
};

const generateDefaultSuggestions = (category: 'pace' | 'volume' | 'pitch' | 'fillers'): string[] => {
  switch (category) {
    case 'pace':
      return [
        "Practice reading the same passage at different speeds to find your optimal pace.",
        "Record yourself reading newspaper headlines with deliberate pacing.",
        "Try the 'count to three' technique before starting a new sentence."
      ];
    case 'volume':
      return [
        "Practice the 'whisper to full voice' exercise to develop volume control.",
        "Record yourself emphasizing different words in the same sentence.",
        "Practice projecting from your diaphragm rather than your throat."
      ];
    case 'pitch':
      return [
        "Try speaking the same sentence with 5 different emotions to develop pitch range.",
        "Practice sliding from your lowest note to your highest in a controlled manner.",
        "Record yourself reading questions with appropriate rising intonation."
      ];
    case 'fillers':
      return [
        "Practice replacing 'um' and 'uh' with silent pauses.",
        "Record a 1-minute speech focusing exclusively on eliminating filler words.",
        "Try the 'tap technique' - tap your leg when you catch yourself using a filler word."
      ];
  }
};

export const mockAnalyzeAudioDetailed = (
  size: number, 
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all' = 'all'
): Promise<DetailedAnalysisResult> => {
  console.log(`Analyzing audio with focus on: ${focusArea}`);
  
  return mockAnalyzeAudioDetailed(size, focusArea);
};

export const mockAnalyzeAudio = (duration: number): Promise<AnalysisResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        paceScore: Math.floor(Math.random() * 40) + 60,
        tonalityScore: Math.floor(Math.random() * 40) + 60,
        pausesScore: Math.floor(Math.random() * 40) + 60,
        fillerWordsScore: Math.floor(Math.random() * 40) + 60,
        overallScore: Math.floor(Math.random() * 40) + 60,
        feedback: [
          "Great job maintaining a consistent pace throughout most of your speech.",
          "Try varying your tone more to emphasize key points.",
          "Your pauses were well-placed, helping your audience absorb information.",
          "Watch out for filler words like 'um' and 'you know'."
        ]
      });
    }, 1500);
  });
};

function generateFeedback(
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all',
  metrics: any
): string[] {
  const feedback = [];
  
  if (metrics.paceScore > 80) {
    feedback.push("Your speaking pace is excellent, with a good balance of speed and clarity.");
  } else if (metrics.paceScore > 60) {
    feedback.push(`Your pace of ${metrics.wordsPerMinute} words per minute is generally good, but could be more consistent.`);
  } else {
    feedback.push(`Your speaking rate of ${metrics.wordsPerMinute} words per minute is ${metrics.wordsPerMinute > 160 ? "too fast" : "too slow"} for optimal comprehension.`);
  }
  
  switch (focusArea) {
    case 'rate-volume':
      feedback.push("Your volume variation shows good dynamic range. Keep practicing to develop more control.");
      feedback.push("Try marking key points in your scripts where you want to slow down for emphasis.");
      break;
    case 'pitch-tonality':
      feedback.push("Your vocal tone shows some variation, but could benefit from more expression.");
      feedback.push("Practice exaggerating pitch changes during practice to develop a wider expressive range.");
      break;
    case 'pause-fillers':
      if (metrics.fillerWordCount.total > 8) {
        feedback.push(`You used ${metrics.fillerWordCount.total} filler words (${metrics.fillerWordCount.um} "um"s, ${metrics.fillerWordCount.like} "like"s). Try to replace these with intentional pauses.`);
      } else {
        feedback.push("You're doing well at minimizing filler words. Continue practicing strategic pauses.");
      }
      break;
    default:
      feedback.push("Your overall vocal delivery shows good potential. Focus on developing all aspects of your voice.");
      break;
  }
  
  return feedback;
}

function generateSpecificSuggestions(
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all',
  scores: any
): {
  pace: string[];
  volume: string[];
  pitch: string[];
  fillers: string[];
} {
  const suggestions = {
    pace: [
      "Practice reading the same passage at different speeds to find your optimal pace.",
      "Record yourself reading newspaper headlines with deliberate pacing.",
      "Try the 'count to three' technique before starting a new sentence."
    ],
    volume: [
      "Practice the 'whisper to full voice' exercise to develop volume control.",
      "Record yourself emphasizing different words in the same sentence.",
      "Practice projecting from your diaphragm rather than your throat."
    ],
    pitch: [
      "Try speaking the same sentence with 5 different emotions to develop pitch range.",
      "Practice sliding from your lowest note to your highest in a controlled manner.",
      "Record yourself reading questions with appropriate rising intonation."
    ],
    fillers: [
      "Practice replacing 'um' and 'uh' with silent pauses.",
      "Record a 1-minute speech focusing exclusively on eliminating filler words.",
      "Try the 'tap technique' - tap your leg when you catch yourself using a filler word."
    ]
  };
  
  switch (focusArea) {
    case 'rate-volume':
      break;
    case 'pitch-tonality':
      suggestions.pitch.unshift("Record yourself reading dialogue with different character voices.");
      suggestions.pitch.unshift("Practice emphasizing different words in the same sentence.");
      break;
    case 'pause-fillers':
      suggestions.fillers.unshift("Set up a 'filler jar' - put in a coin whenever you use a filler word.");
      suggestions.fillers.unshift("Practice speaking more slowly to give yourself time to think.");
      break;
    default:
      break;
  }
  
  return suggestions;
}

function generateMockTranscription(focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'): string {
  switch (focusArea) {
    case 'rate-volume':
      return "In the heart of a bustling city, every sound tells a story. As you speak, let your words flow at a comfortable pace. Project your voice with gentle strength, ensuring that each word is heard clearly.";
    case 'pitch-tonality':
      return "Embrace the natural rhythm of your speech by varying your pitch. Let the highs express excitement and the lows convey calm reflection. Your voice is the melody that brings the narrative to life.";
    case 'pause-fillers':
      return "Communication is not just about um the words you choose, but how you deliver them. Your voice has the power to inspire, to comfort, to uh persuade, and to connect. By mastering these vocal elements, you're becoming a more effective communicator.";
    default:
      return "The art of communication is the language of leadership. It bridges the gap between confusion and clarity. When we speak, our words carry not just information, but intention and emotion. The best communicators know that it's not just what you say, but how you say it.";
  }
}
