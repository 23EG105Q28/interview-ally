import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Upload, FileText, CheckCircle, AlertTriangle, XCircle, Sparkles, Loader2, X } from "lucide-react";
import { useResumeAnalysis } from "@/hooks/useResumeAnalysis";
import { useToast } from "@/hooks/use-toast";

// Declare global type for PDF.js
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const Resume = () => {
  const [file, setFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState("");
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const { toast } = useToast();

  const { isAnalyzing, error, results, analyzeResume, reset } = useResumeAnalysis();

  // Load PDF.js from CDN
  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfJsLoaded(true);
      return;
    }
    
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      setPdfJsLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    if (!window.pdfjsLib) {
      throw new Error("PDF reader not loaded");
    }
    
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n";
    }
    
    return fullText.trim();
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "text/plain") {
      return await file.text();
    }
    
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      return await extractTextFromPDF(arrayBuffer);
    }
    
    // For DOCX and other formats, read as text (best effort)
    const text = await file.text();
    // Clean up any binary garbage for DOCX
    const cleanText = text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ");
    return cleanText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    toast({
      title: "File ready",
      description: `${uploadedFile.name} selected. Click Analyze to continue.`,
    });
  };

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        title: "File required",
        description: "Please upload your resume file first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsReadingFile(true);
    try {
      const resumeContent = await extractTextFromFile(file);
      await analyzeResume(resumeContent, targetRole || undefined);
    } catch (err) {
      toast({
        title: "Error reading file",
        description: "Could not read the file. Try a different format.",
        variant: "destructive",
      });
    } finally {
      setIsReadingFile(false);
    }
  };

  const handleReset = () => {
    reset();
    setFile(null);
    setTargetRole("");
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Analysis Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

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
              AI Resume Scoring
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Get AI-powered analysis of your resume with ATS compatibility check, keyword optimization, and actionable improvements.
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
                    Upload a file or paste your resume text below
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
                      <button onClick={() => setFile(null)} className="text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                      </button>
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
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
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
                  disabled={!file || isAnalyzing || isReadingFile}
                >
                  {isAnalyzing || isReadingFile ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {isReadingFile ? "Reading file..." : "Analyzing..."}
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
                    <div className="font-heading font-bold text-4xl gradient-text">{results.overallScore}</div>
                    <div className="text-sm text-muted-foreground">out of 100</div>
                  </div>
                </div>
                <h2 className="font-heading font-semibold text-xl text-foreground mb-2">
                  Overall Resume Score
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto">
                  {results.summary}
                </p>
              </div>

              {/* Category Scores */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {results.categories.map((category, i) => (
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
              {results.missingKeywords && results.missingKeywords.length > 0 && (
                <div className="glass rounded-2xl p-6 mb-8">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                    Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {results.missingKeywords.map((keyword) => (
                      <span key={keyword} className="px-3 py-1.5 rounded-full bg-warning/10 border border-warning/30 text-warning text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Strengths & Improvements */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {results.strengths && results.strengths.length > 0 && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-success" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {results.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-success mt-2 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {results.improvements && results.improvements.length > 0 && (
                  <div className="glass rounded-2xl p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning" />
                      Areas to Improve
                    </h3>
                    <ul className="space-y-2">
                      {results.improvements.map((improvement, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="glass" size="lg" onClick={handleReset}>
                  Analyze Another Resume
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
