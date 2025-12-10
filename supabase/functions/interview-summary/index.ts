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
    const { messages, duration, questionCount } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Format transcript for analysis
    const transcript = messages
      .map((m: { role: string; content: string }) => 
        `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`
      )
      .join("\n\n");

    const systemPrompt = `You are an expert interview coach and hiring manager with 20+ years of experience analyzing candidate performance.

Analyze the interview transcript thoroughly and provide detailed, actionable feedback in these categories:

1. **Overall Summary** (3-4 sentences): Describe the candidate's overall performance, interview readiness, and professional impression.

2. **Communication Skills** (provide specific examples from transcript):
   - Clarity and articulation
   - Active listening indicators
   - Response structure (STAR method usage)
   - Professional vocabulary

3. **Technical/Content Skills** (based on responses):
   - Depth of knowledge demonstrated
   - Ability to explain complex concepts
   - Real-world examples provided

4. **Confidence & Presence**:
   - Response timing and pacing
   - Assertiveness in answers
   - Handling of difficult questions

5. **Specific Improvements** (actionable with examples):
   - What specific phrases or responses could be improved
   - What was missing from their answers
   - Concrete practice suggestions

Respond in JSON format:
{
  "summary": "Detailed 3-4 sentence overview...",
  "strengths": [
    "Communication: Specific strength with example...",
    "Technical: Specific strength...",
    "Confidence: Specific strength...",
    "Additional strength..."
  ],
  "improvements": [
    "Communication: Specific area with actionable advice...",
    "Technical: Specific gap with practice suggestion...",
    "Confidence: Specific improvement with exercise...",
    "Additional improvement..."
  ],
  "detailedFeedback": {
    "communication": {
      "score": 75,
      "feedback": "Detailed communication feedback..."
    },
    "technical": {
      "score": 70,
      "feedback": "Detailed technical feedback..."
    },
    "confidence": {
      "score": 80,
      "feedback": "Detailed confidence feedback..."
    }
  },
  "overallScore": 75,
  "recommendedResources": ["Resource 1", "Resource 2"]
}`;

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
          { 
            role: "user", 
            content: `Interview Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds
Questions Asked: ${questionCount}

Interview Transcript:
${transcript}

Please analyze this interview and provide your assessment.` 
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
      result = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse AI response:", content);
      result = {
        summary: "Interview completed. The candidate showed engagement throughout the session.",
        strengths: ["Good communication", "Active participation", "Professional demeanor"],
        improvements: ["Provide more specific examples", "Practice structured responses"],
        overallScore: 70,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Interview summary error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        summary: "Interview completed successfully.",
        strengths: ["Good participation"],
        improvements: ["Continue practicing"],
        overallScore: 65,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
