import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  gradient: string;
  delay?: number;
}

const ModeCard = ({ title, description, icon: Icon, path, gradient, delay = 0 }: ModeCardProps) => {
  return (
    <Link
      to={path}
      className="group relative glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-500 overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Glow */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`}
        style={{ filter: "blur(60px)" }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          <Icon className="w-7 h-7 text-primary" />
        </div>

        <h3 className="font-heading font-semibold text-xl text-foreground mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>

        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>

        <div className="mt-4 flex items-center gap-2 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
          <span>Launch Mode</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default ModeCard;
