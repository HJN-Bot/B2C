import { supabase } from "@/integrations/supabase/client";
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private actualMimeType: string = ''; // Initialize as empty, determined at runtime

  private async initializeMediaRecorder(stream: MediaStream): Promise<MediaRecorder> {
    const mimeTypesToTry = [
      'audio/mp4',              // Often preferred by Safari (results in m4a/aac)
      'audio/webm;codecs=opus', // Good quality, widely supported
      'audio/webm',             // Generic WebM
      'audio/ogg;codecs=opus',  // Another option
      'audio/ogg',
    ];

    let recorder: MediaRecorder | null = null;
    let usedMimeType: string = '';

    // Try specific MIME types first
    for (const mimeType of mimeTypesToTry) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        try {
          console.log(`Attempting to instantiate MediaRecorder with: ${mimeType}`);
          recorder = new MediaRecorder(stream, { mimeType: mimeType });
          usedMimeType = recorder.mimeType; // Browser might slightly alter it
          console.log(`Successfully instantiated MediaRecorder with effective mimeType: ${usedMimeType}`);
          return recorder; // Success
        } catch (e) {
          console.warn(`Failed to instantiate MediaRecorder with ${mimeType}:`, e.message);
          recorder = null; // Reset recorder if instantiation failed
        }
      } else {
        console.log(`MediaRecorder.isTypeSupported reported FALSE for: ${mimeType}`);
      }
    }

    // If all specific types failed, try with browser default
    try {
      console.warn("No preferred/specified mimeType succeeded or was supported. Attempting MediaRecorder with browser default.");
      recorder = new MediaRecorder(stream); // Let the browser decide
      usedMimeType = recorder.mimeType;
      console.log(`Successfully instantiated MediaRecorder with browser default. Effective mimeType: ${usedMimeType}`);
      return recorder; // Success with default
    } catch (e) {
      console.error("Fatal: Error instantiating MediaRecorder even with browser default:", e);
      throw e; // If default also failed, this is a more serious issue
    }
  }

  async start(): Promise<void> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];
      
      this.mediaRecorder = await this.initializeMediaRecorder(this.stream);
      this.actualMimeType = this.mediaRecorder.mimeType; // Store the true effective MIME type

      if (!this.actualMimeType) {
        console.warn("MediaRecorder was created, but its mimeType property is empty. Defaulting to 'audio/webm' for blob, but this might be incorrect.");
        this.actualMimeType = 'audio/webm'; // A fallback guess
      }

      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.start();
      console.log(`Recording started. Effective mimeType: ${this.actualMimeType}`);

    } catch (error) {
      // Ensure error is an instance of Error for proper message handling
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error starting recording:', err.message, err);
      throw err; 
    }
  }

  async startWithStream(): Promise<MediaStream> {
     try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.audioChunks = [];

      this.mediaRecorder = await this.initializeMediaRecorder(this.stream);
      this.actualMimeType = this.mediaRecorder.mimeType;

      if (!this.actualMimeType) {
        console.warn("MediaRecorder was created, but its mimeType property is empty. Defaulting to 'audio/webm' for blob.");
        this.actualMimeType = 'audio/webm';
      }
      
      this.mediaRecorder.addEventListener('dataavailable', (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      });

      this.mediaRecorder.start();
      console.log(`Recording started with stream. Effective mimeType: ${this.actualMimeType}`);
      return this.stream;

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Error starting recording with stream:', err.message, err);
      throw err;
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        console.error('MediaRecorder not initialized. Cannot stop recording.');
        reject(new Error('MediaRecorder not initialized. Did start() succeed?'));
        return;
      }

      const onStop = () => {
        if (this.mediaRecorder) {
          this.mediaRecorder.removeEventListener('stop', onStop); // Clean up
        }
        if (this.audioChunks.length === 0 && this.mediaRecorder?.state === 'inactive') {
          console.warn("No audio chunks recorded.");
          const emptyBlob = new Blob([], { type: this.actualMimeType || 'application/octet-stream' });
          this.stopStream();
          resolve(emptyBlob);
          return;
        }
        
        const audioBlob = new Blob(this.audioChunks, { type: this.actualMimeType || 'application/octet-stream' });
        this.stopStream();
        console.log(`Recording stopped. Blob created with type: ${audioBlob.type}, size: ${audioBlob.size}`);
        resolve(audioBlob);
      };
      
      this.mediaRecorder.addEventListener('stop', onStop);

      try {
        if (this.mediaRecorder.state === "recording" || this.mediaRecorder.state === "paused") {
          console.log(`Calling mediaRecorder.stop(). Current state: ${this.mediaRecorder.state}`);
          this.mediaRecorder.stop();
        } else if (this.mediaRecorder.state === "inactive") {
          console.warn(`MediaRecorder already inactive. Manually triggering stop logic as 'stop' event may not fire.`);
          onStop(); // Manually call if already stopped.
        } else {
           console.warn(`MediaRecorder in unexpected state '${this.mediaRecorder.state}' when stop() called. Attempting to stop.`);
           this.mediaRecorder.stop(); 
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        console.error("Error calling mediaRecorder.stop():", err.message, err);
        reject(err);
      }
    });
  }

  private stopStream(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  isRecording(): boolean {
    return !!this.mediaRecorder && this.mediaRecorder.state === 'recording';
  }

  public getActualMimeType(): string {
    return this.actualMimeType || 'application/octet-stream'; // Fallback if somehow empty
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

/**
 * Applies a simple median filter to an array of numbers.
 * Boundary points (first and last k//2) are not filtered by this simple implementation.
 * @param data - The input array of numbers.
 * @param k - Kernel size, should be an odd positive integer.
 * @returns A new array with the median filter applied.
 */
function manualMedianFilter(data: number[], k: number = 3): number[] {
  if (k % 2 === 0 || k < 1) { // k must be odd and positive
      return [...data]; // Return copy if k is invalid for median
  }
  if (k === 1) {
      return [...data]; // No filtering if k=1
  }
  if (!data || data.length < k) {
      return [...data]; // Not enough data
  }

  const offset = Math.floor(k / 2);
  const filteredData = [...data]; // Work on a copy

  for (let i = offset; i < data.length - offset; i++) {
      // Extract window, sort, and find median
      const windowArr = data.slice(i - offset, i + offset + 1);
      windowArr.sort((a, b) => a - b);
      filteredData[i] = windowArr[offset];
  }
  return filteredData;
}

/**
* Applies a moving average filter to an array of numbers.
* @param data - The input array of numbers.
* @param windowSize - The size of the moving average window.
* @returns A new array with the moving average applied. Returns empty if not enough data.
*/
function movingAverage(data: number[], windowSize: number): number[] {
  if (!data || data.length < windowSize) {
      return [];
  }
  const result: number[] = [];
  for (let i = 0; i <= data.length - windowSize; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
          sum += data[i + j];
      }
      result.push(sum / windowSize);
  }
  return result;
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

  // --- Parameters from Python version ---
  const PITCH_WINDOW_DURATION_S = 0.1; // 100ms
  const PITCH_STEP_DURATION_S = 0.05;  // 50ms
  const SILENCE_THRESHOLD_FACTOR = 0.21; // User-defined
  const MEDIAN_FILTER_KERNEL = 11;       // User-defined
  const MA_WINDOW_SIZE_FOR_PHRASE = 4;
  const ABSOLUTE_MIN_RMS_THRESHOLD = 1e-4;
  const MIN_PITCH_FREQ = 75;
  const MAX_PITCH_FREQ = 500;

  const pitchWindowSizeSamples = Math.floor(sampleRate * PITCH_WINDOW_DURATION_S);
  const pitchStepSizeSamples = Math.floor(sampleRate * PITCH_STEP_DURATION_S);

  if (pcmData.length < pitchWindowSizeSamples) {
      return { averagePitchHz: 0, pitchVariation: 0 }; // Not enough data for even one window
  }

  // --- VAD Step: Calculate RMS for all potential pitch windows ---
  const potentialWindowRmsValues: number[] = [];
  for (let i = 0; i <= pcmData.length - pitchWindowSizeSamples; i += pitchStepSizeSamples) {
      const windowBuffer = pcmData.subarray(i, i + pitchWindowSizeSamples);
      let sumSquares = 0;
      for (let j = 0; j < windowBuffer.length; j++) {
          sumSquares += windowBuffer[j] * windowBuffer[j];
      }
      potentialWindowRmsValues.push(windowBuffer.length > 0 ? Math.sqrt(sumSquares / windowBuffer.length) : 0);
  }

  if (potentialWindowRmsValues.length === 0) {
      return { averagePitchHz: 0, pitchVariation: 0 };
  }

  const peakOverallPitchWindowRms = Math.max(...potentialWindowRmsValues);
  const dynamicSilenceThreshold = Math.max(
      peakOverallPitchWindowRms * SILENCE_THRESHOLD_FACTOR,
      ABSOLUTE_MIN_RMS_THRESHOLD
  );

  // --- Initial F0 Extraction for VAD-positive frames ---
  const allVoicedFramesF0Temp: number[] = [];
  // const allVoicedFramesTimesTemp: number[] = []; // Not strictly needed for final metrics, but good for debugging

  let windowRmsIdx = 0;
  for (let i = 0; i <= pcmData.length - pitchWindowSizeSamples; i += pitchStepSizeSamples) {
      const currentWindowRms = potentialWindowRmsValues[windowRmsIdx++];
      if (currentWindowRms > dynamicSilenceThreshold) {
          const windowBuffer = pcmData.subarray(i, i + pitchWindowSizeSamples);
          // const timeCenter = (i + pitchWindowSizeSamples / 2) / sampleRate;
          const fundamentalFreq = findFundamentalFrequency(windowBuffer, sampleRate, MIN_PITCH_FREQ, MAX_PITCH_FREQ);
          allVoicedFramesF0Temp.push(fundamentalFreq); // fundamentalFreq can be 0
          // allVoicedFramesTimesTemp.push(timeCenter);
      }
  }

  // --- Create Valid Pitch Contour (F0 > 0) ---
  const pitchContourF0Positive: number[] = allVoicedFramesF0Temp.filter(f0 => f0 > 0);

  if (pitchContourF0Positive.length === 0) {
      return { averagePitchHz: 0, pitchVariation: 0 };
  }

  // --- Apply Median Filter ---
  const medianFilteredF0Contour = manualMedianFilter(pitchContourF0Positive, MEDIAN_FILTER_KERNEL);

  if (medianFilteredF0Contour.length === 0) { // Should not happen if pitchContourF0Positive was not empty
      return { averagePitchHz: 0, pitchVariation: 0 };
  }
  
  // --- Calculate Smoothed F0 Phrase Pitch ---
  const smoothedF0PhraseHz = movingAverage(medianFilteredF0Contour, MA_WINDOW_SIZE_FOR_PHRASE);

  // --- Final Metrics Calculation ---
  let finalPitchContourForStats: number[];

  if (smoothedF0PhraseHz.length >= 2) {
      finalPitchContourForStats = smoothedF0PhraseHz;
  } else {
      // Fallback to median-filtered (but not phrase-smoothed) contour if smoothed one is too short
      finalPitchContourForStats = medianFilteredF0Contour;
  }
  
  if (finalPitchContourForStats.length === 0) {
       return { averagePitchHz: 0, pitchVariation: 0 };
  }
  if (finalPitchContourForStats.length === 1) {
      const avgPitch = finalPitchContourForStats[0];
      // Ensure avgPitch is positive, though it should be if it's from F0Positive lists
      const variation = avgPitch > 0 ? 10 : 0; 
      return { averagePitchHz: Math.round(avgPitch), pitchVariation: variation };
  }

  // finalPitchContourForStats.length >= 2
  const meanPitch = calculateMean(finalPitchContourForStats);
  
  const pitchValuesSemitones = finalPitchContourForStats.map(hz => {
      if (hz > 1e-6 && meanPitch > 1e-6) { // Guard against log(0) or division by zero
          return 12 * Math.log2(hz / meanPitch);
      }
      return 0; // Return 0 for problematic cases (e.g. hz or meanPitch is zero)
  });

  const stdDevSemitones = calculateStdDev(pitchValuesSemitones);
  let pitchVariationScore = stdDevSemitones * 10; // Scaling factor
  pitchVariationScore = Math.min(100, Math.max(0, pitchVariationScore));

  return {
      averagePitchHz: Math.round(meanPitch),
      pitchVariation: Math.round(pitchVariationScore),
  };
}

export interface PauseDetail {
  timestamp: number; // in seconds
  duration: number;  // in seconds
}

function calculatePauseDetails(
  pcmData: Float32Array,
  sampleRate: number,
  minPauseDurationMs: number = 500 // MODIFIED: Default is now 0.5 seconds
): PauseDetail[] {
  const pauses: PauseDetail[] = [];

  if (pcmData.length === 0) {
    return pauses;
  }

  const WINDOW_DURATION_MS = 50;
  const STEP_DURATION_MS = 25; 
  const SILENCE_THRESHOLD_PEAK_FACTOR = 0.05;
  const ABSOLUTE_MIN_SILENCE_THRESHOLD = 1e-4;

  const windowSize = Math.max(1, Math.floor(sampleRate * (WINDOW_DURATION_MS / 1000.0)));
  const stepSize = Math.max(1, Math.floor(sampleRate * (STEP_DURATION_MS / 1000.0)));

  if (pcmData.length < windowSize) {
    return pauses;
  }

  const allRmsValues: number[] = [];
  for (let i = 0; i <= pcmData.length - windowSize; i += stepSize) {
    let sumSquares = 0;
    for (let j = 0; j < windowSize; j++) {
      sumSquares += pcmData[i + j] * pcmData[i + j];
    }
    allRmsValues.push(Math.sqrt(sumSquares / windowSize));
  }

  if (allRmsValues.length === 0) {
    return pauses;
  }

  const peakRms = Math.max(...allRmsValues);
  const silenceThreshold = Math.max(peakRms * SILENCE_THRESHOLD_PEAK_FACTOR, ABSOLUTE_MIN_SILENCE_THRESHOLD);

  let currentPauseStartIdx = -1; 

  for (let i = 0; i < allRmsValues.length; i++) {
    const rmsVal = allRmsValues[i];
    if (rmsVal <= silenceThreshold) { 
      if (currentPauseStartIdx === -1) {
        currentPauseStartIdx = i; 
      }
    } else { 
      if (currentPauseStartIdx !== -1) { 
        const numSilentWindows = i - currentPauseStartIdx;
        const pauseDurationSeconds = numSilentWindows * (STEP_DURATION_MS / 1000.0);
        const pauseTimestampSeconds = currentPauseStartIdx * (STEP_DURATION_MS / 1000.0);
        
        // MODIFIED: Check duration AND if it's not an initial pause (timestamp > 0)
        if (pauseDurationSeconds * 1000 >= minPauseDurationMs) {
            if (pauseTimestampSeconds > 0) {
                 pauses.push({ timestamp: pauseTimestampSeconds, duration: pauseDurationSeconds });
            } else {
                console.log(`calculatePauseDetails: Ignored initial pause at timestamp 0s, duration ${pauseDurationSeconds.toFixed(2)}s`);
            }
        }
        currentPauseStartIdx = -1; 
      }
    }
  }

  if (currentPauseStartIdx !== -1) {
    const numSilentWindows = allRmsValues.length - currentPauseStartIdx;
    const pauseDurationSeconds = numSilentWindows * (STEP_DURATION_MS / 1000.0);
    const pauseTimestampSeconds = currentPauseStartIdx * (STEP_DURATION_MS / 1000.0);

    // MODIFIED: Check duration AND if it's not an initial pause (timestamp > 0)
    if (pauseDurationSeconds * 1000 >= minPauseDurationMs) {
        if (pauseTimestampSeconds > 0) {
            pauses.push({ timestamp: pauseTimestampSeconds, duration: pauseDurationSeconds });
        } else {
             console.log(`calculatePauseDetails: Ignored initial (full audio) pause at timestamp 0s, duration ${pauseDurationSeconds.toFixed(2)}s`);
        }
    }
  }
  return pauses;
}


export const analyzeAudio = async (
  audioBlob: Blob,
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all' = 'all',
  actualMimeType: string = 'application/octet-stream', 
  exerciseText?: string,
): Promise<DetailedAnalysisResult> => {
  try {
    console.log(`Analyzing audio with focus on: ${focusArea}, MIME type: ${actualMimeType}`);

    // ... (pcmData, sampleRate, duration calculation as before) ...
    // (clientSideMetrics calculation as before)
    let clientSideMetrics = { /* ... as before ... */ } as any;
    // ...
     try {
        const { pcmData, sampleRate, duration } = await decodeAudioBlobToPCM(audioBlob);
        clientSideMetrics.audioDuration = duration;

        const volumeData = calculateVolumeMetrics(pcmData, sampleRate);
        clientSideMetrics.calculatedVolumeVariation = volumeData.volumeVariationOfSpokenParts;
        clientSideMetrics.detectedWordsCount = volumeData.detectedWordsCount;
        
        const pitchData = calculatePitchMetrics(pcmData, sampleRate);
        clientSideMetrics.calculatedPitchVariation = pitchData.pitchVariation;
        
        const pauseData = calculatePauseDetails(pcmData, sampleRate); 
        clientSideMetrics.detectedPauses = pauseData;

    } catch (processingError) {
        console.error("Error during client-side audio processing:", processingError);
    }
    // ...

    const audioBase64 = await blobToBase64(audioBlob);

    const bodyPayload: any = { 
        audio: audioBase64,
        audioMimeType: actualMimeType, // Send the actualMimeType to the server
        focusArea: focusArea,
        exerciseText,
        calculatedVolumeVariation: clientSideMetrics.calculatedVolumeVariation,
        calculatedPitchVariation: clientSideMetrics.calculatedPitchVariation,
        clientCalculatedDuration: clientSideMetrics.audioDuration,
        detectedPauses: clientSideMetrics.detectedPauses,
    };

    console.log("Sending to Supabase function with payload:", {
      focusArea: bodyPayload.focusArea,
      audioMimeType: bodyPayload.audioMimeType, // Log it
    });

    const { data, error } = await supabase.functions.invoke("analyze-voice", {
      body: JSON.stringify(bodyPayload),
    });

    if (error || (data && data.fallback)) { 
      console.error('Error or fallback from analyze-voice function:', error || data?.error || 'Using fallback data from server');
      return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
    } else if (data) {
      console.log("Analysis received from edge function:", data);
      return data as DetailedAnalysisResult; 
    } else {
      console.error('No data and no error from analyze-voice function. Unexpected state.');
      return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
    }

  } catch (e) {
    const err = e as Error;
    console.error('Critical error in analyzeAudio:', err.message, err.stack);
    return mockAnalyzeAudioDetailed(audioBlob.size, focusArea);
  }
};

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
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
            averagePauseDuration: (Math.random() * 1.5) + 0.5, // mock might not reflect 0.5s min
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