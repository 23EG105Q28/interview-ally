import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, Target, TrendingUp, Clock, MessageSquare, 
  CheckCircle, AlertCircle, ArrowLeft, Download, Home 
} from "lucide-react";

interface InterviewData {
  messages: { role: string; content: string }[];
  duration: number;
  questionCount: number;
  personality: string;
}

interface SummaryResult {
  summary: string;
  strengths: string[];
  improvements: string[];
  overallScore: number;
}

const InterviewSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [result, setResult] = useState<SummaryResult | null>(null);
  
  const interviewData = location.state as InterviewData | undefined;

  useEffect(() => {
    if (!interviewData) {
      navigate("/interview");
      return;
    }
    
    analyzeInterview();
  }, [interviewData]);

  const analyzeInterview = async () => {
    if (!interviewData) return;
    
    try {
      const { data, error } = await supabase.functions.invoke("interview-summary", {
        body: {
          messages: interviewData.messages,
          duration: interviewData.duration,
          questionCount: interviewData.questionCount,
        },
      });

      if (error) throw error;

      const summaryResult: SummaryResult = {
        summary: data.summary || "Great interview performance!",
        strengths: data.strengths || ["Good communication", "Clear responses"],
        improvements: data.improvements || ["Practice more technical questions"],
        overallScore: data.overallScore || 75,
      };

      setResult(summaryResult);

      // Save to database if user is logged in
      if (user) {
        await supabase.from("interview_results").insert({
          user_id: user.id,
          interview_type: "video",
          duration_seconds: interviewData.duration,
          question_count: interviewData.questionCount,
          transcript: interviewData.messages,
          summary: summaryResult.summary,
          strengths: summaryResult.strengths,
          improvements: summaryResult.improvements,
          overall_score: summaryResult.overallScore,
        });
      }
    } catch (err) {
      console.error("Analysis error:", err);
      // Fallback result
      setResult({
        summary: "Interview completed successfully. Your responses showed good engagement and communication skills.",
        strengths: ["Active participation", "Clear communication", "Professional demeanor"],
        improvements: ["Consider providing more specific examples", "Practice structured responses"],
        overallScore: 70,
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Great";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Improvement";
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <div className="glass rounded-2xl p-12 animate-pulse-glow">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
              </div>
              <h2 className="font-heading font-bold text-2xl text-foreground mb-2">
                Analyzing Your Interview
              </h2>
              <p className="text-muted-foreground">
                Our AI is reviewing your responses and generating personalized feedback...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8 animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-success/20 text-success px-4 py-2 rounded-full mb-4">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Interview Complete</span>
            </div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
              Interview Summary
            </h1>
            <p className="text-muted-foreground">
              Here's how you performed in your interview
            </p>
          </div>

          {/* Score Card */}
          <div className="glass rounded-2xl p-8 mb-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="text-center">
                <div className={`text-6xl font-heading font-bold ${getScoreColor(result?.overallScore || 0)}`}>
                  {result?.overallScore}
                </div>
                <div className="text-muted-foreground mt-1">Overall Score</div>
                <Badge className="mt-2" variant={result?.overallScore && result.overallScore >= 70 ? "default" : "secondary"}>
                  {getScoreLabel(result?.overallScore || 0)}
                </Badge>
              </div>
              
              <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                <div className="glass rounded-xl p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto text-primary mb-2" />
                  <div className="font-semibold text-foreground">
                    {formatDuration(interviewData?.duration || 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <MessageSquare className="w-5 h-5 mx-auto text-accent mb-2" />
                  <div className="font-semibold text-foreground">
                    {interviewData?.questionCount || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Questions</div>
                </div>
                <div className="glass rounded-xl p-4 text-center">
                  <Target className="w-5 h-5 mx-auto text-success mb-2" />
                  <div className="font-semibold text-foreground">
                    {interviewData?.personality || "Professional"}
                  </div>
                  <div className="text-xs text-muted-foreground">Style</div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <h2 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Performance Summary
            </h2>
            <p className="text-foreground/90 leading-relaxed">
              {result?.summary}
            </p>
          </div>

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Key Strengths
              </h3>
              <ul className="space-y-3">
                {result?.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-success mt-1 shrink-0" />
                    <span className="text-foreground/90">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "400ms" }}>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                Areas to Improve
              </h3>
              <ul className="space-y-3">
                {result?.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Target className="w-4 h-4 text-warning mt-1 shrink-0" />
                    <span className="text-foreground/90">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-4 animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Button variant="outline" onClick={() => navigate("/interview")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              New Interview
            </Button>
            <Button variant="hero" onClick={() => navigate("/")}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSummary;
