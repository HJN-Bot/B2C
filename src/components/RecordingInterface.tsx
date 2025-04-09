
import { useState, useRef, useEffect } from "react";
import { Mic, StopCircle, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AudioRecorder, createAudioUrl, analyzeAudio, DetailedAnalysisResult } from "@/utils/audioRecorder";
import { useToast } from "@/hooks/use-toast";

interface RecordingInterfaceProps {
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all';
  exerciseText: string;
  onComplete?: () => void;
}

const RecordingInterface = ({ focusArea, exerciseText, onComplete }: RecordingInterfaceProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [showVolumeIndicator, setShowVolumeIndicator] = useState(false);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const setupVolumeMonitoring = (stream: MediaStream) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }

    const audioContext = audioContextRef.current;
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyzer);
    
    analyzerRef.current = analyzer;
    dataArrayRef.current = dataArray;

    setShowVolumeIndicator(focusArea === 'rate-volume' || focusArea === 'all');
    
    const getVolume = () => {
      if (!analyzerRef.current || !dataArrayRef.current) return;
      
      analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
      const average = dataArrayRef.current.reduce((acc, val) => acc + val, 0) / dataArrayRef.current.length;
      setVolumeLevel(Math.min(100, average * 1.5)); // Scale up for better visualization
      
      animationFrameRef.current = requestAnimationFrame(getVolume);
    };
    
    getVolume();
  };

  const cleanupVolumeMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setVolumeLevel(0);
    setShowVolumeIndicator(false);
  };

  const startRecording = async () => {
    try {
      const stream = await audioRecorder.current.startWithStream();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      setAnalysis(null);
      startTimer();
      setupVolumeMonitoring(stream);
      toast({
        title: "Recording started",
        description: "Read the passage with attention to vocal elements"
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({
        title: "Recording failed",
        description: "Microphone access denied or not available",
        variant: "destructive"
      });
    }
  };

  const stopRecording = async () => {
    if (!audioRecorder.current.isRecording()) return;
    try {
      const audioBlob = await audioRecorder.current.stop();
      const url = createAudioUrl(audioBlob);
      setAudioUrl(url);
      setIsRecording(false);
      stopTimer();
      cleanupVolumeMonitoring();
      
      setAnalyzing(true);
      toast({
        title: "Analyzing your recording",
        description: "This may take a moment..."
      });
      
      const result = await analyzeAudio(audioBlob, focusArea, exerciseText);
      setAnalysis(result);
      setAnalyzing(false);
      
      toast({
        title: "Analysis complete",
        description: `Focus area: ${focusArea.replace('-', ' ')}` 
      });
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      stopTimer();
      cleanupVolumeMonitoring();
      setAnalyzing(false);
      toast({
        title: "Recording error",
        description: "There was a problem processing your recording",
        variant: "destructive"
      });
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetRecording = () => {
    setAudioUrl(null);
    setRecordingTime(0);
    setAnalysis(null);
  };

  const handleDone = () => {
    if (onComplete) {
      onComplete();
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      cleanupVolumeMonitoring();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-6">
      {!isRecording && !audioUrl && <div className="text-center space-y-4">
          <div className="record-button mx-auto" onClick={startRecording}>
            <Mic size={32} />
          </div>
          <p className="text-sm">Tap to start recording</p>
        </div>}
      
      {isRecording && <div className="text-center space-y-4 w-full">
          <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
          <div className="animate-pulse">
            <div className="record-button mx-auto bg-red-500" onClick={stopRecording}>
              <StopCircle size={32} />
            </div>
          </div>
          <p className="text-sm">Recording... Tap to stop</p>
          
          {showVolumeIndicator && (
            <div className="w-full max-w-md mx-auto mt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span>Volume Level</span>
                <span>{Math.round(volumeLevel)}%</span>
              </div>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 origin-left transition-transform duration-100"
                  style={{ transform: `scaleX(${volumeLevel / 100})` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`flex space-x-1 ${volumeLevel > 75 ? 'text-white' : 'text-gray-700'}`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-1 rounded-full transition-all duration-100 ${
                          volumeLevel > i * 20 ? 'bg-white' : 'bg-gray-300'
                        }`}
                        style={{ 
                          height: `${Math.min(100, Math.max(4, (volumeLevel - i * 15)))}%`,
                          opacity: volumeLevel > i * 20 ? 1 : 0.5
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {focusArea === 'rate-volume' && (
                <p className="text-xs text-center mt-1">
                  {volumeLevel < 30 ? "Speak louder" : volumeLevel > 75 ? "Great projection!" : "Good volume"}
                </p>
              )}
            </div>
          )}
        </div>}
      
      {audioUrl && <div className="w-full space-y-4">
          <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
          
          <div className="flex items-center justify-center space-x-4">
            <Button variant="outline" className="w-12 h-12 rounded-full p-0" onClick={togglePlayback}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </Button>
          </div>
          
          {analyzing && (
            <div className="text-center py-3">
              <div className="inline-block">
                <div className="h-6 w-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mx-auto"></div>
              </div>
              <p className="text-xs mt-2">Analyzing your vocal performance...</p>
            </div>
          )}
          
          {analysis && (
            <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm">
              <h4 className="font-semibold mb-2">Quick Analysis:</h4>
              <div className="flex justify-between text-xs mb-1">
                <span>Rate of Speech:</span>
                <span className="font-medium">
                  {analysis.paceScore}/100
                </span>
              </div>
              <Progress value={analysis.paceScore} className="h-2 mb-3" />
              <p className="text-xs">
                Your speaking rate is approximately {analysis.detailedMetrics.wordsPerMinute} words per minute. {
                  analysis.detailedMetrics.wordsPerMinute > 160 
                    ? "Try slowing down a bit for better clarity." 
                    : analysis.detailedMetrics.wordsPerMinute < 120 
                      ? "You could speed up slightly to maintain engagement." 
                      : "This is a good pace for effective communication."
                }
              </p>
              <p className="text-xs mt-2">
                {analysis.feedback[0]}
              </p>
            </div>
          )}
          
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={resetRecording}>
              Record again
            </Button>
            
            <Button onClick={handleDone}>
              Done
            </Button>
          </div>
        </div>}
    </div>
  );
};

export default RecordingInterface;
