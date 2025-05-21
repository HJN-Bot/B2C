import { useState, useEffect, useRef } from "react";
import { Mic, StopCircle, Play, Pause, X, Headphones, BarChart, Eye } from "lucide-react"; // Added Eye for Overview
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Slider } from "@/components/ui/slider"; // Not used in the provided final code, but kept if needed elsewhere
import { 
  AudioRecorder, 
  createAudioUrl, 
  analyzeAudio,
  DetailedAnalysisResult 
} from "@/utils/audioRecorder"; // Ensure this path is correct
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils"; // Ensure this path is correct
import { useToast } from "@/hooks/use-toast"; // Ensure this path is correct
import LiveReactionFeedback from "@/components/LiveReactionFeedback"; // Ensure this path is correct

// You'll need to install recharts: npm install recharts or yarn add recharts
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';

// --- Helper Components & Constants ---

// Constants for Radar Chart
const baseRadarMetricsConfig = [
  { subject: 'Pace', fullMark: 100 },
  { subject: 'Tonality', fullMark: 100 },
  { subject: 'Expression', fullMark: 100 }, // Mocked for audio-only
  { subject: 'Energy', fullMark: 100 },
  { subject: 'Fluency', fullMark: 100 },   // (Pauses + Fillers)
  { subject: 'Volume', fullMark: 100 },
  { subject: 'Articulation', fullMark: 100 }, // Mocked for audio-only
];

const getInitialRadarData = () => baseRadarMetricsConfig.map(m => ({ ...m, score: 0 }));

interface RadarDataPoint {
  subject: string;
  score: number;
  fullMark: number;
}

interface RechartsRadarChartComponentProps {
  data: RadarDataPoint[];
  title?: string;
  isLive?: boolean;
}

