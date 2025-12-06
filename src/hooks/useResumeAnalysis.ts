import { useState, useCallback } from "react";

interface ScoreCategory {
  name: string;
  score: number;
  status: "good" | "warning" | "error";
  feedback: string;
}

interface ResumeAnalysis {
  overallScore: number;
  categories: ScoreCategory[];
  missingKeywords: string[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

export const useResumeAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ResumeAnalysis | null>(null);

  const analyzeResume = useCallback(async (resumeText: string, targetRole?: string) => {
    if (!resumeText.trim()) {
      setError("Please provide resume text");
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          resumeText,
          targetRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Analysis failed: ${response.status}`);
      }

      const analysis = await response.json();
      setResults(analysis);
      return analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to analyze resume";
      setError(errorMessage);
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResults(null);
    setError(null);
  }, []);

  return {
    isAnalyzing,
    error,
    results,
    analyzeResume,
    reset,
  };
};
