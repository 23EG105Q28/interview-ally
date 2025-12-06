import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, targetRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert resume analyzer and ATS specialist. Analyze the provided resume and return a detailed JSON assessment.

Your response MUST be valid JSON with this exact structure:
{
  "overallScore": number (0-100),
  "categories": [
    {
      "name": "ATS Compatibility",
      "score": number (0-100),
      "status": "good" | "warning" | "error",
      "feedback": "brief feedback string"
    },
    {
      "name": "Keyword Optimization", 
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "brief feedback string"
    },
    {
      "name": "Achievement Focus",
      "score": number,
      "status": "good" | "warning" | "error", 
      "feedback": "brief feedback string"
    },
    {
      "name": "Formatting & Layout",
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "brief feedback string"
    },
    {
      "name": "Grammar & Clarity",
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "brief feedback string"
    },
    {
      "name": "Role Relevance",
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "brief feedback string"
    }
  ],
  "missingKeywords": ["keyword1", "keyword2", ...],
  "strengths": ["strength1", "strength2", "strength3"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "summary": "2-3 sentence overall summary"
}

Scoring guide:
- 85-100: "good" status
- 60-84: "warning" status  
- Below 60: "error" status

Be specific and actionable in your feedback.`;

    const userMessage = `Analyze this resume${targetRole ? ` for the role of ${targetRole}` : ''}:

${resumeText}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysisText = data.choices?.[0]?.message?.content;
    
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch {
      console.error("Failed to parse AI response as JSON:", analysisText);
      throw new Error("Failed to parse resume analysis");
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Resume analysis error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
