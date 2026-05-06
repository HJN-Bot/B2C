import { supabase } from "@/integrations/supabase/client";

export type GeminiPart =
  | { text: string }
  | { inlineData: { mimeType: string; data: string } };

export interface GeminiProxyRequest {
  model: string;
  contents: Array<{ role?: string; parts: GeminiPart[] }>;
  systemInstruction?: string;
  responseMimeType?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiProxyResponse {
  text: string;
  raw?: unknown;
}

export async function callGeminiProxy(request: GeminiProxyRequest): Promise<GeminiProxyResponse> {
  const { data, error } = await supabase.functions.invoke("gemini-proxy", {
    body: request,
  });

  if (error) {
    throw new Error(error.message || "Gemini proxy request failed");
  }

  const text = typeof data?.text === "string" ? data.text : "";
  return { text, raw: data };
}
