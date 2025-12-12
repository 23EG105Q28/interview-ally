import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";
import { TrendingUp, Calendar, Target, BarChart3, PieChart } from "lucide-react";

interface InterviewData {
  created_at: string;
  overall_score: number | null;
  duration_seconds: number;
  question_count: number;
}

interface ReadingData {
  created_at: string;
  overall_score: number | null;
  accuracy_percentage: number | null;
  fluency_score: number | null;
  pronunciation_score: number | null;
  clarity_score: number | null;
}

const PerformanceAnalytics = () => {
  const { user } = useAuth();
  const [interviewData, setInterviewData] = useState<{ date: string; score: number; duration: number; questions: number }[]>([]);
  const [readingData, setReadingData] = useState<{ date: string; score: number; accuracy: number; fluency: number; pronunciation: number; clarity: number }[]>([]);
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
          .select("created_at, overall_score, duration_seconds, question_count")
          .order("created_at", { ascending: true })
          .limit(20),
        supabase
          .from("reading_test_results")
          .select("created_at, overall_score, accuracy_percentage, fluency_score, pronunciation_score, clarity_score")
          .order("created_at", { ascending: true })
          .limit(20),
      ]);

      if (interviewRes.data) {
        setInterviewData(
          interviewRes.data.map((item: InterviewData) => ({
            date: new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: item.overall_score || 0,
            duration: Math.round((item.duration_seconds || 0) / 60),
            questions: item.question_count || 0,
          }))
        );
      }

      if (readingRes.data) {
        setReadingData(
          readingRes.data.map((item: ReadingData) => ({
            date: new Date(item.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            score: item.overall_score || 0,
            accuracy: item.accuracy_percentage || 0,
            fluency: item.fluency_score || 0,
            pronunciation: item.pronunciation_score || 0,
            clarity: item.clarity_score || 0,
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

  // Calculate reading skills average for radar chart
  const getReadingSkillsAverage = () => {
    if (readingData.length === 0) return [];
    const avgAccuracy = Math.round(readingData.reduce((a, b) => a + b.accuracy, 0) / readingData.length);
    const avgFluency = Math.round(readingData.reduce((a, b) => a + b.fluency, 0) / readingData.length);
    const avgPronunciation = Math.round(readingData.reduce((a, b) => a + b.pronunciation, 0) / readingData.length);
    const avgClarity = Math.round(readingData.reduce((a, b) => a + b.clarity, 0) / readingData.length);
    
    return [
      { skill: "Accuracy", value: avgAccuracy, fullMark: 100 },
      { skill: "Fluency", value: avgFluency, fullMark: 100 },
      { skill: "Pronunciation", value: avgPronunciation, fullMark: 100 },
      { skill: "Clarity", value: avgClarity, fullMark: 100 },
    ];
  };

  const interviewTrend = calculateTrend(interviewData);
  const readingTrend = calculateTrend(readingData);
  const radarData = getReadingSkillsAverage();

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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Total Interviews</h4>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">{interviewData.length}</div>
          <p className="text-sm text-muted-foreground">sessions completed</p>
        </div>
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-foreground">Total Reading Tests</h4>
            <PieChart className="w-5 h-5 text-accent" />
          </div>
          <div className="text-2xl font-bold text-foreground">{readingData.length}</div>
          <p className="text-sm text-muted-foreground">tests completed</p>
        </div>
      </div>

      {/* Interview Performance Chart */}
      {interviewData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Interview Performance Over Time
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={interviewData}>
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
                  yAxisId="left"
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  domain={[0, 100]}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))"
                  }}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="score" 
                  name="Score %"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#interviewGradient)" 
                />
                <Bar 
                  yAxisId="right"
                  dataKey="questions" 
                  name="Questions"
                  fill="hsl(var(--accent))" 
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Reading Charts Grid */}
      {readingData.length > 0 && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Reading Score Line Chart */}
          <div className="glass rounded-2xl p-6">
            <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
              Reading Scores Over Time
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={readingData}>
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
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    name="Overall"
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy" 
                    name="Accuracy"
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--accent))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skills Radar Chart */}
          {radarData.length > 0 && (
            <div className="glass rounded-2xl p-6">
              <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                Reading Skills Breakdown
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis 
                      dataKey="skill" 
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    />
                    <Radar
                      name="Average Score"
                      dataKey="value"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))"
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detailed Breakdown Chart */}
      {readingData.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
            Detailed Score Breakdown
          </h3>
          <div className="h-72">
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
                <Legend />
                <Bar dataKey="fluency" name="Fluency" stackId="a" fill="hsl(var(--primary))" />
                <Bar dataKey="pronunciation" name="Pronunciation" stackId="a" fill="hsl(var(--accent))" />
                <Bar dataKey="clarity" name="Clarity" stackId="a" fill="hsl(var(--success))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceAnalytics;
