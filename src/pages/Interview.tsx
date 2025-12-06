import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Settings, User, MessageSquare, BarChart3 } from "lucide-react";

const personalityStyles = [
  { id: "friendly", label: "Friendly HR", description: "Warm and encouraging" },
  { id: "professional", label: "HR Professional", description: "Formal and structured" },
  { id: "strict", label: "Strict Manager", description: "Demanding and direct" },
  { id: "technical", label: "Tech Expert", description: "Deep technical focus" },
  { id: "analytical", label: "Analytical AI", description: "Data-driven approach" },
];

const Interview = () => {
  const [isStarted, setIsStarted] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [selectedStyle, setSelectedStyle] = useState("professional");

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
                Face a realistic AI interviewer that adapts to your responses. Choose your interviewer style and begin.
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
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center animate-slide-up" style={{ animationDelay: '300ms' }}>
              <Button variant="hero" size="xl" onClick={() => setIsStarted(true)}>
                Begin Interview
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
            <span>Duration: 05:32</span>
            <span className="text-border">|</span>
            <span>Question 3 of ~8</span>
          </div>
        </div>
      </header>

      {/* Main Interview Area */}
      <main className="flex-1 p-4 md:p-6">
        <div className="container mx-auto h-full max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-6 h-full">
            {/* AI Interviewer Video */}
            <div className="lg:col-span-2 glass rounded-2xl overflow-hidden relative">
              <div className="aspect-video bg-gradient-to-br from-secondary to-card flex items-center justify-center">
                {/* AI Avatar Placeholder */}
                <div className="text-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 mx-auto mb-6 flex items-center justify-center animate-pulse-glow">
                    <User className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-foreground font-medium">AI Interviewer</p>
                  <p className="text-sm text-muted-foreground">Speaking...</p>
                </div>
              </div>
              
              {/* Current Question Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background/90 to-transparent">
                <div className="glass rounded-xl p-4">
                  <p className="text-sm text-muted-foreground mb-2">Current Question</p>
                  <p className="text-foreground">
                    "Tell me about a challenging project you've worked on and how you overcame the obstacles you faced."
                  </p>
                </div>
              </div>
            </div>

            {/* User Video & Controls */}
            <div className="flex flex-col gap-4">
              {/* User Camera */}
              <div className="glass rounded-xl overflow-hidden flex-1">
                <div className="h-full bg-secondary flex items-center justify-center min-h-[200px]">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto mb-3 flex items-center justify-center">
                      <User className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Your Camera</p>
                  </div>
                </div>
              </div>

              {/* Real-time Feedback */}
              <div className="glass rounded-xl p-4">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  Live Analysis
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="text-foreground">78%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full w-[78%] bg-gradient-to-r from-primary to-accent rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Clarity</span>
                      <span className="text-foreground">85%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full w-[85%] bg-gradient-to-r from-primary to-accent rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Eye Contact</span>
                      <span className="text-foreground">72%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full w-[72%] bg-gradient-to-r from-primary to-accent rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Transcript */}
              <div className="glass rounded-xl p-4 flex-1 min-h-[150px]">
                <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Live Transcript
                </h3>
                <p className="text-sm text-muted-foreground italic">
                  "In my previous role, I led a team of five developers to migrate our legacy..."
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Controls Bar */}
      <div className="glass border-t border-border/50 p-4">
        <div className="container mx-auto flex items-center justify-center gap-4">
          <Button
            variant={micEnabled ? "secondary" : "destructive"}
            size="icon"
            onClick={() => setMicEnabled(!micEnabled)}
            className="w-12 h-12 rounded-full"
          >
            {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </Button>
          
          <Button
            variant={videoEnabled ? "secondary" : "destructive"}
            size="icon"
            onClick={() => setVideoEnabled(!videoEnabled)}
            className="w-12 h-12 rounded-full"
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="w-14 h-14 rounded-full"
            onClick={() => setIsStarted(false)}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="w-12 h-12 rounded-full"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Interview;
