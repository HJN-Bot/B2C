
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

export const analyzeAudio = async (
  audioBlob: Blob, 
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all' = 'all',
  exerciseText?: string
): Promise<DetailedAnalysisResult> => {
  try {
    console.log(`Analyzing audio with focus on: ${focusArea}`);
    
    // Convert the audio blob to base64
    const audioBase64 = await blobToBase64(audioBlob);
    
    // Call the Supabase edge function
    const { data, error } = await fetch('/api/analyze-voice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio: audioBase64,
        focusArea,
        exerciseText
      }),
    }).then(res => res.json());
    
    if (error) {
      console.error('Error from analyze-voice function:', error);
      return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
    }
    
    return data;
  } catch (error) {
    console.error('Error analyzing audio:', error);
    // Fall back to mock data if the API call fails
    return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
  }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const mockAnalyzeAudioDetailed = (
  size: number, 
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all' = 'all'
): Promise<DetailedAnalysisResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let paceScore = Math.floor(Math.random() * 30) + 60;
      let tonalityScore = Math.floor(Math.random() * 30) + 60;
      let pausesScore = Math.floor(Math.random() * 30) + 60;
      let fillerWordsScore = Math.floor(Math.random() * 30) + 60;
      
      switch (focusArea) {
        case 'rate-volume':
          paceScore += 10;
          break;
        case 'pitch-tonality':
          tonalityScore += 10;
          break;
        case 'pause-fillers':
          pausesScore += 5;
          fillerWordsScore += 5;
          break;
        default:
          break;
      }
      
      paceScore = Math.min(100, paceScore);
      tonalityScore = Math.min(100, tonalityScore);
      pausesScore = Math.min(100, pausesScore);
      fillerWordsScore = Math.min(100, fillerWordsScore);
      
      const overallScore = Math.floor((paceScore + tonalityScore + pausesScore + fillerWordsScore) / 4);
      
      const wordsPerMinute = Math.floor(Math.random() * 60) + 120;
      const fillerWordCount = {
        um: Math.floor(Math.random() * 8),
        uh: Math.floor(Math.random() * 6),
        like: Math.floor(Math.random() * 10),
        youKnow: Math.floor(Math.random() * 5),
        total: 0
      };
      fillerWordCount.total = fillerWordCount.um + fillerWordCount.uh + fillerWordCount.like + fillerWordCount.youKnow;
      
      const feedback = generateFeedback(focusArea, { 
        paceScore, 
        tonalityScore, 
        pausesScore, 
        fillerWordsScore,
        wordsPerMinute,
        fillerWordCount
      });
      
      const specificSuggestions = generateSpecificSuggestions(focusArea, {
        paceScore, 
        tonalityScore, 
        pausesScore, 
        fillerWordsScore
      });
      
      resolve({
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
          fillerWordCount,
          pauseMetrics: {
            totalPauses: Math.floor(Math.random() * 10) + 5,
            averagePauseDuration: (Math.random() * 1.5) + 0.5,
            strategicPauseScore: Math.floor(Math.random() * 40) + 60
          }
        },
        specificSuggestions,
        transcription: generateMockTranscription(focusArea)
      });
    }, 2000);
  });
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
