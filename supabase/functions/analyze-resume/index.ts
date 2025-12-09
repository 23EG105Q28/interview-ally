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

    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error("Resume text is too short. Please provide a complete resume.");
    }

    // Truncate if too long
    const maxLength = 50000;
    const processedResumeText = resumeText.length > maxLength 
      ? resumeText.substring(0, maxLength) + "\n\n[Resume truncated for analysis]"
      : resumeText;

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer and professional resume reviewer. Your job is to analyze resumes EXACTLY like real company ATS systems and provide REALISTIC, HONEST scores that candidates would actually receive.

CRITICAL SCORING RULES - BE REALISTIC AND STRICT:
- Most resumes score between 40-70 in real ATS systems
- Only exceptional, perfectly optimized resumes score above 80
- Average resumes typically score 45-60
- Good resumes score 60-75
- Excellent resumes score 75-85
- Perfect resumes (very rare) score 85-95
- NEVER give 100 - no resume is perfect

REAL ATS EVALUATION CRITERIA:

1. ATS COMPATIBILITY (Keyword Matching):
   - Does the resume use standard section headers (Experience, Education, Skills)?
   - Are there parsable contact details?
   - Is formatting simple (no tables, graphics, columns that confuse ATS)?
   - Are job titles and company names clearly stated?
   - Deduct heavily for: fancy formatting, non-standard fonts, images, graphics

2. KEYWORD OPTIMIZATION:
   - Match exact keywords from common job descriptions for the target role
   - Industry-specific terminology and technical skills
   - Action verbs and power words
   - Missing keywords are a major deduction
   - Check for: programming languages, tools, certifications, methodologies

3. ACHIEVEMENT FOCUS (Quantification):
   - Look for specific metrics: percentages, dollar amounts, time saved
   - Accomplishments vs. just listing responsibilities
   - Impact statements with measurable results
   - Most resumes fail here - be strict

4. FORMATTING & STRUCTURE:
   - Consistent date formatting
   - Clear job progression
   - Appropriate length (1-2 pages)
   - White space and readability
   - Bullet points properly used

5. GRAMMAR & CLARITY:
   - Spelling errors (automatic deduction)
   - Grammar issues
   - Passive vs. active voice
   - Clarity of descriptions
   - Professional language

6. ROLE RELEVANCE:
   - How well does experience match the target role?
   - Transferable skills
   - Career progression alignment
   - Recency of relevant experience

Your response MUST be valid JSON with this exact structure:
{
  "overallScore": number (realistically 35-85 for most resumes),
  "categories": [
    {
      "name": "ATS Compatibility",
      "score": number (0-100, be realistic),
      "status": "good" | "warning" | "error",
      "feedback": "specific, actionable feedback"
    },
    {
      "name": "Keyword Optimization", 
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "specific feedback about missing keywords"
    },
    {
      "name": "Achievement Focus",
      "score": number,
      "status": "good" | "warning" | "error", 
      "feedback": "specific feedback about quantification"
    },
    {
      "name": "Formatting & Structure",
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "specific formatting issues"
    },
    {
      "name": "Grammar & Clarity",
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "specific language issues"
    },
    {
      "name": "Role Relevance",
      "score": number,
      "status": "good" | "warning" | "error",
      "feedback": "how well experience matches target role"
    }
  ],
  "missingKeywords": ["specific", "keywords", "the", "resume", "needs"],
  "strengths": ["be specific about what's good", "max 3-4 items"],
  "improvements": ["specific actionable improvements", "prioritized", "max 4-5 items"],
  "summary": "2-3 sentence honest assessment. If the score is low, explain why clearly."
}

SCORING THRESHOLDS:
- 75-100: "good" status (green) - this category is strong
- 50-74: "warning" status (yellow) - needs improvement
- 0-49: "error" status (red) - significant issues

BE HONEST AND HELPFUL: A realistic score helps candidates improve. Inflated scores give false confidence.`;

    const userMessage = `Analyze this resume${targetRole ? ` for the target role of: ${targetRole}` : ' for general job applications'}. 

Be realistic and strict in your scoring - most real ATS systems score resumes between 40-70.

RESUME TEXT:
${processedResumeText}`;

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
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
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
