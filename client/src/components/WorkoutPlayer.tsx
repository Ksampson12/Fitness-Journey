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

  const steps = workout?.steps || [];
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
                <span className="font-display font-bold tracking-wide">{workout?.name || "Workout"}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
              <div className="w-full max-w-xs aspect-square bg-card rounded-2xl border border-white/5 mb-8 flex items-center justify-center relative overflow-hidden group">
                 {/* Placeholder for exercise animation/image */}
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-50 group-hover:opacity-100 transition-opacity" />
                 <Dumbbell className="w-24 h-24 text-muted-foreground/20" />
                 
                 <div className="absolute bottom-4 left-0 right-0 text-center">
                   <span className="text-6xl font-mono font-bold text-foreground tabular-nums">
                     {formatTime(timer)}
                   </span>
                 </div>
              </div>

              <div className="w-full space-y-2 text-center">
                <h3 className="text-2xl font-display text-primary">{currentStep?.name || "Exercise Name"}</h3>
                <p className="text-muted-foreground">{currentStep?.description || "Description of the movement"}</p>
                <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-1 rounded-full border border-secondary/20 mt-2">
                  <span className="text-sm font-bold text-secondary uppercase">{currentStep?.reps || "12"} Reps</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="p-6 border-t border-white/5 bg-card/50 backdrop-blur-sm">
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Timer className="w-5 h-5 animate-pulse text-primary" /> : <Play className="w-5 h-5 ml-1" />}
                </Button>
                <Button 
                  className="flex-1 text-lg font-display tracking-widest" 
                  onClick={handleNext}
                >
                  {stepIndex === steps.length - 1 ? "Finish" : "Next Exercise"}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
