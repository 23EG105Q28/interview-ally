import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Send, SkipForward, Clock, User, Upload, FileText, X } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useInterviewChat } from "@/hooks/useInterviewChat";
import VideoPreview from "@/components/VideoPreview";
import AIAvatar from "@/components/AIAvatar";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import LiveMetrics from "@/components/LiveMetrics";
import { useToast } from "@/hooks/use-toast";

// PDF.js type
declare global {
  interface Window {
    pdfjsLib: any;
  }
}

const personalityStyles = [
  { id: "friendly", label: "Friendly HR", description: "Warm and encouraging" },
  { id: "professional", label: "HR Professional", description: "Formal and structured" },
  { id: "strict", label: "Strict Manager", description: "Demanding and direct" },
  { id: "technical", label: "Tech Expert", description: "Deep technical focus" },
  { id: "analytical", label: "Analytical AI", description: "Data-driven approach" },
];

const Interview = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isStarted, setIsStarted] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [interviewTime, setInterviewTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [questionTimeLeft, setQuestionTimeLeft] = useState(90);
  
  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [isLoadingResume, setIsLoadingResume] = useState(false);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load PDF.js
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
    if (!window.pdfjsLib) throw new Error("PDF reader not loaded");
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(" ");
      fullText += pageText + "\n";
    }
    return fullText.trim();
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    if (file.type === "text/plain") return await file.text();
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      return await extractTextFromPDF(arrayBuffer);
    }
    const text = await file.text();
    return text.replace(/[^\x20-\x7E\n\r\t]/g, " ").replace(/\s+/g, " ");
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    setIsLoadingResume(true);
    
    try {
      const text = await extractTextFromFile(file);
      setResumeText(text);
      toast({
        title: "Resume loaded",
        description: "AI will ask questions based on your resume.",
      });
    } catch (err) {
      toast({
        title: "Error reading file",
        description: "Could not read the resume. Try a different format.",
        variant: "destructive",
      });
      setResumeFile(null);
    } finally {
      setIsLoadingResume(false);
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeText("");
  };

  const { 
    stream, 
    videoRef, 
    isVideoEnabled, 
    isAudioEnabled, 
    isInitializing,
    error: mediaError,
    startMedia, 
    stopMedia, 
    toggleVideo, 
    toggleAudio 
  } = useMediaDevices();

  const {
    isListening,
    isSupported: speechSupported,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis({ rate: 1, pitch: 1 });

  const {
    messages,
    currentResponse,
    isLoading,
    error: chatError,
    sendMessage,
    startInterview,
    resetChat,
  } = useInterviewChat({
    personality: selectedStyle,
    resumeText: resumeText || undefined,
    targetRole: targetRole || undefined,
    onResponse: (text) => {
      setCurrentQuestion(text);
      speak(text);
      setQuestionCount(prev => prev + 1);
      setQuestionTimeLeft(90);
    },
  });

  // Question timer
  useEffect(() => {
    if (isStarted && !isLoading && !isSpeaking && questionCount > 0) {
      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev <= 1) {
            handleNextQuestion();
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [isStarted, isLoading, isSpeaking, questionCount]);

  const handleNextQuestion = async () => {
    stopListening();
    stopSpeaking();
    resetTranscript();
    setManualInput("");
    setQuestionTimeLeft(90);
    
    const responseText = transcript.trim() || manualInput.trim() || "I'd like to move to the next question please.";
    await sendMessage(responseText);
  };

  // Timer
  useEffect(() => {
    if (isStarted) {
      timerRef.current = setInterval(() => {
        setInterviewTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInterview = async () => {
    const mediaStream = await startMedia();
    if (!mediaStream) {
      toast({
        title: "Camera/Microphone Required",
        description: mediaError || "Please allow access to your camera and microphone.",
        variant: "destructive",
      });
      return;
    }
    
    setIsStarted(true);
    await startInterview();
    
    if (speechSupported) {
      startListening();
    }
  };

  const handleEndInterview = () => {
    stopMedia();
    stopListening();
    stopSpeaking();
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    
    navigate("/interview-summary", {
      state: {
        messages,
        duration: interviewTime,
        questionCount,
        personality: selectedStyle,
        resumeText,
        targetRole,
      },
    });
    
    resetChat();
    setIsStarted(false);
    setInterviewTime(0);
    setQuestionCount(0);
    setCurrentQuestion("");
    setQuestionTimeLeft(90);
    resetTranscript();
  };

  const handleSendResponse = async () => {
    const responseText = transcript.trim() || manualInput.trim();
    if (!responseText || isLoading) return;
    
    stopListening();
    stopSpeaking();
    
    await sendMessage(responseText);
    
    resetTranscript();
    setManualInput("");
  };

  // Auto-advance
  useEffect(() => {
    if (!isSpeaking && !isLoading && isStarted && speechSupported) {
      setTimeout(() => startListening(), 500);
    }
  }, [isSpeaking, isLoading, isStarted, speechSupported, startListening]);

  // Auto-send after silence
  useEffect(() => {
    if (!isListening || isLoading || isSpeaking) return;
    
    const currentTranscript = transcript.trim();
    if (!currentTranscript) return;
    
    const silenceTimer = setTimeout(() => {
      if (transcript.trim() === currentTranscript && currentTranscript.length > 10) {
        handleSendResponse();
      }
    }, 2500);
    
    return () => clearTimeout(silenceTimer);
  }, [transcript, isListening, isLoading, isSpeaking]);

  // Show errors
  useEffect(() => {
    if (chatError) {
      toast({
        title: "Error",
        description: chatError,
        variant: "destructive",
      });
    }
  }, [chatError, toast]);

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center mb-12 animate-slide-up">
              <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                AI Video Interview
              </h1>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Face a realistic AI interviewer that adapts to your responses. Upload your resume for personalized questions.
              </p>
            </div>

            {/* Resume Upload Section */}
            <div className="glass rounded-2xl p-6 mb-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
              <h2 className="font-heading font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Resume (Optional)
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your resume and the AI will ask questions based on your experience
              </p>
              
              {!resumeFile ? (
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={isLoadingResume}
                  />
                  <div className="border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 text-center transition-colors">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">
                      {isLoadingResume ? "Loading..." : "Click to upload PDF, DOCX, or TXT"}
                    </span>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between bg-secondary/50 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{resumeFile.name}</span>
                  </div>
                  <button onClick={removeResume} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {resumeFile && (
                <div className="mt-4">
                  <label className="block text-sm text-muted-foreground mb-2">Target Role</label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    className="w-full px-4 py-2.5 rounded-lg bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}
            </div>

            {/* Interviewer Style Selection */}
            <div className="glass rounded-2xl p-6 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
              <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
                Select Interviewer Personality
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {personalityStyles.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-4 rounded-xl text-left transition-all duration-200 ${
                      selectedStyle === style.id
                        ? "bg-primary/20 border-2 border-primary"
                        : "bg-secondary/50 border-2 border-transparent hover:border-border"
                    }`}
                  >
                    <div className="font-medium text-foreground">{style.label}</div>
                    <div className="text-sm text-muted-foreground">{style.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Preview */}
            <div className="glass rounded-2xl p-6 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
              <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
                Camera Preview
              </h2>
              <div className="aspect-video bg-secondary rounded-xl flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-secondary/80 mx-auto mb-4 flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Camera will activate when you start</p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    {speechSupported 
                      ? "Speech recognition is supported in your browser" 
                      : "Use the text input to respond (speech not supported)"}
                  </p>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Button 
                variant="hero" 
                size="xl" 
                onClick={handleStartInterview}
                disabled={isInitializing || isLoadingResume}
              >
                {isInitializing ? "Starting..." : "Begin Interview"}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                {resumeFile 
                  ? "Interview will be personalized based on your resume" 
                  : "Ensure your webcam and microphone are working"}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Interview Header */}
      <header className="glass border-b border-border/50 px-4 py-3">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            <span className="text-sm font-medium text-foreground">Interview in Progress</span>
            {resumeText && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">Resume-based</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
              questionTimeLeft <= 15 ? 'bg-destructive/20 text-destructive' : 
              questionTimeLeft <= 30 ? 'bg-warning/20 text-warning' : 
              'bg-secondary text-muted-foreground'
            }`}>
              <Clock className="w-4 h-4" />
              <span className="font-medium">{questionTimeLeft}s</span>
            </div>
            <span className="text-muted-foreground">Duration: {formatTime(interviewTime)}</span>
            <span className="text-border">|</span>
            <span className="text-muted-foreground">Question {questionCount}</span>
          </div>
        </div>
      </header>

      {/* Main Interview Area */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden">
        <div className="container mx-auto h-full max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-6 h-full">
            {/* AI Interviewer */}
            <div className="lg:col-span-2 glass rounded-2xl overflow-hidden relative flex flex-col">
              <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-secondary to-card p-8">
                <AIAvatar 
                  isSpeaking={isSpeaking} 
                  personality={selectedStyle}
                />
              </div>
              
              {/* Current Question */}
              <div className="p-4 bg-card/50 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Current Question</p>
                <p className="text-foreground leading-relaxed">
                  {currentResponse || currentQuestion || "Starting interview..."}
                </p>
              </div>
            </div>

            {/* User Video & Controls */}
            <div className="flex flex-col gap-4 min-h-0">
              {/* User Camera */}
              <VideoPreview
                videoRef={videoRef}
                stream={stream}
                isVideoEnabled={isVideoEnabled}
                label="You"
                className="h-[200px]"
              />

              {/* Live Metrics */}
              <LiveMetrics isActive={isListening} transcript={transcript} />

              {/* Transcript */}
              <TranscriptDisplay
                transcript={transcript}
                interimTranscript={interimTranscript}
                isListening={isListening}
                className="flex-1 min-h-[100px]"
              />

              {/* Manual Input */}
              <div className="glass rounded-xl p-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendResponse()}
                    placeholder={isListening ? "Or type here..." : "Type your response..."}
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-muted-foreground"
                  />
                  <Button 
                    variant="hero" 
                    size="icon" 
                    onClick={handleSendResponse}
                    disabled={isLoading || (!transcript.trim() && !manualInput.trim())}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Controls Bar */}
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
            variant="destructive"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={handleEndInterview}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          <Button
            variant="outline"
            onClick={handleNextQuestion}
            disabled={isLoading || questionCount === 0}
            className="h-12 px-4 rounded-full gap-2"
          >
            <SkipForward className="w-5 h-5" />
            <span className="hidden sm:inline">Next Question</span>
          </Button>

          <Button
            variant={isListening ? "default" : "secondary"}
            size="icon"
            onClick={isListening ? stopListening : startListening}
            className="w-12 h-12 rounded-full"
            disabled={!speechSupported}
          >
            {isListening ? (
              <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Interview;
