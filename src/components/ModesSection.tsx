import { Video, FileText, MessageSquare, BookOpen, TrendingUp } from "lucide-react";
import ModeCard from "./ModeCard";

const modes = [
  {
    title: "AI Video Interview",
    description: "Face a realistic AI interviewer with adaptive difficulty, personality styles, and comprehensive feedback on your performance.",
    icon: Video,
    path: "/interview",
    gradient: "bg-gradient-to-br from-primary/20 to-transparent",
  },
  {
    title: "Resume Scoring",
    description: "Get your resume analyzed for ATS compatibility, keyword optimization, and role-specific improvements with actionable rewrites.",
    icon: FileText,
    path: "/resume",
    gradient: "bg-gradient-to-br from-accent/20 to-transparent",
  },
  {
    title: "Interview Practice",
    description: "Train with a supportive AI coach that generates targeted questions based on your role and provides immediate feedback.",
    icon: MessageSquare,
    path: "/practice",
    gradient: "bg-gradient-to-br from-success/20 to-transparent",
  },
  {
    title: "Question Bank",
    description: "Access thousands of curated interview questions across industries, roles, and difficulty levels with sample answers.",
    icon: BookOpen,
    path: "/questions",
    gradient: "bg-gradient-to-br from-warning/20 to-transparent",
  },
  {
    title: "Improvement Training",
    description: "Personalized learning paths to strengthen your weak areas with exercises, tips, and progress tracking.",
    icon: TrendingUp,
    path: "/training",
    gradient: "bg-gradient-to-br from-primary/20 to-accent/20",
  },
];

const ModesSection = () => {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
            Choose Your{" "}
            <span className="gradient-text">Interview Mode</span>
          </h2>
          <p className="text-muted-foreground">
            Five powerful modes designed to prepare you for every aspect of the interview process.
          </p>
        </div>

        {/* Mode Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {modes.map((mode, index) => (
            <ModeCard
              key={mode.path}
              {...mode}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModesSection;
