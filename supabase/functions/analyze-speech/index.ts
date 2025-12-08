import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Calculate Levenshtein distance for word similarity
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { originalText, spokenText, duration, scrollSpeed } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // Normalize texts for comparison
    const originalWords = normalizeText(originalText).split(" ");
    const spokenWords = normalizeText(spokenText || "").split(" ").filter(w => w);
    
    // Calculate word-level errors
    const wordErrors: { expected: string; spoken: string; index: number }[] = [];
    let correctWords = 0;
    
    const maxLength = Math.max(originalWords.length, spokenWords.length);
    
    for (let i = 0; i < originalWords.length; i++) {
      const expected = originalWords[i];
      const spoken = spokenWords[i] || "";
      
      if (expected === spoken) {
        correctWords++;
      } else if (spoken) {
        // Check if it's a minor pronunciation difference
        const distance = levenshteinDistance(expected, spoken);
        const similarity = 1 - distance / Math.max(expected.length, spoken.length);
        
        if (similarity >= 0.7) {
          correctWords += 0.5; // Partial credit for close pronunciations
        }
        
        if (distance > 1) {
          wordErrors.push({ expected, spoken, index: i });
        }
      } else {
        wordErrors.push({ expected, spoken: "(skipped)", index: i });
      }
    }
    
    // Calculate accuracy
    const accuracy = originalWords.length > 0 
      ? Math.round((correctWords / originalWords.length) * 100)
      : 0;
    
    // Calculate words per minute
    const wordsPerMinute = duration > 0 
      ? Math.round((spokenWords.length / duration) * 60)
      : 0;
    
    // Base scores
    let pronunciationScore = Math.min(100, accuracy + 10);
    let fluencyScore = Math.min(100, Math.max(0, 
      wordsPerMinute >= 100 && wordsPerMinute <= 160 ? 90 :
      wordsPerMinute >= 80 && wordsPerMinute <= 180 ? 75 :
      wordsPerMinute >= 60 && wordsPerMinute <= 200 ? 60 : 40
    ));
    let clarityScore = Math.round((accuracy + pronunciationScore) / 2);
    
    // Get AI feedback if available
    let aiFeedback = "";
    if (LOVABLE_API_KEY && spokenText && spokenText.length > 50) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { 
                role: "system", 
                content: "You are a speech coach. Provide brief, constructive feedback (2-3 sentences) on the speaker's reading performance. Focus on actionable improvements." 
              },
              { 
                role: "user", 
                content: `Original text (first 500 chars): ${originalText.substring(0, 500)}...

Spoken transcript (first 500 chars): ${spokenText.substring(0, 500)}...

Stats: Accuracy ${accuracy}%, ${wordsPerMinute} words/min, ${wordErrors.length} errors

Provide brief feedback.` 
              },
            ],
          }),
        });

        if (response.ok) {
          const data = await response.json();
          aiFeedback = data.choices?.[0]?.message?.content || "";
        }
      } catch (e) {
        console.error("AI feedback error:", e);
      }
    }
    
    // Calculate overall score
    const overallScore = Math.round(
      accuracy * 0.4 + 
      pronunciationScore * 0.25 + 
      fluencyScore * 0.2 + 
      clarityScore * 0.15
    );
    
    const result = {
      accuracyPercentage: accuracy,
      pronunciationScore,
      fluencyScore,
      clarityScore,
      overallScore,
      wordsPerMinute,
      totalWords: originalWords.length,
      spokenWords: spokenWords.length,
      wordErrors: wordErrors.slice(0, 20), // Limit to 20 errors for display
      feedback: aiFeedback || getDefaultFeedback(overallScore),
      scrollSpeed,
      duration,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Analyze speech error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getDefaultFeedback(score: number): string {
  if (score >= 90) return "Excellent reading! Your pronunciation and pacing were outstanding.";
  if (score >= 80) return "Great job! Minor improvements in pacing could make it even better.";
  if (score >= 70) return "Good effort. Focus on maintaining a steady pace and clear pronunciation.";
  if (score >= 60) return "Fair performance. Practice reading aloud more frequently to improve fluency.";
  return "Keep practicing! Regular reading practice will significantly improve your skills.";
}
