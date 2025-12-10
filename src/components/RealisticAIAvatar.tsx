import { cn } from "@/lib/utils";
import { Volume2 } from "lucide-react";

interface RealisticAIAvatarProps {
  isSpeaking: boolean;
  personality?: string;
  className?: string;
}

const personalityData: Record<string, { name: string; color: string; gradientClass: string }> = {
  friendly: { name: "Sarah", color: "from-green-400 to-emerald-500", gradientClass: "from-green-500/30 to-emerald-500/30" },
  professional: { name: "James", color: "from-primary to-accent", gradientClass: "from-primary/30 to-accent/30" },
  strict: { name: "Victoria", color: "from-red-400 to-orange-500", gradientClass: "from-red-500/30 to-orange-500/30" },
  technical: { name: "Michael", color: "from-blue-400 to-cyan-500", gradientClass: "from-blue-500/30 to-cyan-500/30" },
  analytical: { name: "Dr. Chen", color: "from-purple-400 to-pink-500", gradientClass: "from-purple-500/30 to-pink-500/30" },
};

const RealisticAIAvatar = ({ isSpeaking, personality = "professional", className }: RealisticAIAvatarProps) => {
  const data = personalityData[personality] || personalityData.professional;

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      {/* Animated glow rings when speaking */}
      {isSpeaking && (
        <>
          <div className={cn(
            "absolute w-48 h-48 rounded-full opacity-20 animate-ping",
            `bg-gradient-to-br ${data.gradientClass}`
          )} />
          <div className={cn(
            "absolute w-44 h-44 rounded-full opacity-30 animate-pulse",
            `bg-gradient-to-br ${data.gradientClass}`
          )} />
          <div className={cn(
            "absolute w-40 h-40 rounded-full opacity-20",
            `bg-gradient-to-br ${data.gradientClass}`,
            "animate-[pulse_1.5s_ease-in-out_infinite]"
          )} />
        </>
      )}
      
      {/* Main avatar container */}
      <div className={cn(
        "relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300",
        "bg-gradient-to-br shadow-2xl",
        data.color,
        isSpeaking && "scale-105 shadow-primary/40"
      )}>
        {/* Inner face circle */}
        <div className="w-32 h-32 rounded-full bg-gradient-to-b from-[#fce7d6] to-[#e8c4a8] flex items-center justify-center relative overflow-hidden shadow-inner">
          {/* Hair */}
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#3d2314] via-[#4a2c1a] to-transparent rounded-t-full" />
          
          {/* Face features container */}
          <div className="relative mt-4 flex flex-col items-center">
            {/* Eyes */}
            <div className="flex gap-6 mb-3">
              <div className="relative">
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-inner flex items-center justify-center",
                  isSpeaking && "animate-[blink_3s_ease-in-out_infinite]"
                )}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2d1b0e]">
                    <div className="w-1 h-1 rounded-full bg-white/60 ml-0.5 mt-0.5" />
                  </div>
                </div>
                {/* Eyebrow */}
                <div className="absolute -top-2 left-0 right-0 h-1 bg-[#3d2314] rounded-full" />
              </div>
              <div className="relative">
                <div className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-inner flex items-center justify-center",
                  isSpeaking && "animate-[blink_3s_ease-in-out_infinite]"
                )}>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2d1b0e]">
                    <div className="w-1 h-1 rounded-full bg-white/60 ml-0.5 mt-0.5" />
                  </div>
                </div>
                {/* Eyebrow */}
                <div className="absolute -top-2 left-0 right-0 h-1 bg-[#3d2314] rounded-full" />
              </div>
            </div>
            
            {/* Nose */}
            <div className="w-2 h-3 bg-gradient-to-b from-[#e8c4a8] to-[#d4a988] rounded-full mb-2" />
            
            {/* Mouth */}
            <div className={cn(
              "w-8 h-3 rounded-full transition-all duration-200 flex items-center justify-center overflow-hidden",
              isSpeaking 
                ? "bg-[#c26a6a] animate-[speak_0.3s_ease-in-out_infinite]" 
                : "bg-[#d4847a] h-2"
            )}>
              {isSpeaking && (
                <div className="w-6 h-1.5 bg-[#8b3a3a] rounded-full mt-0.5" />
              )}
            </div>
          </div>
        </div>
        
        {/* Speaking indicator */}
        {isSpeaking && (
          <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-accent flex items-center justify-center animate-bounce shadow-lg">
            <Volume2 className="w-4 h-4 text-accent-foreground" />
          </div>
        )}
      </div>
      
      {/* Status text */}
      <div className="mt-5 text-center">
        <p className="text-foreground font-semibold text-lg">{data.name}</p>
        <p className="text-sm text-muted-foreground capitalize">
          {isSpeaking ? "Speaking..." : `${personality} interviewer`}
        </p>
      </div>
      
      {/* Audio visualizer bars when speaking */}
      {isSpeaking && (
        <div className="flex items-end justify-center gap-1 mt-4 h-8">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1.5 rounded-full bg-gradient-to-t",
                data.color
              )}
              style={{
                height: `${12 + Math.random() * 20}px`,
                animation: `pulse ${0.4 + Math.random() * 0.3}s ease-in-out infinite`,
                animationDelay: `${i * 50}ms`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default RealisticAIAvatar;
