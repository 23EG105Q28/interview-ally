import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Sparkles, Download } from "lucide-react";

interface ScoreCategory {
  name: string;
  score: number;
  status: "good" | "warning" | "error";
  feedback: string;
}

const Resume = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults(true);
    }, 2000);
  };

  const mockScores: ScoreCategory[] = [
    { name: "ATS Compatibility", score: 78, status: "warning", feedback: "Consider using standard section headers" },
    { name: "Keyword Optimization", score: 65, status: "warning", feedback: "Missing 8 key industry terms" },
    { name: "Achievement Focus", score: 85, status: "good", feedback: "Great use of quantified results" },
    { name: "Formatting & Layout", score: 90, status: "good", feedback: "Clean and professional design" },
    { name: "Grammar & Clarity", score: 92, status: "good", feedback: "Excellent writing quality" },
    { name: "Role Relevance", score: 72, status: "warning", feedback: "Could better align with target role" },
  ];

  const overallScore = Math.round(mockScores.reduce((acc, s) => acc + s.score, 0) / mockScores.length);

  const StatusIcon = ({ status }: { status: "good" | "warning" | "error" }) => {
    switch (status) {
      case "good":
        return <CheckCircle className="w-5 h-5 text-success" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      case "error":
        return <XCircle className="w-5 h-5 text-destructive" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              Resume Scoring
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get comprehensive analysis of your resume with ATS compatibility check, keyword optimization, and actionable improvements.
            </p>
          </div>

          {!results ? (
            /* Upload Section */
            <div className="max-w-2xl mx-auto">
              <div 
                className="glass rounded-2xl p-8 border-2 border-dashed border-border hover:border-primary/50 transition-colors animate-slide-up"
                style={{ animationDelay: '100ms' }}
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-2">
                    Upload Your Resume
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Supports PDF, DOCX, and TXT files up to 5MB
                  </p>

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button variant="outline" size="lg" asChild>
                      <span>
                        <FileText className="w-5 h-5 mr-2" />
                        Choose File
                      </span>
                    </Button>
                  </label>

                  {file && (
                    <div className="mt-6 p-4 bg-secondary/50 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <span className="text-foreground">{file.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Target Role Input */}
              <div className="glass rounded-2xl p-6 mt-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Target Role (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Senior Software Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Analyze Button */}
              <div className="text-center mt-8 animate-slide-up" style={{ animationDelay: '300ms' }}>
                <Button 
                  variant="hero" 
                  size="xl" 
                  onClick={handleAnalyze}
                  disabled={!file || isAnalyzing}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze Resume
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Results Section */
            <div className="animate-slide-up">
              {/* Overall Score */}
              <div className="glass rounded-2xl p-8 mb-8 text-center">
                <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4">
                  <div className="text-center">
                    <div className="font-heading font-bold text-4xl gradient-text">{overallScore}</div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </div>
                </div>
                <h2 className="font-heading font-semibold text-xl text-foreground mb-2">
                  Overall Resume Score
                </h2>
                <p className="text-muted-foreground">
                  Your resume shows promise but needs optimization for better ATS performance
                </p>
              </div>

              {/* Category Scores */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {mockScores.map((category, i) => (
                  <div 
                    key={category.name} 
                    className="glass rounded-xl p-5 animate-slide-up"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={category.status} />
                        <h3 className="font-medium text-foreground">{category.name}</h3>
                      </div>
                      <span className="font-heading font-bold text-lg text-foreground">{category.score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden mb-3">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          category.status === 'good' ? 'bg-success' :
                          category.status === 'warning' ? 'bg-warning' : 'bg-destructive'
                        }`}
                        style={{ width: `${category.score}%` }}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">{category.feedback}</p>
                  </div>
                ))}
              </div>

              {/* Missing Keywords */}
              <div className="glass rounded-2xl p-6 mb-8">
                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                  Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {["Agile", "CI/CD", "Microservices", "Cloud Computing", "REST APIs", "Unit Testing", "Docker", "Kubernetes"].map((keyword) => (
                    <span key={keyword} className="px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 text-warning text-sm">
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="hero" size="lg">
                  <Sparkles className="w-5 h-5" />
                  Generate Optimized Version
                </Button>
                <Button variant="outline" size="lg">
                  <Download className="w-5 h-5" />
                  Download Report
                </Button>
                <Button variant="glass" size="lg" onClick={() => {setResults(false); setFile(null);}}>
                  Analyze Another
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Resume;
