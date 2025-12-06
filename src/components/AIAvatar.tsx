import { Bot, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAvatarProps {
  isSpeaking: boolean;
  personality?: string;
  className?: string;
}

const personalityColors: Record<string, string> = {
  friendly: "from-green-500/30 to-emerald-500/30",
  professional: "from-primary/30 to-accent/30",
  strict: "from-red-500/30 to-orange-500/30",
  technical: "from-blue-500/30 to-cyan-500/30",
  analytical: "from-purple-500/30 to-pink-500/30",
};

const AIAvatar = ({ isSpeaking, personality = "professional", className }: AIAvatarProps) => {
  const gradientClass = personalityColors[personality] || personalityColors.professional;

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      {/* Animated rings when speaking */}
      {isSpeaking && (
        <>
          <div className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${gradientClass} animate-ping opacity-20`} />
          <div className={`absolute w-36 h-36 rounded-full bg-gradient-to-br ${gradientClass} animate-pulse opacity-30`} />
        </>
      )}
      
      {/* Main avatar */}
      <div className={cn(
        "relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
        "bg-gradient-to-br",
        gradientClass,
        isSpeaking && "scale-105"
      )}>
        <div className="w-28 h-28 rounded-full bg-card flex items-center justify-center">
          <Bot className={cn(
            "w-14 h-14 text-primary transition-transform duration-300",
            isSpeaking && "animate-pulse"
          )} />
        </div>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center animate-bounce">
            <Volume2 className="w-4 h-4 text-accent-foreground" />
          </div>
        )}
      </div>
      
      {/* Status text */}
      <div className="mt-4 text-center">
        <p className="text-foreground font-medium">AI Interviewer</p>
        <p className="text-sm text-muted-foreground capitalize">
          {isSpeaking ? "Speaking..." : personality + " mode"}
        </p>
      </div>
      
      {/* Audio visualizer bars when speaking */}
      {isSpeaking && (
        <div className="flex items-end justify-center gap-1 mt-3 h-6">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-primary rounded-full animate-pulse"
              style={{
                height: `${Math.random() * 16 + 8}px`,
                animationDelay: `${i * 100}ms`,
                animationDuration: `${300 + Math.random() * 200}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AIAvatar;
