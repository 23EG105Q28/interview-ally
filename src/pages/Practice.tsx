import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Lightbulb, Target, RotateCcw, Loader2 } from "lucide-react";
import { usePracticeFeedback } from "@/hooks/usePracticeFeedback";
import { useToast } from "@/hooks/use-toast";

const suggestedTopics = [
  { icon: Target, label: "Behavioral Questions", description: "STAR method practice" },
  { icon: Lightbulb, label: "Technical Interview", description: "Coding & system design" },
  { icon: Bot, label: "Leadership Skills", description: "Management scenarios" },
];

const Practice = () => {
  const [input, setInput] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const { toast } = useToast();

  const {
    messages,
    currentResponse,
    isLoading,
    error,
    sendMessage,
    resetChat,
  } = usePracticeFeedback({ topic: selectedTopic || undefined });

  // Show initial greeting
  const displayMessages = messages.length === 0 && !selectedTopic 
    ? [{ role: "assistant" as const, content: "Hello! I'm your interview practice coach. I'll help you prepare for your upcoming interviews with targeted questions and real-time feedback. What type of interview would you like to practice today?" }]
    : messages;

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput("");
  };

  const handleTopicSelect = async (topic: string) => {
    setSelectedTopic(topic);
    await sendMessage(`I want to practice ${topic}. Please give me a practice question.`);
  };

  const handleReset = () => {
    resetChat();
    setSelectedTopic(null);
    setInput("");
  };

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-4 flex flex-col">
        <div className="container mx-auto px-4 max-w-4xl flex-1 flex flex-col">
          {/* Topic Selection */}
          {!selectedTopic && messages.length === 0 && (
            <div className="grid sm:grid-cols-3 gap-4 mb-6 mt-4 animate-slide-up">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleTopicSelect(topic.label)}
                  disabled={isLoading}
                  className="glass rounded-xl p-4 text-left hover:border-primary/50 transition-all duration-200 group disabled:opacity-50"
                >
                  <topic.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-medium text-foreground">{topic.label}</h3>
                  <p className="text-sm text-muted-foreground">{topic.description}</p>
                </button>
              ))}
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {displayMessages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 animate-slide-up ${
                  message.role === "user" ? "flex-row-reverse" : ""
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  message.role === "assistant" 
                    ? "bg-gradient-to-br from-primary to-accent" 
                    : "bg-secondary"
                }`}>
                  {message.role === "assistant" ? (
                    <Bot className="w-5 h-5 text-primary-foreground" />
                  ) : (
                    <User className="w-5 h-5 text-foreground" />
                  )}
                </div>
                <div className={`max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                  <div className={`rounded-2xl px-4 py-3 ${
                    message.role === "assistant" 
                      ? "glass" 
                      : "bg-primary text-primary-foreground"
                  }`}>
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Streaming response */}
            {currentResponse && (
              <div className="flex gap-3 animate-slide-up">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary to-accent">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="max-w-[80%]">
                  <div className="glass rounded-2xl px-4 py-3">
                    <p className="whitespace-pre-line">{currentResponse}</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Loading indicator */}
            {isLoading && !currentResponse && (
              <div className="flex gap-3 animate-slide-up">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-primary to-accent">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="glass rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="glass rounded-2xl p-4 mt-4">
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="flex-shrink-0"
                onClick={handleReset}
                disabled={isLoading}
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your response..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
              <Button 
                variant="hero" 
                size="icon" 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Practice;
