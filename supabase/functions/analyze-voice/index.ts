
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to process audio in chunks to prevent memory issues
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  const chunks: Uint8Array[] = [];
  let position = 0;
  
  while (position < base64String.length) {
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    
    for (let i = 0; i < binaryChunk.length; i++) {
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    
    chunks.push(bytes);
    position += chunkSize;
  }

  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}

// Function to get feedback on vocal performance based on focus area
async function getVocalFeedback(transcription: string, focusArea: string, audioLength: number) {
  const promptMap = {
    'rate-volume': `
      Analyze this speech transcription focusing on rate of speech and volume:
      "${transcription}"
      
      The audio was ${audioLength} seconds long.
      
      Provide an analysis in JSON format with these fields:
      - paceScore (0-100): How well the speaker maintained appropriate speaking rate
      - detailedMetrics: Object containing wordsPerMinute (calculated) and volumeVariation (estimated 0-100)
      - feedback: Array of 2-3 specific observations about their rate and volume
      - specificSuggestions: Object with 'pace' and 'volume' arrays, each with 2-3 specific improvement tips
    `,
    'pitch-tonality': `
      Analyze this speech transcription focusing on pitch variation and tonality:
      "${transcription}"
      
      Provide an analysis in JSON format with these fields:
      - tonalityScore (0-100): How well the speaker used tonality to express emotion
      - detailedMetrics: Object containing pitchVariation (estimated 0-100)
      - feedback: Array of 2-3 specific observations about their pitch and tonality
      - specificSuggestions: Object with 'pitch' array containing 2-3 specific improvement tips
    `,
    'pause-fillers': `
      Analyze this speech transcription focusing on strategic pauses and filler words:
      "${transcription}"
      
      Provide an analysis in JSON format with these fields:
      - pausesScore (0-100): How effectively the speaker used pauses
      - fillerWordsScore (0-100): How well the speaker avoided filler words
      - detailedMetrics: Object containing pauseMetrics (with totalPauses, averagePauseDuration) and fillerWordCount metrics
      - feedback: Array of 2-3 specific observations about their pauses and filler words
      - specificSuggestions: Object with 'fillers' array containing 2-3 specific improvement tips
    `,
    'all': `
      Analyze this speech transcription focusing on all vocal elements:
      "${transcription}"
      
      The audio was ${audioLength} seconds long.
      
      Provide a comprehensive analysis in JSON format with these fields:
      - paceScore (0-100): Rate of speech quality
      - tonalityScore (0-100): Pitch and emotional expression
      - pausesScore (0-100): Strategic pause usage
      - fillerWordsScore (0-100): Avoidance of filler words
      - overallScore (0-100): Overall vocal delivery quality
      - detailedMetrics: Object containing:
        - wordsPerMinute (calculated)
        - volumeVariation (estimated 0-100)
        - pitchVariation (estimated 0-100)
        - pauseMetrics (with totalPauses, averagePauseDuration)
        - fillerWordCount (with counts for different fillers)
      - feedback: Array of 3-4 general observations about their vocal delivery
      - specificSuggestions: Object with 'pace', 'volume', 'pitch', and 'fillers' arrays, each with 2 specific improvement tips
    `
  };

  const prompt = promptMap[focusArea] || promptMap['all'];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert voice coach specialized in analyzing vocal delivery. Provide specific, actionable feedback on speech recordings. Format your response as valid JSON only, with no additional text.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting vocal feedback:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio, focusArea, exerciseText } = await req.json();
    
    if (!audio) {
      throw new Error('No audio data provided');
    }

    // First, get transcription from OpenAI Whisper
    // Process audio in chunks
    const binaryAudio = processBase64Chunks(audio);
    
    // Prepare form data for transcription
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');

    // Send to OpenAI for transcription
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
      },
      body: formData,
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI Transcription API error:', errorText);
      throw new Error(`OpenAI Transcription API error: ${transcriptionResponse.status}`);
    }

    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text;
    
    if (!transcription) {
      throw new Error('Failed to transcribe audio');
    }

    // Calculate audio length in seconds (approximate from base64 size)
    const audioLength = Math.round(audio.length / 10000); // Rough approximation
    
    // Get analysis from GPT-4o based on the transcription
    const analysisJson = await getVocalFeedback(transcription, focusArea, audioLength);
    
    try {
      // Parse the JSON response
      const analysis = JSON.parse(analysisJson);
      
      // Ensure we have a complete analysis object with all required fields
      const completeAnalysis = {
        paceScore: analysis.paceScore || 70,
        tonalityScore: analysis.tonalityScore || 70,
        pausesScore: analysis.pausesScore || 70,
        fillerWordsScore: analysis.fillerWordsScore || 70,
        overallScore: analysis.overallScore || Math.round((analysis.paceScore + analysis.tonalityScore + analysis.pausesScore + analysis.fillerWordsScore) / 4),
        detailedMetrics: {
          wordsPerMinute: analysis.detailedMetrics?.wordsPerMinute || Math.round(transcription.split(' ').length / (audioLength / 60)),
          volumeVariation: analysis.detailedMetrics?.volumeVariation || 70,
          pitchVariation: analysis.detailedMetrics?.pitchVariation || 70,
          fillerWordCount: analysis.detailedMetrics?.fillerWordCount || {
            um: 0,
            uh: 0,
            like: 0,
            youKnow: 0,
            total: 0
          },
          pauseMetrics: analysis.detailedMetrics?.pauseMetrics || {
            totalPauses: 0,
            averagePauseDuration: 0.8,
            strategicPauseScore: 70
          }
        },
        feedback: analysis.feedback || ["You demonstrated good vocal delivery overall."],
        specificSuggestions: {
          pace: analysis.specificSuggestions?.pace || ["Try varying your pace more to emphasize key points."],
          volume: analysis.specificSuggestions?.volume || ["Practice projecting your voice more consistently."],
          pitch: analysis.specificSuggestions?.pitch || ["Experiment with more variation in your pitch range."],
          fillers: analysis.specificSuggestions?.fillers || ["Be mindful of filler words and replace them with strategic pauses."]
        },
        transcription: transcription
      };

      return new Response(JSON.stringify(completeAnalysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (parseError) {
      console.error('Error parsing analysis JSON:', parseError);
      throw new Error('Failed to parse analysis response');
    }
    
  } catch (error) {
    console.error('Error in analyze-voice function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      fallback: true,
      message: "Using fallback analysis due to API error"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
