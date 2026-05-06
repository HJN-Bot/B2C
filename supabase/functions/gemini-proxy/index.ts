import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_MODEL_DEFAULT = "gemini-2.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

function getGeminiApiKey() {
  return (
    Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY")
  );
}

function extractText(data: any): string {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";
  return parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .filter(Boolean)
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Gemini API key is not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }

  try {
    const body = await req.json();
    const model = typeof body?.model === "string" && body.model.trim() ? body.model.trim() : GEMINI_MODEL_DEFAULT;
    const contents = Array.isArray(body?.contents) ? body.contents : [];
    const systemInstruction = typeof body?.systemInstruction === "string" && body.systemInstruction.trim()
      ? { parts: [{ text: body.systemInstruction }] }
      : undefined;

    const generationConfig: Record<string, unknown> = {};
    if (typeof body?.responseMimeType === "string" && body.responseMimeType.trim()) {
      generationConfig.responseMimeType = body.responseMimeType.trim();
    }
    if (typeof body?.temperature === "number") {
      generationConfig.temperature = body.temperature;
    }
    if (typeof body?.maxOutputTokens === "number") {
      generationConfig.maxOutputTokens = body.maxOutputTokens;
    }

    const payload: Record<string, unknown> = { contents };
    if (systemInstruction) payload.systemInstruction = systemInstruction;
    if (Object.keys(generationConfig).length) payload.generationConfig = generationConfig;
    if (Array.isArray(body?.safetySettings)) payload.safetySettings = body.safetySettings;

    const response = await fetch(`${GEMINI_BASE_URL}/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Gemini request failed", status: response.status, details: rawText }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }

    const data = rawText ? JSON.parse(rawText) : {};
    const text = extractText(data);
    return new Response(JSON.stringify({ text, raw: data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  }
});
