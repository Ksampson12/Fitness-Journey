import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, Timer, Dumbbell, X } from "lucide-react";
import { useCompleteNode } from "@/hooks/use-game";

type WorkoutPlayerProps = {
  workoutId: number;
  workout: any; // JSON structure
  isOpen: boolean;
  onClose: () => void;
};

export function WorkoutPlayer({ workoutId, workout, isOpen, onClose }: WorkoutPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  const completeMutation = useCompleteNode();

  const steps = workout?.exercises || workout?.steps || [];
  const currentStep = steps[stepIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => setTimer((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    setIsPlaying(false);
    setCompleted(true);
    try {
      await completeMutation.mutateAsync({
        workoutId,
        metrics: {
          durationSeconds: timer,
          calories: Math.floor(timer * 0.15), // Mock calculation
          difficultyRating: 3,
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md w-full h-[90vh] sm:h-auto p-0 border-none bg-background overflow-hidden flex flex-col">
        {completed ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
             <motion.div
               initial={{ scale: 0 }}
               animate={{ scale: 1 }}
               className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center neon-border"
             >
               <CheckCircle className="w-12 h-12 text-primary" />
             </motion.div>
             
             <div>
               <h2 className="text-3xl font-display text-primary mb-2">Victory!</h2>
               <p className="text-muted-foreground">Workout completed successfully.</p>
             </div>

             <div className="grid grid-cols-2 gap-4 w-full">
               <div className="bg-card p-4 rounded-xl border border-white/5">
                 <div className="text-xs text-muted-foreground uppercase">Duration</div>
                 <div className="text-xl font-mono font-bold">{formatTime(timer)}</div>
               </div>
               <div className="bg-card p-4 rounded-xl border border-white/5">
                 <div className="text-xs text-muted-foreground uppercase">XP Earned</div>
                 <div className="text-xl font-mono font-bold text-accent">+150</div>
               </div>
             </div>

             <Button onClick={onClose} size="lg" className="w-full">Return to Map</Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-card/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                   <Dumbbell className="w-4 h-4 text-primary" />
                </div>
                <span className="font-display font-bold tracking-wide text-white">{workout?.title || "Workout"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-muted-foreground hover:text-white">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full flex flex-col items-center"
                >
                  <div className="w-full max-w-xs aspect-square bg-card/30 rounded-3xl border border-white/5 mb-8 flex flex-col items-center justify-center relative overflow-hidden group">
                     {/* Placeholder for exercise animation/image */}
                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                     
                     <Dumbbell className="w-16 h-16 text-muted-foreground/20 mb-4" />
                     
                     <span className="text-6xl font-mono font-bold text-white tabular-nums z-10 tracking-wider">
                       {formatTime(timer)}
                     </span>
                  </div>

                  <div className="w-full space-y-2 text-center">
                    <h3 className="text-2xl font-display font-bold text-primary uppercase tracking-wider">{currentStep?.name || "Exercise Name"}</h3>
                    <p className="text-muted-foreground text-sm font-medium">{currentStep?.notes || currentStep?.description || "Description of the movement"}</p>
                    
                    <div className="inline-flex items-center justify-center bg-blue-500/20 px-6 py-2 rounded-full border border-blue-500/30 mt-4 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                      <span className="text-sm font-bold text-blue-400 uppercase tracking-wide">
                        {currentStep?.reps ? `${currentStep.reps} Reps` : currentStep?.duration ? currentStep.duration : "12 Reps"}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-white/5 bg-card/50 backdrop-blur-sm">
              <div className="flex gap-4 items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-14 w-14 shrink-0 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary transition-colors"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <Timer className="w-6 h-6 animate-pulse text-primary" />
                  ) : (
                    <Play className="w-6 h-6 ml-1 text-white" />
                  )}
                </Button>
                
                <motion.div className="flex-1" whileTap={{ scale: 0.95 }}>
                  <Button 
                    className="w-full h-14 text-lg font-display font-bold uppercase tracking-widest rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]" 
                    onClick={handleNext}
                  >
                    {stepIndex === steps.length - 1 ? "Finish" : "Next Exercise"}
                  </Button>
                </motion.div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
