import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, User, Send } from "lucide-react";
import { useMediaDevices } from "@/hooks/useMediaDevices";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useInterviewChat } from "@/hooks/useInterviewChat";
import VideoPreview from "@/components/VideoPreview";
import AIAvatar from "@/components/AIAvatar";
import TranscriptDisplay from "@/components/TranscriptDisplay";
import LiveMetrics from "@/components/LiveMetrics";
import { useToast } from "@/hooks/use-toast";

const personalityStyles = [
  { id: "friendly", label: "Friendly HR", description: "Warm and encouraging" },
  { id: "professional", label: "HR Professional", description: "Formal and structured" },
  { id: "strict", label: "Strict Manager", description: "Demanding and direct" },
  { id: "technical", label: "Tech Expert", description: "Deep technical focus" },
  { id: "analytical", label: "Analytical AI", description: "Data-driven approach" },
];

const Interview = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState("professional");
  const [interviewTime, setInterviewTime] = useState(0);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [manualInput, setManualInput] = useState("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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
    onResponse: (text) => {
      setCurrentQuestion(text);
      speak(text);
      setQuestionCount(prev => prev + 1);
    },
  });

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
    resetChat();
    setIsStarted(false);
    setInterviewTime(0);
    setQuestionCount(0);
    setCurrentQuestion("");
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

  // Auto-advance: When AI finishes speaking and user has a response, or restart listening
  useEffect(() => {
    if (!isSpeaking && !isLoading && isStarted && speechSupported) {
      // AI finished speaking, start listening for user response
      setTimeout(() => startListening(), 500);
    }
  }, [isSpeaking, isLoading, isStarted, speechSupported, startListening]);

  // Auto-send response after user stops speaking (silence detection)
  useEffect(() => {
    if (!isListening || isLoading || isSpeaking) return;
    
    const currentTranscript = transcript.trim();
    if (!currentTranscript) return;
    
    // Wait for 2 seconds of silence before auto-sending
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
                Face a realistic AI interviewer that adapts to your responses. Your camera and microphone will be used for the interview.
              </p>
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
                disabled={isInitializing}
              >
                {isInitializing ? "Starting..." : "Begin Interview"}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Ensure your webcam and microphone are working
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
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Duration: {formatTime(interviewTime)}</span>
            <span className="text-border">|</span>
            <span>Question {questionCount}</span>
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

              {/* Manual Input (fallback) */}
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
