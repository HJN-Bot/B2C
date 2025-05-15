import { supabase } from "@/integrations/supabase/client";
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
    volumeVariation: number; // This should be a 0-100 score
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

let audioContext: AudioContext | null = null;
const getAudioContext = (): AudioContext => {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  return audioContext;
};

interface DecodedAudio {
  pcmData: Float32Array;
  sampleRate: number;
  duration: number;
}

async function decodeAudioBlobToPCM(audioBlob: Blob): Promise<DecodedAudio> {
  const context = getAudioContext();
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioBuffer = await context.decodeAudioData(arrayBuffer);
  const pcmData = audioBuffer.getChannelData(0); // Use first channel
  return {
    pcmData,
    sampleRate: audioBuffer.sampleRate,
    duration: audioBuffer.duration,
  };
}

interface VolumeMetrics {
  averageLoudnessOfSpokenParts: number; // Raw average RMS of all parts above silence threshold
  volumeVariationOfSpokenParts: number; // Word-based volume variation score (0-100)
  percentageOfSpeechDetected: number;
  detectedWordsCount: number; // Number of word segments detected
}

// Helper function to calculate mean of an array of numbers
function calculateMean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Helper function to calculate standard deviation of an array of numbers
function calculateStdDev(arr: number[], mean?: number): number {
  if (arr.length < 2) return 0; // Standard deviation is not meaningful for less than 2 values
  const m = mean === undefined ? calculateMean(arr) : mean;
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}


function calculateVolumeMetrics(
  pcmData: Float32Array, 
  sampleRate: number,
  // Constants for algorithm, mirroring Python version's defaults
  minWordRmsWindows: number = 3,
  volumeScoreLinearScale: number = 100.0 
): VolumeMetrics {

  const defaultReturn: VolumeMetrics = {
    averageLoudnessOfSpokenParts: 0,
    volumeVariationOfSpokenParts: 0,
    percentageOfSpeechDetected: 0,
    detectedWordsCount: 0,
  };

  if (pcmData.length === 0) {
    return defaultReturn;
  }

  // --- Parameters ---
  const WINDOW_DURATION_MS = 50;
  const STEP_DURATION_MS = 25;
  const SILENCE_THRESHOLD_PEAK_FACTOR = 0.05;
  const ABSOLUTE_MIN_SILENCE_THRESHOLD = 1e-4;

  const windowSize = Math.max(1, Math.floor(sampleRate * (WINDOW_DURATION_MS / 1000.0)));
  const stepSize = Math.max(1, Math.floor(sampleRate * (STEP_DURATION_MS / 1000.0)));
  const actualMinWordRmsWindows = Math.max(1, minWordRmsWindows);

  // --- Handle very short audio ---
  if (pcmData.length < windowSize) {
    let sumSquares = 0;
    for (let i = 0; i < pcmData.length; i++) {
      sumSquares += pcmData[i] * pcmData[i];
    }
    const overallRMS = pcmData.length > 0 ? Math.sqrt(sumSquares / pcmData.length) : 0;
    const variationScore = overallRMS > 1e-5 ? 10 : 0; // Low variation for very short audio
    return {
      averageLoudnessOfSpokenParts: overallRMS,
      volumeVariationOfSpokenParts: variationScore,
      percentageOfSpeechDetected: overallRMS > 1e-5 ? 100 : 0,
      detectedWordsCount: overallRMS > 1e-5 ? 1 : 0,
    };
  }

  // --- Calculate RMS for all windows ---
  const allRmsValues: number[] = [];
  for (let i = 0; i <= pcmData.length - windowSize; i += stepSize) {
    let sumSquares = 0;
    for (let j = 0; j < windowSize; j++) {
      sumSquares += pcmData[i + j] * pcmData[i + j];
    }
    allRmsValues.push(Math.sqrt(sumSquares / windowSize));
  }

  if (allRmsValues.length === 0) {
    return defaultReturn;
  }

  // --- Determine Silence Threshold ---
  const peakRms = Math.max(...allRmsValues);
  const silenceThreshold = Math.max(peakRms * SILENCE_THRESHOLD_PEAK_FACTOR, ABSOLUTE_MIN_SILENCE_THRESHOLD);
  const overallMeanRmsAllFrames = calculateMean(allRmsValues);

  // --- Filter overall spoken RMS values (all frames above threshold) ---
  const overallSpokenRmsArray = allRmsValues.filter(rms => rms > silenceThreshold);
  const percentageOfSpeechDetected = allRmsValues.length > 0 ? (overallSpokenRmsArray.length / allRmsValues.length) * 100 : 0;
  
  let meanOverallSpokenRms = 0;
  if (overallSpokenRmsArray.length > 0) {
      meanOverallSpokenRms = calculateMean(overallSpokenRmsArray);
  } else if (overallMeanRmsAllFrames < ABSOLUTE_MIN_SILENCE_THRESHOLD * 2 && allRmsValues.length > 0) {
      // If audio is extremely quiet and no specific speech detected, use overall mean
      meanOverallSpokenRms = overallMeanRmsAllFrames;
  }


  // --- Word Segmentation ---
  const wordSegmentDetails: { avgRms: number }[] = [];
  let currentWordStartIdx = -1;

  for (let i = 0; i < allRmsValues.length; i++) {
    const rmsVal = allRmsValues[i];
    if (rmsVal > silenceThreshold) {
      if (currentWordStartIdx === -1) {
        currentWordStartIdx = i; // Start of a new potential word segment
      }
    } else {
      if (currentWordStartIdx !== -1) { // End of the current segment
        const segmentLen = i - currentWordStartIdx;
        if (segmentLen >= actualMinWordRmsWindows) {
          const wordRmsSequence = allRmsValues.slice(currentWordStartIdx, i);
          wordSegmentDetails.push({ avgRms: calculateMean(wordRmsSequence) });
        }
        currentWordStartIdx = -1; // Reset for next segment
      }
    }
  }
  // Check for a word segment at the very end of the audio
  if (currentWordStartIdx !== -1) {
    const segmentLen = allRmsValues.length - currentWordStartIdx;
    if (segmentLen >= actualMinWordRmsWindows) {
      const wordRmsSequence = allRmsValues.slice(currentWordStartIdx);
      wordSegmentDetails.push({ avgRms: calculateMean(wordRmsSequence) });
    }
  }

  const averageRmsPerWordArray = wordSegmentDetails.map(seg => seg.avgRms);
  let wordVolumeVariationScore = 0;

  if (averageRmsPerWordArray.length >= 2) {
    const meanOfAvgWordRms = calculateMean(averageRmsPerWordArray);
    const stdDevOfAvgWordRms = calculateStdDev(averageRmsPerWordArray, meanOfAvgWordRms);
    const coeffVarWords = stdDevOfAvgWordRms / (meanOfAvgWordRms + 1e-9); // Add epsilon to prevent division by zero
    wordVolumeVariationScore = Math.round(Math.min(100, Math.max(0, coeffVarWords * volumeScoreLinearScale)));
  } else if (averageRmsPerWordArray.length === 1) {
    wordVolumeVariationScore = 10; // Low variation for a single detected word segment
  }


  // Handle extremely quiet audio case for final scores
  if (overallMeanRmsAllFrames < ABSOLUTE_MIN_SILENCE_THRESHOLD * 2 && wordSegmentDetails.length === 0) {
    return {
      averageLoudnessOfSpokenParts: overallMeanRmsAllFrames,
      volumeVariationOfSpokenParts: 0, // No variation if effectively silent
      percentageOfSpeechDetected: 0,
      detectedWordsCount: 0,
    };
  }
  
  return {
    averageLoudnessOfSpokenParts: meanOverallSpokenRms, // Average RMS of all parts above threshold
    volumeVariationOfSpokenParts: wordVolumeVariationScore, // Word-based score (0-100)
    percentageOfSpeechDetected: Math.round(percentageOfSpeechDetected),
    detectedWordsCount: wordSegmentDetails.length,
  };
}


