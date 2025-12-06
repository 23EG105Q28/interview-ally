import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type PersonalityKey = "friendly" | "professional" | "strict" | "technical" | "analytical";

const interviewerPersonalities: Record<PersonalityKey, string> = {
  friendly: "You are a friendly and encouraging HR interviewer. You're warm, supportive, and put candidates at ease. You give positive reinforcement while still asking probing questions. Use conversational language and occasional humor.",
  professional: "You are a formal and structured HR professional. You maintain a courteous but businesslike demeanor. You follow interview best practices, ask standardized questions, and evaluate responses objectively.",
  strict: "You are a demanding hiring manager with high standards. You ask tough follow-up questions, challenge vague answers, and expect concrete examples with metrics. You're direct and don't accept surface-level responses.",
  technical: "You are a senior technical expert conducting a deep-dive interview. You ask detailed technical questions, probe for depth of understanding, and expect candidates to explain their thought process clearly.",
  analytical: "You are an analytical AI interviewer focused on data and patterns. You evaluate responses for logical consistency, quantifiable achievements, and evidence-based claims. You ask for specifics and metrics."
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, personality = "professional" } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const validPersonality: PersonalityKey = (personality in interviewerPersonalities) 
      ? personality as PersonalityKey 
      : "professional";
    
    const systemPrompt = `${interviewerPersonalities[validPersonality]}

You are conducting a realistic job interview. Follow these rules:
1. Ask ONE question at a time and wait for the candidate's response
2. Provide brief, natural reactions to answers before asking the next question
3. Adapt your follow-up questions based on their responses
4. If an answer is vague, ask for specifics or examples
5. Keep track of the interview flow - don't repeat similar questions
6. After 6-8 exchanges, start wrapping up the interview
7. Always stay in character as the interviewer - never break the fourth wall
8. Respond naturally as if in a real interview setting

When action is "analyze", provide a brief 2-3 sentence assessment of the candidate's last response including:
- Strengths in the response
- Areas for improvement
- Estimated confidence score (0-100)

Current interview context: This is a professional interview for a mid-level position.`;

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
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error: unknown) {
    console.error("Interview chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
