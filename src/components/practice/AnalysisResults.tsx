import { BarChart, Headphones } from "lucide-react";
import { DetailedAnalysisResult } from "@/utils/audioRecorder";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reaction } from "@/models/reactions";

interface AnalysisResultsProps {
  analysis: DetailedAnalysisResult | null;
  analyzingAudio: boolean;
  focusArea: 'rate-volume' | 'pitch-tonality' | 'pause-fillers' | 'all';
  collectedReactions: Reaction[];
}

const AnalysisResults = ({
  analysis,
  analyzingAudio,
  focusArea,
  collectedReactions
}: AnalysisResultsProps) => {
  if (analyzingAudio) {
    return (
      <div className="text-center py-6">
        <div className="inline-block animate-pulse-light">
          <div className="h-12 w-12 rounded-full border-4 border-communi-primary border-t-transparent animate-spin mx-auto"></div>
        </div>
        <p className="mt-3 text-sm">Analyzing your recording...</p>
      </div>
    );
  }
  
  if (!analysis) return null;
  
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <BarChart size={20} />
        Analysis Results
        <span className="text-sm font-normal text-gray-500 ml-2">
          Focus: {focusArea.replace('-', ' ')}
        </span>
      </h2>
      
      <Tabs defaultValue="scores">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scores">Scores</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>
        
        <TabsContent value="scores" className="space-y-4 pt-4">
          <ScoreItem 
            label="Pace" 
            score={analysis.paceScore} 
            description="How well you maintained an appropriate speaking rate"
            highlight={focusArea === 'rate-volume'}
          />
          <ScoreItem 
            label="Tonality" 
            score={analysis.tonalityScore} 
            description="Variation in pitch and emphasis"
            highlight={focusArea === 'pitch-tonality'}
          />
          <ScoreItem 
            label="Pauses" 
            score={analysis.pausesScore} 
            description="Effective use of pauses for emphasis"
            highlight={focusArea === 'pause-fillers'}
          />
          <ScoreItem 
            label="Filler Words" 
            score={analysis.fillerWordsScore} 
            description="Minimizing 'um', 'uh', 'like', etc."
            highlight={focusArea === 'pause-fillers'}
          />
          
          <div className="pt-4 border-t mt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold">Overall Score</span>
              <span className={cn(
                "text-lg font-bold",
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
        
        <TabsContent value="metrics" className="pt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Speaking Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                      um: {analysis.detailedMetrics.fillerWordCount.um}, 
                      like: {analysis.detailedMetrics.fillerWordCount.like}
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
            {/* Display collected reactions */}
            {collectedReactions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-md font-semibold">Audience Reactions</h3>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-3 mb-3">
                    {collectedReactions.map((reaction, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm">
                          {reaction.emoji}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-center">
                    {collectedReactions.length > 5 
                      ? "Impressive! You collected many positive reactions." 
                      : "Good job! Keep practicing to collect more reactions."}
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              <h3 className="text-md font-semibold">General Feedback</h3>
              {analysis.feedback.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{item}</p>
                </div>
              ))}
            </div>
            
            <div className="space-y-3">
              <h3 className="text-md font-semibold">Improvement Suggestions</h3>
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Rate & Pace</h4>
                  <ul className="space-y-2">
                    {analysis.specificSuggestions.pace.map((suggestion, index) => (
                      <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Pitch & Tonality</h4>
                  <ul className="space-y-2">
                    {analysis.specificSuggestions.pitch.map((suggestion, index) => (
                      <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium mb-2">Filler Words</h4>
                  <ul className="space-y-2">
                    {analysis.specificSuggestions.fillers.map((suggestion, index) => (
                      <li key={index} className="text-sm bg-gray-50 p-2 rounded">
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="transcript" className="pt-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium mb-2">Transcription</h3>
              <div className="bg-gray-50 p-3 rounded text-sm whitespace-pre-wrap">
                {analysis.transcription}
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Note: This is an AI-generated transcription and may not be 100% accurate.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="pt-4">
        <Button className="w-full">Save to My Progress</Button>
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
    <div className={cn("space-y-2", highlight && "border-l-4 border-blue-500 pl-3")}>
      <div className="flex justify-between">
        <div>
          <span className="font-medium">{label}</span>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <span className={cn("font-bold", getScoreColor(score))}>
          {score}/100
        </span>
      </div>
      <Progress value={score} className="h-2" />
    </div>
  );
};

export default AnalysisResults;
