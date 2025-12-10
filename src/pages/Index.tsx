import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ModesSection from "@/components/ModesSection";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        
        {/* Analytics Section - Only show for logged in users */}
        {user && (
          <section className="py-16 relative">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-4">
                  Your <span className="gradient-text">Performance</span>
                </h2>
                <p className="text-muted-foreground">
                  Track your interview and reading test performance over time.
                </p>
              </div>
              <PerformanceAnalytics />
            </div>
          </section>
        )}
        
        <ModesSection />
      </main>
    </div>
  );
};

export default Index;
