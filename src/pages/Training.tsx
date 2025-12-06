import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Clock, Trophy, Play, Lock, CheckCircle } from "lucide-react";

interface Module {
  id: number;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  progress: number;
  locked: boolean;
}

const modules: Module[] = [
  {
    id: 1,
    title: "Communication Foundations",
    description: "Master the art of clear, confident communication in interviews.",
    duration: "45 min",
    lessons: 6,
    progress: 100,
    locked: false,
  },
  {
    id: 2,
    title: "STAR Method Mastery",
    description: "Learn to structure behavioral answers for maximum impact.",
    duration: "30 min",
    lessons: 4,
    progress: 75,
    locked: false,
  },
  {
    id: 3,
    title: "Body Language & Presence",
    description: "Project confidence through non-verbal communication.",
    duration: "35 min",
    lessons: 5,
    progress: 0,
    locked: false,
  },
  {
    id: 4,
    title: "Technical Interview Strategies",
    description: "Frameworks for tackling coding and system design questions.",
    duration: "60 min",
    lessons: 8,
    progress: 0,
    locked: true,
  },
  {
    id: 5,
    title: "Salary Negotiation",
    description: "Confidently negotiate your worth and compensation package.",
    duration: "40 min",
    lessons: 5,
    progress: 0,
    locked: true,
  },
];

const stats = [
  { icon: Target, label: "Skill Score", value: "78/100" },
  { icon: Clock, label: "Practice Time", value: "4.5 hrs" },
  { icon: Trophy, label: "Modules Done", value: "1/5" },
  { icon: TrendingUp, label: "Improvement", value: "+23%" },
];

const Training = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              Improvement Training
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Personalized learning paths to strengthen your interview skills with exercises, tips, and progress tracking.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 animate-slide-up" style={{ animationDelay: '100ms' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="glass rounded-xl p-4 text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="font-heading font-bold text-xl text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Skill Gaps */}
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="font-heading font-semibold text-lg text-foreground mb-4">
              Identified Skill Gaps
            </h2>
            <div className="space-y-4">
              {[
                { skill: "Structuring Responses", score: 65, target: 85 },
                { skill: "Technical Depth", score: 55, target: 80 },
                { skill: "Confidence & Delivery", score: 72, target: 90 },
              ].map((gap) => (
                <div key={gap.skill}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-foreground">{gap.skill}</span>
                    <span className="text-muted-foreground">
                      {gap.score}% → {gap.target}% target
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden relative">
                    <div 
                      className="h-full bg-gradient-to-r from-warning to-accent rounded-full"
                      style={{ width: `${gap.score}%` }}
                    />
                    <div 
                      className="absolute top-0 h-full w-0.5 bg-foreground"
                      style={{ left: `${gap.target}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Training Modules */}
          <h2 className="font-heading font-semibold text-xl text-foreground mb-4 animate-slide-up" style={{ animationDelay: '250ms' }}>
            Training Modules
          </h2>
          <div className="space-y-4">
            {modules.map((module, index) => (
              <div 
                key={module.id} 
                className={`glass rounded-xl p-5 flex items-center gap-4 animate-slide-up ${
                  module.locked ? "opacity-60" : ""
                }`}
                style={{ animationDelay: `${(index + 3) * 50}ms` }}
              >
                {/* Progress Indicator */}
                <div className="relative w-14 h-14 flex-shrink-0">
                  <svg className="w-14 h-14 transform -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-secondary"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${(module.progress / 100) * 150.8} 150.8`}
                      className="text-primary"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {module.progress === 100 ? (
                      <CheckCircle className="w-6 h-6 text-success" />
                    ) : module.locked ? (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <span className="text-xs font-medium text-foreground">{module.progress}%</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground mb-1">{module.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {module.duration}
                    </span>
                    <span>{module.lessons} lessons</span>
                  </div>
                </div>

                {/* Action */}
                <Button 
                  variant={module.locked ? "ghost" : module.progress > 0 ? "outline" : "hero"}
                  size="sm"
                  disabled={module.locked}
                >
                  {module.locked ? (
                    <Lock className="w-4 h-4" />
                  ) : module.progress === 100 ? (
                    "Review"
                  ) : module.progress > 0 ? (
                    "Continue"
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Training;
