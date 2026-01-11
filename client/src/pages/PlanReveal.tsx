import { useUserProfile } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, Calendar, Quote, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function PlanReveal() {
  const { data: profile } = useUserProfile();
  const [, setLocation] = useLocation();

  if (!profile || !profile.weeklyPlan) return null;

  const plan = profile.weeklyPlan as any;

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center max-w-lg mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-block p-3 rounded-full bg-green-500/20 mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white">
            Program Generated
          </h1>
          <p className="text-muted-foreground">
            Analysis complete. Here is your path to victory, {profile.displayName}.
          </p>
        </div>

        <div className="bg-card border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Quote className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-xl font-display font-bold text-white mb-4">The Strategy</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            {plan.explanation}
          </p>
          <div className="h-px bg-white/10 my-4" />
          <p className="text-gray-300 italic leading-relaxed">
            "{plan.motivation}"
          </p>
          <div className="mt-4 text-sm text-primary font-bold uppercase tracking-wider">
            — AI Coach
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold uppercase tracking-wider">Your Weekly Schedule</h3>
          </div>
          
          <div className="grid gap-3">
            {plan.schedule?.map((day: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 + 0.5 }}
                className="bg-card/50 border border-white/5 p-4 rounded-xl flex justify-between items-center"
              >
                <div>
                  <div className="font-bold text-white">{day.day}</div>
                  <div className="text-sm text-muted-foreground">{day.focus}</div>
                </div>
                <div className="text-xs font-mono bg-white/5 px-2 py-1 rounded">
                  {day.duration}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <Button 
            className="w-full size-lg text-lg font-bold group" 
            onClick={() => setLocation("/")}
          >
            Trust the Process <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-4">
            By clicking above, you commit to executing the plan.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