const RechartsRadarChartComponent: React.FC<RechartsRadarChartComponentProps> = ({ data, title, isLive = false }) => {
  if (!data || data.length === 0) {
    return <p className="text-center text-sm text-gray-500 py-4">Chart data is not available yet.</p>;
  }

  const processedData = data.map(item => ({
    ...item,
    score: Math.max(0, Math.min(item.score, 100)), // Ensure scores are 0-100
  }));

  return (
    <div style={{ width: '100%', height: isLive ? 300 : 350 }} className="my-2">
      {title && <h3 className="text-md font-semibold mb-1 text-center">{title}</h3>}
      <ResponsiveContainer>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={processedData}>
          <PolarGrid strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} /> {/* Adjusted tick color */}
          <PolarRadiusAxis 
            angle={30} // Positions the labels for radius axis
            domain={[0, 100]} 
            tickCount={6} 
            tickFormatter={(value) => `${value}`} 
            tick={{ fontSize: 10, fill: '#6b7280' }} // Adjusted tick color
          />
          <Radar 
            name="Performance" 
            dataKey="score" 
            stroke={isLive ? "#a78bfa" : "#3b82f6"} // purple for live, blue for final
            fill={isLive ? "#a78bfa" : "#3b82f6"} 
            fillOpacity={isLive ? 0.5 : 0.6} 
            animationDuration={isLive ? 300 : 800}
          />
          {!isLive && <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />} {/* Added padding to legend */}
          {!isLive && <RechartsTooltip contentStyle={{fontSize: '12px', padding: '5px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)'}} />} {/* Styled tooltip */}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ReactionGallery = ({ collectedReactions }: { collectedReactions: string[] }) => {
  if (!collectedReactions || collectedReactions.length === 0) {
    return null; 
  }
  return (
    <div className="my-6 p-4 border border-dashed border-yellow-400 rounded-lg bg-yellow-50/50">
      <h3 className="text-lg font-semibold mb-2 text-yellow-700 text-center">
        🌟 Woohoo! Your Audience Loved These Moments! 🌟
      </h3>
      <p className="text-sm text-yellow-600 text-center mb-4">
        You're doing great! Keep practicing to capture even more positive reactions.
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3 p-3 bg-white/70 rounded-md shadow-inner">
        {collectedReactions.map((emoji, index) => (
          <div 
            key={index} 
            className="text-3xl sm:text-4xl p-2 bg-white rounded-lg shadow-md hover:scale-125 transform transition-all duration-200 ease-in-out flex items-center justify-center aspect-square cursor-default"
            title={`Positive reaction: ${emoji}`} 
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
};

const ScoreItem = ({ 
  label, 
  score, 
  description, 
  highlight = false 
}: { 
  label: string; 
  score: number; 
  description: string; 
  highlight?: boolean;
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  
  return (
    <div className={cn("space-y-2 py-2", highlight && "border-l-4 border-blue-500 pl-3 -ml-3")}> {/* Added py-2 for spacing */}
      <div className="flex justify-between items-center">
        <div>
          <span className="font-medium">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className={cn("font-bold text-lg", getScoreColor(score))}>
          {score}/100
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
};

// --- Main Practice Component ---
const Practice = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('application/octet-stream');
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysis, setAnalysis] = useState<DetailedAnalysisResult | null>(null);
  const [analyzingAudio, setAnalyzingAudio] = useState(false);
  const [showPrompt, setShowPrompt] = useState(true);
  const [focusArea, setFocusArea] = useState<'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all'>('all');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Radar chart state
  const [liveRadarData, setLiveRadarData] = useState<RadarDataPoint[]>(getInitialRadarData());
  const [finalRadarData, setFinalRadarData] = useState<RadarDataPoint[] | null>(null);
  
  const audioRecorder = useRef<AudioRecorder>(new AudioRecorder());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
  };
  
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    let intervalId: number | null = null;
    if (isRecording) {
      setLiveRadarData(baseRadarMetricsConfig.map(m => ({ ...m, score: Math.floor(15 + Math.random() * 25) })));
      intervalId = window.setInterval(() => {
        setLiveRadarData(prevData =>
          prevData.map(metric => ({
            ...metric,
            score: Math.min(100, Math.max(0, metric.score + Math.floor(Math.random() * 15 - 6))),
          }))
        );
      }, 750);
    } else {
      if (!finalRadarData) { // Only reset if no final data is present (i.e., not after analysis)
          setLiveRadarData(getInitialRadarData());
      }
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isRecording, finalRadarData]);
  
  const startRecording = async () => {
    try {
      await audioRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      setAudioUrl(null);
      setAudioBlob(null);
      setAnalysis(null);
      setFinalRadarData(null); 
      // liveRadarData is handled by useEffect
      startTimer();
      toast({ title: "Recording started", description: "Speak clearly into your microphone" });
    } catch (error) {
      console.error("Error starting recording:", error);
      toast({ title: "Recording failed", description: "Microphone access denied or not available", variant: "destructive" });
    }
  };
  
  const stopRecording = async () => {
    if (!audioRecorder.current.isRecording()) return;
    try {
      const blob = await audioRecorder.current.stop();
      const actualMimeType = audioRecorder.current.getActualMimeType() || 'application/octet-stream';
      setAudioBlob(blob);
      const url = createAudioUrl(blob);
      setAudioUrl(url);
      setMimeType(actualMimeType);
      setIsRecording(false); // This will trigger liveRadarData reset via useEffect if needed
      stopTimer();
      toast({ title: "Recording complete", description: "Analyzing your vocal performance..." });
      
      setAnalyzingAudio(true);
      const result = await analyzeAudio(blob, focusArea, actualMimeType); // Ensure analyzeAudio exists and returns DetailedAnalysisResult
      setAnalysis(result);
      setAnalyzingAudio(false);
      
      if (result) {
        const newFinalRadarData = [
          { subject: 'Pace', score: result.paceScore, fullMark: 100 },
          { subject: 'Tonality', score: result.tonalityScore, fullMark: 100 },
          { subject: 'Expression', score: result.detailedMetrics.pitchVariation, fullMark: 100 }, 
          { subject: 'Energy', score: Math.min(100, Math.floor(result.detailedMetrics.volumeVariation * 1.1 + 10)), fullMark: 100 },
          { subject: 'Fluency', score: Math.floor(result.fillerWordsScore), fullMark: 100 },
          { subject: 'Drama', score: Math.floor(result.pausesScore) , fullMark: 100 },
        ].map(item => ({...item, score: Math.max(0, Math.min(100, Math.round(item.score)))}));
        setFinalRadarData(newFinalRadarData);
      }
      
      toast({ title: "Analysis complete", description: `Overall score: ${result.overallScore}/100` });
    } catch (error) {
      console.error("Error stopping recording:", error);
      setIsRecording(false);
      stopTimer();
      setAnalyzingAudio(false);
      toast({ title: "Recording error", description: "There was a problem processing your recording", variant: "destructive" });
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
  
  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setAnalysis(null);
    setRecordingTime(0);
    setShowPrompt(true);
    setFinalRadarData(null);
    setLiveRadarData(getInitialRadarData()); // Explicitly reset live radar data
    setIsPlaying(false);
    if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.src = ''; // Clear src to ensure it stops completely
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const reanalyzeWithFocus = async (area: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all') => {
    if (!audioBlob || !analysis) return; // Ensure audioBlob and previous analysis exist
    setFocusArea(area);
    setAnalyzingAudio(true);
    toast({ title: "Reanalyzing recording", description: `Focusing on ${area.replace('-', ' ')}...` });
    const result = await analyzeAudio(audioBlob, area);
    setAnalysis(result);
    
     if (result) { // Update final radar data based on new analysis
        const currentExpression = finalRadarData?.find(d => d.subject === 'Expression')?.score || Math.floor(50 + Math.random() * 30);
        const currentArticulation = finalRadarData?.find(d => d.subject === 'Articulation')?.score || Math.floor(45 + Math.random() * 35);

        const newFinalRadarData = [
          { subject: 'Pace', score: result.paceScore, fullMark: 100 },
          { subject: 'Tonality', score: result.tonalityScore, fullMark: 100 },
          { subject: 'Expression', score: currentExpression, fullMark: 100 }, 
          { subject: 'Energy', score: Math.min(100, Math.floor(result.detailedMetrics.volumeVariation * 1.1 + 10)), fullMark: 100 },
          { subject: 'Fluency', score: Math.floor((result.pausesScore + result.fillerWordsScore) / 2), fullMark: 100 },
          { subject: 'Volume', score: result.detailedMetrics.volumeVariation, fullMark: 100 },
          { subject: 'Articulation', score: currentArticulation, fullMark: 100 }, 
        ].map(item => ({...item, score: Math.max(0, Math.min(100, Math.round(item.score)))}));
        setFinalRadarData(newFinalRadarData);
      }
    setAnalyzingAudio(false);
    toast({ title: "Analysis updated", description: `New focus: ${area.replace('-', ' ')}` });
  };
  
  useEffect(() => {
    // Cleanup audio URL on component unmount or when audioUrl changes
    let currentAudioUrl = audioUrl;
    return () => {
      stopTimer();
      if (currentAudioUrl) {
        URL.revokeObjectURL(currentAudioUrl);
      }
    };
  }, [audioUrl]); // Only audioUrl dependency here, timer is managed separately
  
  return (
    <Layout>
      <div className="p-4 space-y-5">
        <h1 className="text-2xl font-bold">Practice</h1>
        
        {showPrompt && (
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <h3 className="font-medium">Today's Practice</h3>
                {(audioUrl || analysis) && ( // Show X if there's a recording or analysis
                  <Button variant="ghost" size="sm" className="h-auto p-1" onClick={() => setShowPrompt(false)}>
                    <X size={18} />
                  </Button>
                )}
              </div>
              <p className="text-sm mt-2">
                Practice giving a short 1-2 minute speech introducing yourself and describing what communication skills you want to improve.
              </p>
              
              {(audioUrl || analysis) && ( // Show focus options if there's a recording or analysis
                <div className="mt-3">
                  <h4 className="text-sm font-medium mb-2">Focus your analysis:</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant={focusArea === 'rate-volume' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('rate-volume')}
                      disabled={!audioBlob || analyzingAudio}
                    >
                      Rate & Volume
                    </Button>
                    <Button 
                      variant={focusArea === 'pitch-tonality' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('pitch-tonality')}
                      disabled={!audioBlob || analyzingAudio}
                    >
                      Pitch & Tonality
                    </Button>
                    <Button 
                      variant={focusArea === 'pause-fillers' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('pause-fillers')}
                      disabled={!audioBlob || analyzingAudio}
                    >
                      Pauses & Fillers
                    </Button>
                    <Button 
                      variant={focusArea === 'all' ? 'default' : 'outline'} 
                      size="sm" 
                      onClick={() => reanalyzeWithFocus('all')}
                      disabled={!audioBlob || analyzingAudio}
                    >
                      All Aspects
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <div className="flex flex-col items-center justify-center py-4">
          {!isRecording && !audioUrl && (
            <div className="text-center space-y-4">
              <div className="record-button mx-auto cursor-pointer p-4 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" onClick={startRecording}> {/* Added styles to record-button div */}
                <Mic size={32} className="text-blue-600"/>
              </div>
              <p className="text-sm">Tap to start recording</p>
            </div>
          )}
          
          {isRecording && (
            <div className="text-center space-y-2 w-full">
              <div className="text-xl font-semibold">{formatTime(recordingTime)}</div>
              <div className="animate-pulse-light">
                <div className="record-button mx-auto cursor-pointer p-4 rounded-full bg-red-100 hover:bg-red-200 transition-colors" onClick={stopRecording}> {/* Added styles to record-button div */}
                  <StopCircle size={32} className="text-red-500"/>
                </div>
              </div>
              <p className="text-sm">Recording... Tap to stop</p>
              
              <div className="mt-2 min-h-[80px] flex items-center justify-center">
                <LiveReactionFeedback isActive={isRecording} />
              </div>

              <div className="mt-3 w-full max-w-sm mx-auto">
                <RechartsRadarChartComponent data={liveRadarData} title="Live Performance Snapshot" isLive={true} />
              </div>
            </div>
          )}
          
          {audioUrl && !isRecording && ( // Only show playback if not currently recording and audioURL exists
            <div className="w-full space-y-4 mt-4">
              <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="w-full"/>
              
              <div className="flex items-center justify-center space-x-4">
                <Button 
                  variant="outline" 
                  className="w-12 h-12 rounded-full p-0"
                  onClick={togglePlayback}
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                </Button>
              </div>
              
              <div className="flex justify-center space-x-4">
                <Button variant="outline" onClick={resetRecording}>
                  Record again
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {analyzingAudio && (
          <div className="text-center py-6">
            <div className="inline-block animate-pulse-light"> {/* Assuming animate-pulse-light is defined */}
              <div className="h-12 w-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin mx-auto"></div> {/* Using specific color for spinner */}
            </div>
            <p className="mt-3 text-sm">Analyzing your recording...</p>
          </div>
        )}
        
        {analysis && !isRecording && ( // Only show analysis if analysis exists and not currently recording
          <div className="space-y-5">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart size={20} />
              Analysis Results
              <span className="text-sm font-normal text-gray-500 ml-2">
                Focus: {focusArea.replace('-', ' ')}
              </span>
            </h2>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5"> {/* Responsive grid cols */}
                <TabsTrigger value="overview"><Eye size={16} className="inline mr-1 sm:mr-2"/>Overview</TabsTrigger>
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger> {/* Shortened "Detailed Metrics" */}
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="pt-4">
                {finalRadarData && (
                  <Card>
                    <CardHeader className="pb-2 pt-4"> {/* Adjusted padding */}
                      <CardTitle className="text-lg text-center">Final Performance Radar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <RechartsRadarChartComponent data={finalRadarData} />
                    </CardContent>
                  </Card>
                )}
                 <div className="pt-6 border-t mt-6"> {/* Added more spacing */}
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-md">Overall Score</span> {/* Increased font size */}
                    <span className={cn(
                      "text-xl font-bold", // Increased font size
                      analysis.overallScore >= 80 ? "text-green-600" :
                      analysis.overallScore >= 60 ? "text-yellow-600" :
                      "text-red-600"
                    )}>
                      {analysis.overallScore}/100
                    </span>
                  </div>
                  <Progress value={analysis.overallScore} className="h-3" />
                </div>
              </TabsContent>
              
              <TabsContent value="scores" className="space-y-1 pt-4"> {/* Reduced space-y */}
                <ScoreItem 
                  label="Pace" 
                  score={analysis.paceScore} 
                  description="Appropriate speaking rate"
                  highlight={focusArea === 'rate-volume' || focusArea === 'all'}
                />
                <ScoreItem 
                  label="Tonality" 
                  score={analysis.tonalityScore} 
                  description="Variation in pitch and emphasis"
                  highlight={focusArea === 'pitch-tonality' || focusArea === 'all'}
                />
                <ScoreItem 
                  label="Pauses" 
                  score={analysis.pausesScore} 
                  description="Effective use of pauses"
                  highlight={focusArea === 'pause-fillers' || focusArea === 'all'}
                />
                <ScoreItem 
                  label="Filler Words" 
                  score={analysis.fillerWordsScore} 
                  description="Minimizing 'um', 'uh', etc."
                  highlight={focusArea === 'pause-fillers' || focusArea === 'all'}
                />
              </TabsContent>
              
              <TabsContent value="metrics" className="pt-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Speaking Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Words per minute</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.wordsPerMinute}</p>
                          <p className="text-xs text-gray-400">
                            {analysis.detailedMetrics.wordsPerMinute > 160 ? "Faster than average" : 
                             analysis.detailedMetrics.wordsPerMinute < 130 ? "Slower than average" : "Good pace"}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Volume variation</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.volumeVariation}/100</p>
                          <p className="text-xs text-gray-400">
                            {analysis.detailedMetrics.volumeVariation > 75 ? "Excellent dynamic range" : 
                             analysis.detailedMetrics.volumeVariation < 50 ? "Monotonous volume" : "Good variation"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Pauses & Filler Words</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Strategic pauses</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.pauseMetrics.totalPauses}</p>
                          <p className="text-xs text-gray-400">
                            Avg. duration: {analysis.detailedMetrics.pauseMetrics.averagePauseDuration.toFixed(1)}s
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Filler words</p>
                          <p className="text-xl font-semibold">{analysis.detailedMetrics.fillerWordCount.total}</p>
                          <p className="text-xs text-gray-400">
                            (e.g., um: {analysis.detailedMetrics.fillerWordCount.um}, 
                            like: {analysis.detailedMetrics.fillerWordCount.like})
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-md">Pitch Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p className="text-sm text-gray-500">Pitch variation</p>
                        <p className="text-xl font-semibold">{analysis.detailedMetrics.pitchVariation}/100</p>
                        <p className="text-xs text-gray-400">
                          {analysis.detailedMetrics.pitchVariation > 75 ? "Excellent expressiveness" : 
                           analysis.detailedMetrics.pitchVariation < 50 ? "Monotonous pitch" : "Good variation"}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="feedback" className="pt-4">
                <div className="space-y-5">
                  <ReactionGallery 
                    collectedReactions={["🤩", "🎉", "👏", "👍", "💯", "🥳", "🙌", "✨", "🎯", "💡", "🔥", "✅"]} 
                  />

                  <div className="space-y-3">
                    <h3 className="text-md font-semibold">General Feedback</h3>
                    {analysis.feedback.length > 0 ? analysis.feedback.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-100 rounded-lg shadow-sm"> {/* Added shadow */}
                        <p className="text-sm">{item}</p>
                      </div>
                    )) : <p className="text-sm text-gray-500">No general feedback available for this recording.</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-md font-semibold">Improvement Suggestions</h3>
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 text-blue-600">Rate & Pace</h4> {/* Styled heading */}
                        {analysis.specificSuggestions.pace.length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside">
                            {analysis.specificSuggestions.pace.map((suggestion, index) => (
                                <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                                {suggestion}
                                </li>
                            ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500 italic">No specific suggestions for pace.</p>}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 text-blue-600">Pitch & Tonality</h4>
                         {analysis.specificSuggestions.pitch.length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside">
                            {analysis.specificSuggestions.pitch.map((suggestion, index) => (
                                <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                                {suggestion}
                                </li>
                            ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500 italic">No specific suggestions for pitch & tonality.</p>}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-medium mb-2 text-blue-600">Filler Words</h4>
                        {analysis.specificSuggestions.fillers.length > 0 ? (
                            <ul className="space-y-2 list-disc list-inside">
                            {analysis.specificSuggestions.fillers.map((suggestion, index) => (
                                <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                                {suggestion}
                                </li>
                            ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500 italic">No specific suggestions for filler words.</p>}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="transcript" className="pt-4">
                <Card>
                  <CardHeader className="pb-2"> {/* Added header */}
                    <CardTitle className="text-md">Transcription</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap max-h-60 overflow-y-auto border"> {/* Added max-h and border */}
                      {analysis.transcription || "Transcription not available."}
                    </div>
                    <p className="text-xs text-gray-500 mt-3">
                      Note: This is an AI-generated transcription and may not be 100% accurate.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="pt-4">
              <Button className="w-full" size="lg">Save to My Progress</Button> {/* Made button larger */}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Practice;