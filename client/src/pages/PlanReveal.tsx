import { useUserProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Quote, ArrowRight, Dumbbell, Target, Zap, Award, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export default function PlanReveal() {
  const { isLoading: authLoading } = useAuth();
  const { data: profile, isFetching } = useUserProfile();
  const [, setLocation] = useLocation();

  // Show loading state when:
  // - Auth is resolving
  // - Profile query is actively fetching
  // - No profile data yet (cache empty or query hasn't completed)
  if (authLoading || isFetching || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-primary animate-pulse uppercase tracking-wider">Analyzing Your Protocol...</p>
        </div>
      </div>
    );
  }

  // If profile exists but no weekly plan, show fallback
  if (!profile.weeklyPlan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No mission plan found.</p>
          <Button onClick={() => setLocation("/onboarding")}>
            Start Onboarding
          </Button>
        </div>
      </div>
    );
  }

  const plan = profile.weeklyPlan as any;
  const [showScroll, setShowScroll] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const isBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 100;
      setShowScroll(!isBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth"
    });
  };

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center max-w-lg mx-auto py-12 relative">
      {showScroll && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
          onClick={scrollToBottom}
          className="fixed bottom-8 right-8 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-110 transition-transform"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
            className="inline-flex items-center justify-center p-3 rounded-full bg-primary/20 mb-4 ring-1 ring-primary/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </motion.div>
          <h1 className="text-4xl font-display font-bold text-white uppercase tracking-wider">
            Mission Ready
          </h1>
          <p className="text-muted-foreground text-lg">
            Protocol generated for Agent <span className="text-primary font-bold">{profile.displayName}</span>.
          </p>
        </div>

        {/* Customization Context */}
        <div className="flex flex-wrap gap-2 justify-center">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 px-3 py-1">
            <Target className="w-3 h-3 mr-1" /> {profile.fitnessLevel}
          </Badge>
          {profile.goals?.map((g: string) => (
            <Badge key={g} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30 px-3 py-1 capitalize">
              <Zap className="w-3 h-3 mr-1" /> {g}
            </Badge>
          ))}
          <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 px-3 py-1">
            <Dumbbell className="w-3 h-3 mr-1" /> {profile.equipment?.length || 0} Equip
          </Badge>
        </div>

        {/* The Why */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Quote className="w-12 h-12 text-primary" />
          </div>
          <div className="relative z-10">
             <div className="flex items-center gap-2 mb-4">
               <Award className="w-5 h-5 text-primary" />
               <h2 className="text-xl font-display font-bold text-white uppercase tracking-wide">Tactical Analysis</h2>
             </div>
             
             <p className="text-gray-300 leading-relaxed mb-6 font-medium">
               {plan.explanation}
             </p>
             
             <div className="bg-white/5 rounded-xl p-4 border-l-2 border-primary">
               <p className="text-gray-400 italic text-sm">
                 "{plan.motivation}"
               </p>
             </div>
          </div>
        </div>

        {/* Schedule Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-1">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold uppercase tracking-wider text-sm text-muted-foreground">Weekly Operation Cycle</h3>
          </div>
          
          <div className="grid gap-3">
            {plan.schedule?.map((day: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                className="bg-card/50 border border-white/5 p-4 rounded-xl flex justify-between items-center hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-primary/20" />
                  <div>
                    <div className="font-bold text-white text-sm">{day.day}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">{day.focus}</div>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-1 rounded border border-primary/20">
                  {day.duration}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pt-8 pb-8 w-full">
          <Button 
            className="w-full h-14 text-lg font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] transition-all" 
            size="lg"
            onClick={() => setLocation("/")}
          >
            Accept Mission <ArrowRight className="w-5 h-5 ml-2 animate-pulse" />
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            Initiating this protocol will begin your transformation.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
