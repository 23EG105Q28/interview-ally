import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";

interface LiveMetricsProps {
  isActive: boolean;
  transcript: string;
}

interface Metric {
  label: string;
  value: number;
  color: string;
}

const LiveMetrics = ({ isActive, transcript }: LiveMetricsProps) => {
  const [metrics, setMetrics] = useState<Metric[]>([
    { label: "Confidence", value: 75, color: "from-primary to-accent" },
    { label: "Clarity", value: 80, color: "from-primary to-accent" },
    { label: "Pace", value: 70, color: "from-primary to-accent" },
  ]);

  // Simulate dynamic metric updates based on speaking
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.min(100, Math.max(50, metric.value + (Math.random() - 0.5) * 10)),
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  // Analyze transcript for filler words
  useEffect(() => {
    if (!transcript) return;
    
    const fillerWords = ["um", "uh", "like", "you know", "basically", "actually"];
    const words = transcript.toLowerCase().split(/\s+/);
    const fillerCount = words.filter(word => fillerWords.includes(word)).length;
    const totalWords = words.length;
    
    // Adjust confidence based on filler word ratio
    if (totalWords > 5) {
      const fillerRatio = fillerCount / totalWords;
      const confidenceAdjustment = Math.max(60, 100 - (fillerRatio * 200));
      
      setMetrics(prev => prev.map(m => 
        m.label === "Confidence" ? { ...m, value: confidenceAdjustment } : m
      ));
    }
  }, [transcript]);

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-primary" />
        Live Analysis
      </h3>
      
      <div className="space-y-3">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className="text-foreground font-medium">{Math.round(metric.value)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div 
                className={`h-full bg-gradient-to-r ${metric.color} rounded-full transition-all duration-500`}
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      {isActive && (
        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
          Tip: Speak clearly and avoid filler words
        </p>
      )}
    </div>
  );
};

export default LiveMetrics;
