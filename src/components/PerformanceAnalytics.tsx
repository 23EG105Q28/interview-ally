import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar 
} from "recharts";
import { TrendingUp, Calendar, Target } from "lucide-react";

interface InterviewData {
  created_at: string;
  overall_score: number;
}

interface ReadingData {
  created_at: string;
  overall_score: number;
}

const PerformanceAnalytics = () => {
  const { user } = useAuth();
  const [interviewData, setInterviewData] = useState<{ date: string; score: number }[]>([]);
  const [readingData, setReadingData] = useState<{ date: string; score: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user]);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [interviewRes, readingRes] = await Promise.all([
        supabase
          .from("interview_results")
          .select("created_at, overall_score")
          .order("created_at", { ascending: true })
          .limit(20),
        supabase
          .from("reading_test_results")
          .select("created_at, overall_score")
          .order("created_at", { ascending: true })
          .limit(20),
      ]);

      if (interviewRes.data) {
        setInterviewData(
          interviewRes.data.map((item: InterviewData) => ({
            date: new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: item.overall_score || 0,
          }))
        );
      }

      if (readingRes.data) {
        setReadingData(
          readingRes.data.map((item: ReadingData) => ({
            date: new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: item.overall_score || 0,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTrend = (data: { score: number }[]) => {
    if (data.length < 2) return 0;
    const recent = data.slice(-3);
    const older = data.slice(0, Math.min(3, data.length - 3));
    if (older.length === 0) return 0;
    const recentAvg = recent.reduce((a, b) => a + b.score, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b.score, 0) / older.length;
    return Math.round(recentAvg - olderAvg);
  };

  const interviewTrend = calculateTrend(interviewData);
  const readingTrend = calculateTrend(readingData);

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-8 animate-pulse">
        <div className="h-64 bg-muted/20 rounded-lg" />
      </div>
    );
  }

  if (interviewData.length === 0 && readingData.length === 0) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
          No Data Yet
        </h3>
        <p className="text-muted-foreground">
          Complete interviews and reading tests to see your performance trends.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trend Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Interview Trend</h4>
            <TrendingUp className={`w-5 h-5 ${interviewTrend >= 0 ? "text-success" : "text-destructive"}`} />
          </div>
          <div className={`text-2xl font-bold ${interviewTrend >= 0 ? "text-success" : "text-destructive"}`}>
            {interviewTrend >= 0 ? "+" : ""}{interviewTrend}%
          </div>
          <p className="text-sm text-muted-foreground">vs previous attempts</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Reading Trend</h4>
            <Calendar className={`w-5 h-5 ${readingTrend >= 0 ? "text-success" : "text-destructive"}`} />
          </div>
          <div className={`text-2xl font-bold ${readingTrend >= 0 ? "text-success" : "text-destructive"}`}>
            {readingTrend >= 0 ? "+" : ""}{readingTrend}%
          </div>
          <p className="text-sm text-muted-foreground">vs previous attempts</p>
        </div>
      </div>

      {/* Interview Score Chart */}
      {interviewData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Interview Performance Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={interviewData}>
                <defs>
                  <linearGradient id="interviewGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#interviewGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reading Score Chart */}
      {readingData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Reading Test Scores
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                />
                <Bar 
                  dataKey="score" 
                  fill="hsl(var(--accent))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
