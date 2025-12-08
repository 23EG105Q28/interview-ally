import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Video, BookOpen, FileText, Calendar, 
  Trophy, TrendingUp, Clock, Eye 
} from "lucide-react";

interface InterviewResult {
  id: string;
  created_at: string;
  interview_type: string;
  duration_seconds: number;
  question_count: number;
  overall_score: number;
  summary: string;
}

interface ReadingResult {
  id: string;
  created_at: string;
  overall_score: number;
  accuracy_percentage: number;
  scroll_speed: string;
  duration_seconds: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();
  const [interviews, setInterviews] = useState<InterviewResult[]>([]);
  const [readingTests, setReadingTests] = useState<ReadingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [allResults, setAllResults] = useState<{ interviews: InterviewResult[]; reading: ReadingResult[] } | null>(null);

  useEffect(() => {
    if (user) {
      fetchResults();
    }
  }, [user, isAdmin]);

  const fetchResults = async () => {
    setIsLoading(true);
    try {
      // Fetch user's own results
      const [interviewRes, readingRes] = await Promise.all([
        supabase
          .from("interview_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("reading_test_results")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      setInterviews(interviewRes.data || []);
      setReadingTests(readingRes.data || []);

      // If admin, fetch all results
      if (isAdmin) {
        const [allInterviews, allReading] = await Promise.all([
          supabase
            .from("interview_results")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
          supabase
            .from("reading_test_results")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        
        setAllResults({
          interviews: allInterviews.data || [],
          reading: allReading.data || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch results:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const avgInterviewScore = interviews.length > 0
    ? Math.round(interviews.reduce((acc, i) => acc + (i.overall_score || 0), 0) / interviews.length)
    : 0;

  const avgReadingScore = readingTests.length > 0
    ? Math.round(readingTests.reduce((acc, r) => acc + (r.overall_score || 0), 0) / readingTests.length)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 animate-slide-up">
            <div>
              <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
                Dashboard
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <User className="w-4 h-4" />
                {user?.email}
                {isAdmin && <Badge variant="default">Admin</Badge>}
              </p>
            </div>
            <Button variant="outline" onClick={signOut} className="mt-4 md:mt-0">
              Sign Out
            </Button>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass rounded-xl p-5 animate-slide-up" style={{ animationDelay: "50ms" }}>
              <Video className="w-5 h-5 text-primary mb-2" />
              <div className="text-2xl font-bold text-foreground">{interviews.length}</div>
              <p className="text-sm text-muted-foreground">Interviews</p>
            </div>
            <div className="glass rounded-xl p-5 animate-slide-up" style={{ animationDelay: "100ms" }}>
              <BookOpen className="w-5 h-5 text-accent mb-2" />
              <div className="text-2xl font-bold text-foreground">{readingTests.length}</div>
              <p className="text-sm text-muted-foreground">Reading Tests</p>
            </div>
            <div className="glass rounded-xl p-5 animate-slide-up" style={{ animationDelay: "150ms" }}>
              <Trophy className="w-5 h-5 text-warning mb-2" />
              <div className={`text-2xl font-bold ${getScoreColor(avgInterviewScore)}`}>{avgInterviewScore}%</div>
              <p className="text-sm text-muted-foreground">Avg Interview Score</p>
            </div>
            <div className="glass rounded-xl p-5 animate-slide-up" style={{ animationDelay: "200ms" }}>
              <TrendingUp className="w-5 h-5 text-success mb-2" />
              <div className={`text-2xl font-bold ${getScoreColor(avgReadingScore)}`}>{avgReadingScore}%</div>
              <p className="text-sm text-muted-foreground">Avg Reading Score</p>
            </div>
          </div>

          {/* Results Tabs */}
          <Tabs defaultValue="interviews" className="animate-slide-up" style={{ animationDelay: "250ms" }}>
            <TabsList className="mb-6">
              <TabsTrigger value="interviews">My Interviews</TabsTrigger>
              <TabsTrigger value="reading">My Reading Tests</TabsTrigger>
              {isAdmin && <TabsTrigger value="admin">All Results (Admin)</TabsTrigger>}
            </TabsList>

            <TabsContent value="interviews">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : interviews.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    No Interviews Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Complete your first AI interview to see results here.
                  </p>
                  <Button variant="hero" onClick={() => navigate("/interview")}>
                    Start Interview
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {interviews.map((interview) => (
                    <div key={interview.id} className="glass rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">{interview.interview_type}</Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(interview.created_at)}
                            </span>
                          </div>
                          <p className="text-foreground/80 text-sm line-clamp-2">
                            {interview.summary || "Interview completed."}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreColor(interview.overall_score || 0)}`}>
                            {interview.overall_score || 0}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(interview.duration_seconds)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="reading">
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading...</div>
              ) : readingTests.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    No Reading Tests Yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Complete your first reading test to see results here.
                  </p>
                  <Button variant="hero" onClick={() => navigate("/reading-test")}>
                    Start Reading Test
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {readingTests.map((test) => (
                    <div key={test.id} className="glass rounded-xl p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline">{test.scroll_speed} speed</Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(test.created_at)}
                            </span>
                          </div>
                          <p className="text-foreground/80 text-sm">
                            Accuracy: {test.accuracy_percentage}%
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getScoreColor(test.overall_score || 0)}`}>
                            {test.overall_score || 0}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center justify-end gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDuration(test.duration_seconds)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {isAdmin && (
              <TabsContent value="admin">
                <div className="glass rounded-2xl p-6 mb-6">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                    All Candidate Results
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">
                        Recent Interviews ({allResults?.interviews.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {allResults?.interviews.map((i) => (
                          <div key={i.id} className="bg-secondary/50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{formatDate(i.created_at)}</span>
                              <span className={getScoreColor(i.overall_score || 0)}>
                                {i.overall_score || 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground mb-3">
                        Recent Reading Tests ({allResults?.reading.length || 0})
                      </h4>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {allResults?.reading.map((r) => (
                          <div key={r.id} className="bg-secondary/50 rounded-lg p-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">{formatDate(r.created_at)}</span>
                              <span className={getScoreColor(r.overall_score || 0)}>
                                {r.overall_score || 0}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
