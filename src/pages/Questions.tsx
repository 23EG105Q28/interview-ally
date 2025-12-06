import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Search, Filter, BookOpen, ChevronDown, ChevronUp, Star } from "lucide-react";

interface Question {
  id: number;
  question: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  sampleAnswer: string;
  tips: string[];
}

const mockQuestions: Question[] = [
  {
    id: 1,
    question: "Tell me about yourself and your background.",
    category: "General",
    difficulty: "Easy",
    sampleAnswer: "I'm a software engineer with 5 years of experience specializing in full-stack development. I started my career at a startup where I learned to wear many hats...",
    tips: ["Keep it under 2 minutes", "Focus on relevant experience", "End with why you're interested in this role"],
  },
  {
    id: 2,
    question: "Describe a challenging project and how you overcame obstacles.",
    category: "Behavioral",
    difficulty: "Medium",
    sampleAnswer: "In my previous role, I led the migration of our monolithic application to microservices. The main challenge was maintaining uptime during the transition...",
    tips: ["Use the STAR method", "Quantify your impact", "Show problem-solving skills"],
  },
  {
    id: 3,
    question: "How would you design a URL shortening service?",
    category: "System Design",
    difficulty: "Hard",
    sampleAnswer: "I would start by clarifying requirements. For a URL shortener, we need to consider: read/write ratio, expected traffic, URL length constraints...",
    tips: ["Clarify requirements first", "Discuss trade-offs", "Consider scalability"],
  },
  {
    id: 4,
    question: "What's your greatest weakness?",
    category: "General",
    difficulty: "Medium",
    sampleAnswer: "I tend to be overly detail-oriented, which sometimes slows me down on projects. I've been working on this by setting strict time limits...",
    tips: ["Be genuine but strategic", "Show self-awareness", "Demonstrate improvement"],
  },
  {
    id: 5,
    question: "Explain the concept of dependency injection.",
    category: "Technical",
    difficulty: "Medium",
    sampleAnswer: "Dependency injection is a design pattern where dependencies are provided to a class rather than created within it. This promotes loose coupling...",
    tips: ["Use simple examples", "Explain benefits", "Mention real-world use cases"],
  },
];

const categories = ["All", "General", "Behavioral", "Technical", "System Design"];
const difficulties = ["All", "Easy", "Medium", "Hard"];

const Questions = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filteredQuestions = mockQuestions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || q.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "All" || q.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "text-success bg-success/10";
      case "Medium": return "text-warning bg-warning/10";
      case "Hard": return "text-destructive bg-destructive/10";
      default: return "text-muted-foreground bg-muted";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12 animate-slide-up">
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
              Question Bank
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Browse thousands of interview questions across industries with sample answers and expert tips.
            </p>
          </div>

          {/* Search & Filters */}
          <div className="glass rounded-2xl p-4 mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-secondary border border-border focus:border-primary focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              {/* Category Filter */}
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:border-primary focus:outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:border-primary focus:outline-none"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {filteredQuestions.map((q, index) => (
              <div 
                key={q.id} 
                className="glass rounded-xl overflow-hidden animate-slide-up"
                style={{ animationDelay: `${(index + 2) * 50}ms` }}
              >
                <button
                  onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
                  className="w-full p-5 text-left flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">{q.category}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground">{q.question}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground">
                      <Star className="w-4 h-4" />
                    </Button>
                    {expandedId === q.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandedId === q.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-border animate-fade-in">
                    <div className="ml-14">
                      <h4 className="font-medium text-foreground mb-2 mt-4">Sample Answer</h4>
                      <p className="text-muted-foreground text-sm mb-4">{q.sampleAnswer}</p>
                      
                      <h4 className="font-medium text-foreground mb-2">Expert Tips</h4>
                      <ul className="space-y-1">
                        {q.tips.map((tip, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                            {tip}
                          </li>
                        ))}
                      </ul>
                      
                      <Button variant="hero" size="sm" className="mt-4">
                        Practice This Question
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredQuestions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No questions found matching your criteria.
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Questions;
