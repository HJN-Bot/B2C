// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

// Helper function to process audio in chunks to prevent memory issues
function processBase64Chunks(base64String, chunkSize = 32768) {
  const chunks = [];
  let position = 0;
  while(position < base64String.length){
    const chunk = base64String.slice(position, position + chunkSize);
    const binaryChunk = atob(chunk);
    const bytes = new Uint8Array(binaryChunk.length);
    for(let i = 0; i < binaryChunk.length; i++){
      bytes[i] = binaryChunk.charCodeAt(i);
    }
    chunks.push(bytes);
    position += chunkSize;
  }
  const totalLength = chunks.reduce((acc, chunk)=>acc + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks){
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

// Function to get feedback on vocal performance based on focus area
async function getVocalFeedback(transcription, focusArea, segments, words, audioLength, clientMetrics) {
  // Use clientMetrics if available, otherwise default/estimate
  const volVar = clientMetrics?.calculatedVolumeVariation !== undefined ? clientMetrics.calculatedVolumeVariation : "not available, please estimate";
  const pitchVar = clientMetrics?.calculatedPitchVariation !== undefined ? clientMetrics.calculatedPitchVariation : "not available, please estimate";
  
  // Safely stringify words if it's an object/array, otherwise use as is if already a string
  const wordsString = (typeof words === 'object' && words !== null) ? JSON.stringify(words) : `"${words}"`;

  const promptMap = {
    'rate-volume': `
      Analyze this speech transcription focusing on rate of speech and volume:
      "${transcription}"

      Timestamped words in speech (if available):
      ${wordsString}

      The audio was ${audioLength} seconds long.

      Signal analysis provided:
      - Calculated Volume Variation (0-100): ${volVar}

      Provide an analysis in JSON format with these fields:
      - paceScore (0-100): How well the speaker maintained appropriate speaking rate
      - detailedMetrics: Object containing wordsPerMinute (calculated) and volumeVariation (estimated 0-100, consider provided: ${volVar})
      - feedback: Array of 2-3 specific observations about their rate and volume
      - specificSuggestions: Object with 'pace' and 'volume' arrays, each with 2-3 specific improvement tips
    `,
    'pitch-tonality': `
      Analyze this speech transcription focusing on pitch variation and tonality:
      "${transcription}"

      Timestamped words in speech (if available):
      ${wordsString}

      Signal analysis provided:
      - Calculated Pitch Variation (0-100): ${pitchVar}

      Provide an analysis in JSON format with these fields:
      - tonalityScore (0-100): How well the speaker used tonality to express emotion
      - detailedMetrics: Object containing pitchVariation (estimated 0-100, consider provided: ${pitchVar})
      - feedback: Array of 2-3 specific observations about their pitch and tonality
      - specificSuggestions: Object with 'pitch' array containing 2-3 specific improvement tips
    `,
    'pause-fillers': `
      Analyze this speech transcription focusing on strategic pauses and filler words:
      "${transcription}"

      Timestamped words in speech (if available):
      ${wordsString}

      Client-side analysis of pauses (actual measured silences > 0.5s, not at the very start of recording):
      - Total purposeful pauses detected: ${clientMetrics?.totalPauses ?? "not available"}
      - Average duration of these pauses: ${clientMetrics?.averagePauseDuration ? clientMetrics.averagePauseDuration.toFixed(2) + " seconds" : "not available"}

      Provide an analysis in JSON format with these fields:
      - pausesScore (0-100): How effectively the speaker utilized the *detected actual silences* (as per the provided pause data) for clarity and pacing, in the context of the transcription, not solely on punctuation in the transcription.
      - fillerWordsScore (0-100): How well the speaker avoided filler words.
      - detailedMetrics: Object containing:
        - pauseMetrics: Object with:
          - totalPauses (integer, YOU MUST USE THE PROVIDED VALUE: ${clientMetrics?.totalPauses ?? 0})
          - averagePauseDuration (float, YOU MUST USE THE PROVIDED VALUE: ${clientMetrics?.averagePauseDuration ? parseFloat(clientMetrics.averagePauseDuration.toFixed(2)) : 0})
          - strategicPauseScore (0-100, your assessment of how strategically the *detected actual silences* from the provided data were placed and timed for emphasis, clarity, and overall impact, considering the provided pause data under the context of the transcription, not solely on punctuation in the transcription.)
        - fillerWordCount (object with counts for 'um', 'uh', 'like', 'youKnow', and 'total')
      - feedback: Array of 2-3 specific observations about their pauses (based on the provided data) and filler words.
      - specificSuggestions: Object with a 'fillers' array (2-3 tips) and a 'pauses' array (2-3 tips for strategic use of the detected actual silences).
    `,
    'all': `
      Analyze this speech transcription focusing on all vocal elements:
      "${transcription}"

      Timestamped words in speech (if available):
      ${wordsString}

      The audio was ${audioLength} seconds long.

      Signal analysis provided:
      - Calculated Volume Variation (0-100): ${volVar}
      - Calculated Pitch Variation (0-100): ${pitchVar}
      Client-side analysis of pauses (actual measured silences > 0.5s, not at the very start of recording):
      - Total purposeful pauses detected: ${clientMetrics?.totalPauses ?? "not available"}
      - Average duration of these pauses: ${clientMetrics?.averagePauseDuration ? clientMetrics.averagePauseDuration.toFixed(2) + " seconds" : "not available"}

      Provide a comprehensive analysis in JSON format with these fields:
      - paceScore (0-100): Rate of speech quality
      - tonalityScore (0-100): Pitch and emotional expression
      - pausesScore (0-100): How effectively the speaker utilized the *detected actual silences* (as per the provided pause data) for clarity and pacing, in the context of the transcription, not solely on punctuation in the transcription.
      - fillerWordsScore (0-100): Avoidance of filler words
      - overallScore (0-100): Overall vocal delivery quality
      - detailedMetrics: Object containing:
        - wordsPerMinute (calculated)
        - volumeVariation (estimated 0-100, consider provided: ${volVar})
        - pitchVariation (estimated 0-100, consider provided: ${pitchVar})
        - pauseMetrics: Object with:
          - totalPauses (integer, YOU MUST USE THE PROVIDED VALUE: ${clientMetrics?.totalPauses ?? 0})
          - averagePauseDuration (float, YOU MUST USE THE PROVIDED VALUE: ${clientMetrics?.averagePauseDuration ? parseFloat(clientMetrics.averagePauseDuration.toFixed(2)) : 0})
          - strategicPauseScore (0-100, your assessment of how strategically the *detected actual silences* from the provided data were placed and timed for emphasis, clarity, and overall impact, considering the provided pause data under the context of the transcription, not solely on punctuation in the transcription.)
        - fillerWordCount (object with counts for 'um', 'uh', 'like', 'youKnow', and 'total')
      - feedback: Array of 3-4 general observations about their vocal delivery, including comments on pause usage based on the provided data.
      - specificSuggestions: Object with 'pace', 'volume', 'pitch', 'fillers', and 'pauses' arrays, each with 2 specific improvement tips (pause suggestions should relate to the strategic use of detected actual silences).
    `
  };
  const prompt = promptMap[focusArea] || promptMap['all'];
  try {
    console.log("Calling OpenAI API. Focus Area:", focusArea, "Transcription snippet:", transcription.substring(0, 100) + "...");
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Or your preferred model
        messages: [
          {
            role: 'system',
            content: 'You are an expert voice coach specialized in analyzing vocal delivery. Provide specific, actionable feedback on speech recordings. Format your response as valid JSON only, with no additional text or explanations outside the JSON structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        response_format: {
          type: "json_object"
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    if (!data.choices || data.choices.length === 0 || !data.choices[0].message || !data.choices[0].message.content) {
        console.error('Invalid OpenAI response structure:', data);
        throw new Error('Invalid response structure from OpenAI API.');
    }
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting vocal feedback:', error.message);
    throw error;
  }
}

Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  try {
    const { 
        audio, 
        focusArea, 
        exerciseText, 
        calculatedVolumeVariation, 
        calculatedPitchVariation, 
        clientCalculatedDuration,
        detectedPauses // New: from client
    } = await req.json();

    if (!audio) {
      throw new Error('No audio data provided');
    }
    console.log("Received request. Focus area:", focusArea, "Detected pauses count:", detectedPauses?.length ?? 'N/A');

    const binaryAudio = processBase64Chunks(audio);
    const formData = new FormData();
    const blob = new Blob([binaryAudio], { type: 'audio/webm' });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');
    
    console.log("Calling OpenAI Whisper API for transcription...");
    const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${openAIApiKey}` },
      body: formData
    });

    if (!transcriptionResponse.ok) {
      const errorText = await transcriptionResponse.text();
      console.error('OpenAI Transcription API error:', transcriptionResponse.status, errorText);
      throw new Error(`OpenAI Transcription API error: ${transcriptionResponse.status} - ${errorText}`);
    }
    const transcriptionResult = await transcriptionResponse.json();
    const transcription = transcriptionResult.text || "";
    const whisperDuration = transcriptionResult.duration; // Duration from Whisper
    const segments = transcriptionResult.segments || []; // Ensure it's an array
    const words = transcriptionResult.words || []; // Ensure it's an array
    
    console.log("Transcription received. Duration from Whisper:", whisperDuration, "Client duration:", clientCalculatedDuration);

    if (!transcriptionResult) {
      throw new Error('Failed to transcribe audio or empty transcription result');
    }
    
    const audioLength = clientCalculatedDuration || whisperDuration || Math.round(audio.length / 10000); // Prioritize client, then Whisper, then fallback

    // Calculate pause aggregates from detectedPauses
    let calculatedTotalPauses = 0;
    let calculatedAvgPauseDuration = 0.0;

    if (detectedPauses && Array.isArray(detectedPauses) && detectedPauses.length > 0) {
        calculatedTotalPauses = detectedPauses.length;
        const sumOfDurations = detectedPauses.reduce((acc, p) => acc + (p.duration || 0), 0);
        if (calculatedTotalPauses > 0) {
             calculatedAvgPauseDuration = sumOfDurations / calculatedTotalPauses;
        }
    }
    console.log(`Calculated pause metrics: Total: ${calculatedTotalPauses}, Avg Duration: ${calculatedAvgPauseDuration.toFixed(2)}s`);
    
    const analysisJsonString = await getVocalFeedback(
      transcription, 
      focusArea, 
      segments, 
      words, 
      audioLength, 
      {
        calculatedVolumeVariation: calculatedVolumeVariation,
        calculatedPitchVariation: calculatedPitchVariation,
        totalPauses: calculatedTotalPauses, // Pass calculated value
        averagePauseDuration: calculatedAvgPauseDuration // Pass calculated value
      }
    );

    let llmAnalysis;
    try {
        llmAnalysis = JSON.parse(analysisJsonString);
    } catch (parseError) {
        console.error('Error parsing LLM analysis JSON:', parseError, "JSON string was:", analysisJsonString);
        throw new Error('Failed to parse analysis response from LLM. The response was not valid JSON.');
    }
    
    const wordsPerMinuteValue = (transcription && audioLength > 0) ? Math.round(transcription.split(/\s+/).filter(Boolean).length / (audioLength / 60)) : 0;

    const completeAnalysis = {
      paceScore: llmAnalysis.paceScore ?? 70,
      tonalityScore: llmAnalysis.tonalityScore ?? 70,
      pausesScore: llmAnalysis.pausesScore ?? 70, // From LLM
      fillerWordsScore: llmAnalysis.fillerWordsScore ?? 70,
      overallScore: llmAnalysis.overallScore, // Will be recalculated
      detailedMetrics: {
        wordsPerMinute: llmAnalysis.detailedMetrics?.wordsPerMinute ?? wordsPerMinuteValue,
        volumeVariation: llmAnalysis.detailedMetrics?.volumeVariation ?? calculatedVolumeVariation ?? 70,
        pitchVariation: llmAnalysis.detailedMetrics?.pitchVariation ?? calculatedPitchVariation ?? 70,
        fillerWordCount: llmAnalysis.detailedMetrics?.fillerWordCount ?? { um: 0, uh: 0, like: 0, youKnow: 0, total: 0 },
        pauseMetrics: {
          totalPauses: calculatedTotalPauses, // Use our server-calculated value
          averagePauseDuration: parseFloat(calculatedAvgPauseDuration.toFixed(2)), // Use our server-calculated value
          strategicPauseScore: llmAnalysis.detailedMetrics?.pauseMetrics?.strategicPauseScore ?? 70, // From LLM
        }
      },
      feedback: llmAnalysis.feedback ?? ["General feedback: Good effort, keep practicing!"],
      specificSuggestions: {
        pace: llmAnalysis.specificSuggestions?.pace ?? ["Practice varying your pace for emphasis."],
        volume: llmAnalysis.specificSuggestions?.volume ?? ["Ensure your volume is consistent and audible."],
        pitch: llmAnalysis.specificSuggestions?.pitch ?? ["Use pitch variation to convey emotion effectively."],
        fillers: llmAnalysis.specificSuggestions?.fillers ?? ["Be mindful of filler words; try to replace them with short pauses."],
        pauses: llmAnalysis.specificSuggestions?.pauses ?? ["Use pauses strategically to allow listeners to absorb information and to add emphasis."]
      },
      transcription: transcription,
      duration: whisperDuration, // Use duration from Whisper as the canonical audio duration
      // segments: segments, // Optional: include if your frontend needs them
      // words: words, // Optional: include if your frontend needs them
    };
    
    // Recalculate overallScore based on potentially updated individual scores
    completeAnalysis.overallScore = llmAnalysis.overallScore ?? Math.round(
        (completeAnalysis.paceScore + completeAnalysis.tonalityScore + completeAnalysis.pausesScore + completeAnalysis.fillerWordsScore) / 4
    );

    console.log("Analysis complete, sending response. Overall Score:", completeAnalysis.overallScore);
    return new Response(JSON.stringify(completeAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Critical error in analyze-voice function:', error.message, error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      fallback: true, // Indicate that this is a fallback response
      message: "An error occurred during analysis. Fallback data may be incomplete."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});