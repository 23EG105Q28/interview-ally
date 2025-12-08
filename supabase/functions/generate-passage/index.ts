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
    const { difficulty, topic } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const wordCounts: Record<string, number> = {
      easy: 150,
      medium: 250,
      hard: 400,
    };

    const targetWords = wordCounts[difficulty] || 200;

    const systemPrompt = `You are a passage generator for a speech reading test. Generate a clear, professional passage that:
- Is exactly around ${targetWords} words
- Uses proper punctuation and sentence structure
- Is suitable for professional speech practice
- Contains varied vocabulary appropriate for the difficulty level
- Topic: ${topic || "general professional communication"}

Return ONLY the passage text, no titles or explanations.`;

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
          { role: "user", content: `Generate a ${difficulty} difficulty passage about ${topic || "professional workplace communication"}.` },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const passage = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ passage: passage.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate passage error:", error);
    // Return fallback passage
    return new Response(
      JSON.stringify({ 
        passage: `Effective communication is essential in today's professional environment. Whether you are presenting ideas to colleagues, negotiating with clients, or collaborating on projects, your ability to express thoughts clearly can significantly impact your success.

Strong communicators understand their audience and adapt their message accordingly. They use appropriate vocabulary, maintain a confident tone, and organize their thoughts logically. Active listening is equally important, as it demonstrates respect and helps build meaningful connections.

In the workplace, clear communication reduces misunderstandings and improves productivity. Team members who communicate effectively can resolve conflicts more easily and work together more harmoniously. Leaders who master this skill inspire trust and motivate their teams to achieve common goals.

Practice is key to improving communication skills. Regular reading helps expand vocabulary, while public speaking opportunities build confidence. Remember that effective communication is a journey, not a destination. Continue to learn, adapt, and grow in your professional interactions.`
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
