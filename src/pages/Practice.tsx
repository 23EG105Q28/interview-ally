import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Lightbulb, Target, RotateCcw } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  feedback?: string;
}

const suggestedTopics = [
  { icon: Target, label: "Behavioral Questions", description: "STAR method practice" },
  { icon: Lightbulb, label: "Technical Interview", description: "Coding & system design" },
  { icon: Bot, label: "Leadership Skills", description: "Management scenarios" },
];

const Practice = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hello! I'm your interview practice coach. I'll help you prepare for your upcoming interviews with targeted questions and real-time feedback. What type of interview would you like to practice today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: messages.length + 2,
        role: "assistant",
        content: "That's a great response! You demonstrated clear problem-solving skills. Here's my feedback:",
        feedback: "✓ Good structure using the STAR method\n✓ Specific example with measurable outcome\n⚡ Consider adding more detail about your personal contribution\n⚡ Try to quantify the impact more precisely",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    }, 1500);
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    const message: Message = {
      id: messages.length + 1,
      role: "assistant",
      content: `Great choice! Let's practice ${topic}. Here's your first question:\n\n"Tell me about a time when you had to deal with a difficult team member. How did you handle the situation and what was the outcome?"`,
    };
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 pt-20 pb-4 flex flex-col">
        <div className="container mx-auto px-4 max-w-4xl flex-1 flex flex-col">
          {/* Topic Selection */}
          {!selectedTopic && messages.length === 1 && (
            <div className="grid sm:grid-cols-3 gap-4 mb-6 mt-4 animate-slide-up">
              {suggestedTopics.map((topic) => (
                <button
                  key={topic.label}
                  onClick={() => handleTopicSelect(topic.label)}
                  className="glass rounded-xl p-4 text-left hover:border-primary/50 transition-all duration-200 group"
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
            {messages.map((message, index) => (
              <div
                key={message.id}
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
                  
                  {message.feedback && (
                    <div className="glass rounded-xl p-4 mt-3 border-l-4 border-accent">
                      <h4 className="text-sm font-medium text-accent mb-2">Coach Feedback</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{message.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="glass rounded-2xl p-4 mt-4">
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="flex-shrink-0">
                <RotateCcw className="w-5 h-5" />
              </Button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your response..."
                className="flex-1 bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
              />
              <Button 
                variant="hero" 
                size="icon" 
                onClick={handleSend}
                disabled={!input.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Practice;
