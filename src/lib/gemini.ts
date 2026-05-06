import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/integrations/supabase/client";

let geminiClientPromise: Promise<GoogleGenerativeAI> | null = null;

async function fetchGeminiApiKey(): Promise<string> {
  const { data, error } = await supabase.functions.invoke("get-gemini-api-key", {});
  if (error) {
    throw new Error(`Gemini key function failed: ${error.message || "Edge Function request failed"}`);
  }

  const key = data?.geminiApiKey;
  if (typeof key !== "string" || !key.trim()) {
    throw new Error("No Gemini API key returned");
  }

  return key.trim();
}

export async function getGeminiClient(): Promise<GoogleGenerativeAI> {
  if (!geminiClientPromise) {
    geminiClientPromise = fetchGeminiApiKey().then((key) => new GoogleGenerativeAI(key));
  }

  return geminiClientPromise;
}

export async function resetGeminiClient() {
  geminiClientPromise = null;
}
