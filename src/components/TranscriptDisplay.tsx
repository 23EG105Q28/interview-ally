import { MessageSquare, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface TranscriptDisplayProps {
  transcript: string;
  interimTranscript?: string;
  isListening: boolean;
  className?: string;
}

const TranscriptDisplay = ({ 
  transcript, 
  interimTranscript = "", 
  isListening,
  className 
}: TranscriptDisplayProps) => {
  const displayText = transcript + (interimTranscript ? " " + interimTranscript : "");

  return (
    <div className={cn("glass rounded-xl p-4", className)}>
      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-primary" />
        Live Transcript
        {isListening && (
          <span className="flex items-center gap-1 text-xs text-accent">
            <Mic className="w-3 h-3 animate-pulse" />
            Listening
          </span>
        )}
      </h3>
      
      <div className="min-h-[60px] max-h-[120px] overflow-y-auto">
        {displayText ? (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {transcript}
            {interimTranscript && (
              <span className="text-muted-foreground/60 italic">
                {" "}{interimTranscript}
              </span>
            )}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/50 italic">
            {isListening ? "Start speaking..." : "Transcript will appear here"}
          </p>
        )}
      </div>
    </div>
  );
};

export default TranscriptDisplay;