interface PitchMetrics {
  averagePitchHz: number;
  pitchVariation: number; // A 0-100 score for variation
}

function findFundamentalFrequency(
  buffer: Float32Array,
  sampleRate: number,
  minFreq: number = 75, 
  maxFreq: number = 500  
): number {
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.ceil(sampleRate / minFreq);
  let bestPeriod = 0;
  let bestCorrelation = -1;

  for (let period = minPeriod; period <= maxPeriod; period++) {
    let sum = 0;
    for (let i = 0; i < buffer.length - period; i++) {
      sum += buffer[i] * buffer[i + period];
    }
    
    let norm1 = 0;
    let norm2 = 0;
    for (let i = 0; i < buffer.length - period; i++) {
        norm1 += buffer[i] * buffer[i];
        norm2 += buffer[i+period] * buffer[i+period];
    }
    const norm = Math.sqrt(norm1 * norm2);
    const correlation = norm > 1e-6 ? sum / norm : 0;

    if (correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestPeriod = period;
    }
  }
  
  if (bestCorrelation > 0.15 && bestPeriod > 0) { // Confidence threshold
    return sampleRate / bestPeriod;
  }
  return 0; // No reliable pitch detected
}

function calculatePitchMetrics(pcmData: Float32Array, sampleRate: number): PitchMetrics {
  if (pcmData.length === 0) {
    return { averagePitchHz: 0, pitchVariation: 0 };
  }

  const windowSize = Math.floor(sampleRate * 0.1); // 100ms for pitch analysis
  const stepSize = Math.floor(sampleRate * 0.05); // 50ms step
  const pitchValuesHz: number[] = [];

  for (let i = 0; i <= pcmData.length - windowSize; i += stepSize) {
    const windowBuffer = pcmData.subarray(i, i + windowSize);
    const fundamentalFreq = findFundamentalFrequency(windowBuffer, sampleRate);
    if (fundamentalFreq > 0) { 
      pitchValuesHz.push(fundamentalFreq);
    }
  }

  if (pitchValuesHz.length < 2) { 
    const avgPitch = pitchValuesHz.length === 1 ? pitchValuesHz[0] : 0;
    return { averagePitchHz: Math.round(avgPitch), pitchVariation: avgPitch > 0 ? 10: 0 };
  }

  const meanPitch = calculateMean(pitchValuesHz);
  
  // Calculate standard deviation in semitones for perceptual relevance
  const pitchValuesSemitones = pitchValuesHz.map(hz => 12 * Math.log2(hz / meanPitch)); // Relative to mean
  const stdDevSemitones = calculateStdDev(pitchValuesSemitones);

  let pitchVariationScore = stdDevSemitones * 20; // Arbitrary scaling (e.g. 5 semitones variation = 100 score)
  pitchVariationScore = Math.min(100, Math.max(0, pitchVariationScore));
  
  return {
    averagePitchHz: Math.round(meanPitch),
    pitchVariation: Math.round(pitchVariationScore),
  };
}

