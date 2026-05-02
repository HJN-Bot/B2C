const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const geminiApiKey =
    Deno.env.get("GEMINI_API_KEY") ||
    Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY") ||
    Deno.env.get("GOOGLE_API_KEY");

  if (!geminiApiKey) {
    return new Response(
      JSON.stringify({ error: "Gemini API key is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  return new Response(
    JSON.stringify({ geminiApiKey }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    },
  );
});
