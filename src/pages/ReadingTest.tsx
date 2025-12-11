import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VideoPreview from "@/components/VideoPreview";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Play, Pause, RotateCcw, Settings, BookOpen, Mic, MicOff,
  Video, VideoOff, ChevronDown, ChevronUp, Timer, Gauge, AlertTriangle
} from "lucide-react";

type ScrollSpeed = "slow" | "medium" | "fast" | "custom";
type Difficulty = "easy" | "medium" | "hard";

const speedValues: Record<ScrollSpeed, number> = {
  slow: 30,
  medium: 50,
  fast: 80,
  custom: 50,
};

const ReadingTest = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  // States
  const [phase, setPhase] = useState<"setup" | "reading" | "results">("setup");
  const [passage, setPassage] = useState("");
  const [isLoadingPassage, setIsLoadingPassage] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [topic, setTopic] = useState("");
  const [scrollSpeed, setScrollSpeed] = useState<ScrollSpeed>("medium");
  const [customSpeed, setCustomSpeed] = useState(50);
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Results
  const [results, setResults] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceWarning, setFaceWarning] = useState<string | null>(null);
  
  // Refs
  const passageRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const faceCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Media & Speech
  const { stream, videoRef, isVideoEnabled, isAudioEnabled, startMedia, stopMedia, toggleVideo, toggleAudio } = useMediaDevices();
  const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition();

  const currentSpeedValue = scrollSpeed === "custom" ? customSpeed : speedValues[scrollSpeed];

  const generatePassage = async () => {
    setIsLoadingPassage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-passage", {
        body: { difficulty, topic },
      });
      
      if (error) throw error;
      setPassage(data.passage);
    } catch (err) {
      console.error("Failed to generate passage:", err);
      toast({
        title: "Error",
        description: "Failed to generate passage. Using default text.",
        variant: "destructive",
      });
      setPassage(getDefaultPassage());
    } finally {
      setIsLoadingPassage(false);
    }
  };

  const getDefaultPassage = () => `Effective communication is essential in today's professional environment. Whether you are presenting ideas to colleagues, negotiating with clients, or collaborating on projects, your ability to express thoughts clearly can significantly impact your success.

Strong communicators understand their audience and adapt their message accordingly. They use appropriate vocabulary, maintain a confident tone, and organize their thoughts logically. Active listening is equally important, as it demonstrates respect and helps build meaningful connections.

In the workplace, clear communication reduces misunderstandings and improves productivity. Team members who communicate effectively can resolve conflicts more easily and work together more harmoniously. Leaders who master this skill inspire trust and motivate their teams to achieve common goals.

Practice is key to improving communication skills. Regular reading helps expand vocabulary, while public speaking opportunities build confidence. Remember that effective communication is a journey, not a destination. Continue to learn, adapt, and grow in your professional interactions.`;

  const startTest = async () => {
    if (!passage) {
      await generatePassage();
    }
    
    const mediaStream = await startMedia();
    if (!mediaStream) {
      toast({
        title: "Permission Required",
        description: "Please allow camera and microphone access.",
        variant: "destructive",
      });
      return;
    }
    
    resetTranscript();
    setScrollPosition(0);
    setDuration(0);
    setPhase("reading");
    
    // Start speech recognition
    if (isSupported) {
      setTimeout(() => startListening(), 500);
    }
  };

  const toggleScrolling = () => {
    if (isScrolling) {
      pauseScrolling();
    } else {
      resumeScrolling();
    }
  };

  const resumeScrolling = () => {
    setIsScrolling(true);
    
    // Timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    
    // Scrolling
    scrollIntervalRef.current = setInterval(() => {
      setScrollPosition(prev => {
        const maxScroll = passageRef.current 
          ? passageRef.current.scrollHeight - passageRef.current.clientHeight 
          : 1000;
        
        if (prev >= maxScroll) {
          finishTest();
          return prev;
        }
        
        return prev + (currentSpeedValue / 60);
      });
    }, 16);
  };

  const pauseScrolling = () => {
    setIsScrolling(false);
    if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const finishTest = async () => {
    pauseScrolling();
    stopListening();
    stopMedia();
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("analyze-speech", {
        body: {
          originalText: passage,
          spokenText: transcript,
          duration,
          scrollSpeed,
        },
      });
      
      if (error) throw error;
      setResults(data);
      
      // Save results if logged in
      if (user) {
        await supabase.from("reading_test_results").insert({
          user_id: user.id,
          passage_text: passage,
          spoken_transcript: transcript,
          accuracy_percentage: data.accuracyPercentage,
          pronunciation_score: data.pronunciationScore,
          fluency_score: data.fluencyScore,
          clarity_score: data.clarityScore,
          overall_score: data.overallScore,
          word_errors: data.wordErrors,
          scroll_speed: scrollSpeed,
          duration_seconds: duration,
        });
      }
      
      setPhase("results");
    } catch (err) {
      console.error("Analysis error:", err);
      toast({
        title: "Analysis Error",
        description: "Failed to analyze speech. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetTest = () => {
    pauseScrolling();
    stopListening();
    stopMedia();
    resetTranscript();
    setScrollPosition(0);
    setDuration(0);
    setResults(null);
    setPhase("setup");
  };

  useEffect(() => {
    if (passageRef.current) {
      passageRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) clearInterval(scrollIntervalRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, []);

  // Face visibility check
  const checkFaceVisibility = useCallback(() => {
    if (!videoRef.current || !stream) return;
    
    const video = videoRef.current;
    if (video.readyState !== 4) return;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let darkPixels = 0;
    let totalPixels = data.length / 4;
    let totalBrightness = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      if (brightness < 30) darkPixels++;
    }

    const avgBrightness = totalBrightness / totalPixels;
    const darkPercentage = (darkPixels / totalPixels) * 100;

    if (darkPercentage > 85 || avgBrightness < 20) {
      setFaceWarning("Your face is not visible. Please check your camera and lighting.");
    } else if (avgBrightness < 40) {
      setFaceWarning("Low lighting detected. Please improve your lighting for better results.");
    } else {
      setFaceWarning(null);
    }
  }, [stream, videoRef]);

  // Start face detection when in reading phase
  useEffect(() => {
    if (phase === "reading" && stream) {
      faceCheckIntervalRef.current = setInterval(checkFaceVisibility, 2000);
      return () => {
        if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
      };
    }
  }, [phase, stream, checkFaceVisibility]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  // Setup Phase
  if (phase === "setup") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-8 animate-slide-up">
              <Badge className="mb-4" variant="outline">Speech Reading Test</Badge>
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                Scrolling Speech Reading Test
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Read aloud as text scrolls. Get scored on accuracy, pronunciation, fluency, and clarity.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Settings */}
              <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "100ms" }}>
                <h2 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Test Settings
                </h2>
                
                <div className="space-y-5">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Difficulty Level</label>
                    <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy (~150 words)</SelectItem>
                        <SelectItem value="medium">Medium (~250 words)</SelectItem>
                        <SelectItem value="hard">Hard (~400 words)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Topic (optional)</label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g., technology, leadership..."
                      className="w-full bg-secondary/50 border border-border rounded-lg px-4 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Scroll Speed</label>
                    <Select value={scrollSpeed} onValueChange={(v) => setScrollSpeed(v as ScrollSpeed)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="slow">Slow</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="fast">Fast</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {scrollSpeed === "custom" && (
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">
                        Custom Speed: {customSpeed}%
                      </label>
                      <Slider
                        value={[customSpeed]}
                        onValueChange={([v]) => setCustomSpeed(v)}
                        min={10}
                        max={100}
                        step={5}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Passage Preview */}
              <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
                <h2 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />
                  Passage Preview
                </h2>
                
                <div className="bg-secondary/30 rounded-xl p-4 h-48 overflow-y-auto text-sm text-foreground/80 leading-relaxed">
                  {passage || (
                    <p className="text-muted-foreground italic">
                      Click "Generate Passage" to create a new reading passage based on your settings.
                    </p>
                  )}
                </div>

                <Button
                  onClick={generatePassage}
                  variant="outline"
                  className="w-full mt-4"
                  disabled={isLoadingPassage}
                >
                  {isLoadingPassage ? "Generating..." : "Generate New Passage"}
                </Button>
              </div>
            </div>

            <div className="text-center mt-8 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <Button variant="hero" size="xl" onClick={startTest} disabled={isLoadingPassage}>
                Start Reading Test
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Camera and microphone required
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Reading Phase
  if (phase === "reading") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="glass border-b border-border/50 px-4 py-3">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${isScrolling ? "bg-destructive/20" : "bg-secondary"}`}>
                <div className={`w-2 h-2 rounded-full ${isScrolling ? "bg-destructive animate-pulse" : "bg-muted-foreground"}`} />
                <span className="text-sm font-medium">{isScrolling ? "Recording" : "Paused"}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="w-4 h-4" />
                {formatTime(duration)}
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Gauge className="w-4 h-4" />
                {scrollSpeed}
              </div>
            </div>

            <Button variant="destructive" size="sm" onClick={finishTest}>
              End Test
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-hidden">
          <div className="container mx-auto h-full max-w-7xl">
            <div className="grid lg:grid-cols-3 gap-6 h-full">
              {/* Scrolling Passage */}
              <div className="lg:col-span-2 glass rounded-2xl overflow-hidden flex flex-col">
                <div 
                  ref={passageRef}
                  className="flex-1 p-8 overflow-hidden text-xl md:text-2xl leading-relaxed text-foreground"
                  style={{ scrollBehavior: "auto" }}
                >
                  {passage}
                </div>
                
                {/* Scroll Progress */}
                <div className="h-1 bg-secondary">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ 
                      width: `${passageRef.current 
                        ? (scrollPosition / (passageRef.current.scrollHeight - passageRef.current.clientHeight)) * 100 
                        : 0}%` 
                    }}
                  />
                </div>
              </div>

              {/* Video & Transcript */}
              <div className="flex flex-col gap-4 min-h-0">
                <div className="relative">
                  <VideoPreview
                    videoRef={videoRef}
                    stream={stream}
                    isVideoEnabled={isVideoEnabled}
                    label="You"
                    className="h-[180px]"
                  />
                  {faceWarning && (
                    <div className="absolute inset-x-0 bottom-0 bg-destructive/90 text-destructive-foreground px-3 py-2 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{faceWarning}</span>
                    </div>
                  )}
                </div>

                {/* Live Transcript */}
                <div className="glass rounded-xl p-4 flex-1 min-h-[150px] overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className={`w-4 h-4 ${isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                    <span className="text-sm text-muted-foreground">Your Speech</span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {transcript || "Start speaking..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Controls */}
        <div className="glass border-t border-border/50 p-4">
          <div className="container mx-auto flex items-center justify-center gap-4">
            <Button
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="icon"
              onClick={toggleAudio}
              className="w-12 h-12 rounded-full"
            >
              {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="icon"
              onClick={toggleVideo}
              className="w-12 h-12 rounded-full"
            >
              {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </Button>

            <Button
              variant="hero"
              size="icon"
              onClick={toggleScrolling}
              className="w-14 h-14 rounded-full"
            >
              {isScrolling ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={resetTest}
              className="w-12 h-12 rounded-full"
            >
              <RotateCcw className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results Phase
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
                Analyzing Your Performance
              </h2>
              <p className="text-muted-foreground">
                Comparing your speech with the original text...
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
          <div className="text-center mb-8 animate-slide-up">
            <Badge className="mb-4" variant="default">Test Complete</Badge>
            <h1 className="font-heading font-bold text-3xl text-foreground mb-2">
              Your Results
            </h1>
          </div>

          {/* Overall Score */}
          <div className="glass rounded-2xl p-8 mb-6 text-center animate-slide-up">
            <div className={`text-7xl font-heading font-bold ${getScoreColor(results?.overallScore || 0)}`}>
              {results?.overallScore || 0}
            </div>
            <p className="text-muted-foreground mt-2">Overall Score</p>
          </div>

          {/* Detailed Scores */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Accuracy", value: results?.accuracyPercentage },
              { label: "Pronunciation", value: results?.pronunciationScore },
              { label: "Fluency", value: results?.fluencyScore },
              { label: "Clarity", value: results?.clarityScore },
            ].map((item, i) => (
              <div key={item.label} className="glass rounded-xl p-4 text-center animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`text-3xl font-bold ${getScoreColor(item.value || 0)}`}>
                  {item.value || 0}%
                </div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-semibold text-foreground">{results?.wordsPerMinute || 0}</div>
                <p className="text-sm text-muted-foreground">Words/Min</p>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{results?.spokenWords || 0}/{results?.totalWords || 0}</div>
                <p className="text-sm text-muted-foreground">Words Read</p>
              </div>
              <div>
                <div className="text-2xl font-semibold text-foreground">{formatTime(duration)}</div>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </div>
          </div>

          {/* Feedback */}
          {results?.feedback && (
            <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: "300ms" }}>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-3">AI Feedback</h3>
              <p className="text-foreground/90 leading-relaxed">{results.feedback}</p>
            </div>
          )}

          {/* Word Errors */}
          {results?.wordErrors?.length > 0 && (
            <div className="glass rounded-2xl p-6 mb-8 animate-slide-up" style={{ animationDelay: "400ms" }}>
              <h3 className="font-heading font-semibold text-lg text-foreground mb-3">Word Errors</h3>
              <div className="flex flex-wrap gap-2">
                {results.wordErrors.map((error: any, i: number) => (
                  <div key={i} className="bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-1.5 text-sm">
                    <span className="text-destructive line-through">{error.expected}</span>
                    <span className="text-muted-foreground mx-1">→</span>
                    <span className="text-foreground">{error.spoken}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-4 animate-slide-up" style={{ animationDelay: "500ms" }}>
            <Button variant="outline" onClick={resetTest}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="hero" onClick={() => navigate("/")}>
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReadingTest;