export const analyzeAudio = async (
  audioBlob: Blob,
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all' = 'all',
  exerciseText?: string
): Promise<DetailedAnalysisResult> => {
  try {
    console.log(`Analyzing audio with focus on: ${focusArea}`);

    let clientSideMetrics = {
        calculatedVolumeVariation: 0, // Will be the word-based score (0-100)
        calculatedPitchVariation: 0,  // 0-100 score
        audioDuration: 0,
        detectedWordsCount: 0, // For potential future use or logging
    };

    try {
        const { pcmData, sampleRate, duration } = await decodeAudioBlobToPCM(audioBlob);
        clientSideMetrics.audioDuration = duration;

        // Always calculate all available client-side metrics if pcmData is available
        const volumeData = calculateVolumeMetrics(pcmData, sampleRate);
        clientSideMetrics.calculatedVolumeVariation = volumeData.volumeVariationOfSpokenParts;
        clientSideMetrics.detectedWordsCount = volumeData.detectedWordsCount; // Store this
        console.log('Client-side volume data:', volumeData);

        const pitchData = calculatePitchMetrics(pcmData, sampleRate);
        clientSideMetrics.calculatedPitchVariation = pitchData.pitchVariation;
        console.log('Client-side pitch data:', pitchData);

    } catch (processingError) {
        console.error("Error during client-side audio processing:", processingError);
    }

    const audioBase64 = await blobToBase64(audioBlob);

    const bodyPayload: any = { 
        audio: audioBase64,
        focusArea: focusArea, // Send the actual focusArea string
        exerciseText,
        calculatedVolumeVariation: clientSideMetrics.calculatedVolumeVariation,
        calculatedPitchVariation: clientSideMetrics.calculatedPitchVariation,
        clientCalculatedDuration: clientSideMetrics.audioDuration 
    };
     console.log("Sending to Supabase function with payload:", {
      focusArea: bodyPayload.focusArea, // Log only relevant parts
      exerciseTextProvided: !!bodyPayload.exerciseText,
      calculatedVolumeVariation: bodyPayload.calculatedVolumeVariation,
      calculatedPitchVariation: bodyPayload.calculatedPitchVariation,
      clientCalculatedDuration: bodyPayload.clientCalculatedDuration,
      audioLengthBase64: bodyPayload.audio.length 
    });

    const { data, error } = await supabase.functions.invoke("analyze-voice", {
      body: JSON.stringify(bodyPayload),
    });

    if (error || (data && data.fallback)) { 
      console.error('Error or fallback from analyze-voice function:', error || data?.error || 'Using fallback data from server');
      // Fallback to client-side mock if server fails or indicates fallback
      return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
    } else if (data) {
      console.log("Analysis received from edge function:", data);
      // Ensure the data returned from Supabase is correctly structured as DetailedAnalysisResult
      // If the server directly uses the provided client-side metrics, they should already be in `data`.
      // If the server's LLM re-evaluates or scores, that's fine too.
      // TODO merge or prioritize if both client and server have versions of these metrics.
      // For now, assume server response is authoritative if successful.

      return data as DetailedAnalysisResult; 
    } else {
      console.error('No data and no error from analyze-voice function. Unexpected state.');
      return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
    }

  } catch (e) {
    const err = e as Error;
    console.error('Critical error in analyzeAudio:', err.message, err.stack);
    // Fall back to mock data if any top-level API call fails
    // Pass clientSideMetrics to mock data so it can potentially use them
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
