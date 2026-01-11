import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Play, CheckCircle, Timer, Dumbbell, X, Check, Sparkles } from "lucide-react";
import { useCompleteNode } from "@/hooks/use-game";

type WorkoutPlayerProps = {
  workoutId: number;
  workout: any; // JSON structure
  isOpen: boolean;
  onClose: () => void;
};

export function WorkoutPlayer({ workoutId, workout, isOpen, onClose }: WorkoutPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true); // Auto-start timer
  const [totalTimer, setTotalTimer] = useState(0); // Total workout time
  const [exerciseTimer, setExerciseTimer] = useState(0); // Per-exercise countdown/countup
  const [completed, setCompleted] = useState(false);
  const [completedSets, setCompletedSets] = useState(0); // Sets completed for current exercise
  const [allSetsComplete, setAllSetsComplete] = useState(false); // Celebration state
  
  const completeMutation = useCompleteNode();

  const steps = workout?.exercises || workout?.steps || [];
  const currentStep = steps[stepIndex];
  
  // Check if this is a set-based exercise
  const totalSets = typeof currentStep?.sets === 'number' ? currentStep.sets : 0;
  const isSetBasedExercise = totalSets > 0;

  // Parse duration string to seconds (e.g., "8-10 minutes" -> 480, "30 seconds" -> 30)
  const parseDuration = (duration: string | undefined): number | null => {
    if (!duration) return null;
    const lower = duration.toLowerCase();
    
    // Match patterns like "8-10 minutes", "30 seconds", "2 minutes", "20-30 seconds"
    const minuteMatch = lower.match(/(\d+)(?:–|-)?(\d+)?\s*min/);
    const secondMatch = lower.match(/(\d+)(?:–|-)?(\d+)?\s*sec/);
    
    if (minuteMatch) {
      // Use the first number (minimum) for countdown
      return parseInt(minuteMatch[1]) * 60;
    }
    if (secondMatch) {
      return parseInt(secondMatch[1]);
    }
    return null;
  };

  const exerciseDuration = parseDuration(currentStep?.duration);
  const isTimedExercise = exerciseDuration !== null && exerciseDuration > 0;

  // Reset exercise timer and sets when moving to a new step
  useEffect(() => {
    if (isTimedExercise) {
      setExerciseTimer(exerciseDuration);
    } else {
      setExerciseTimer(0);
    }
    // Reset set tracking for new exercise
    setCompletedSets(0);
    setAllSetsComplete(false);
  }, [stepIndex, isTimedExercise, exerciseDuration]);

  // Handle completing a set
  const handleCompleteSet = () => {
    if (completedSets < totalSets) {
      const newCompleted = completedSets + 1;
      setCompletedSets(newCompleted);
      
      // Check if all sets are now complete
      if (newCompleted === totalSets) {
        setAllSetsComplete(true);
      }
    }
  };

  // Main timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTotalTimer((t) => t + 1);
        
        if (isTimedExercise) {
          // Countdown for timed exercises
          setExerciseTimer((t) => Math.max(0, t - 1));
        } else {
          // Count up for rep-based exercises
          setExerciseTimer((t) => t + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isTimedExercise]);

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
          durationSeconds: totalTimer,
          calories: Math.floor(totalTimer * 0.15), // Mock calculation
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
                 <div className="text-xl font-mono font-bold">{formatTime(totalTimer)}</div>
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
                <div className="flex flex-col">
                  <span className="font-display font-bold tracking-wide text-white text-sm">{workout?.title || "Workout"}</span>
                  <span className="text-xs text-muted-foreground font-mono">Total: {formatTime(totalTimer)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{stepIndex + 1}/{steps.length}</span>
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full text-muted-foreground hover:text-white">
                  <X className="w-4 h-4" />
                </Button>
              </div>
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
                  <div className={`w-full max-w-xs aspect-square rounded-3xl border mb-8 flex flex-col items-center justify-center relative overflow-hidden group transition-colors duration-300 ${
                    isTimedExercise && exerciseTimer <= 10 && exerciseTimer > 0 
                      ? 'bg-red-500/20 border-red-500/30' 
                      : isTimedExercise && exerciseTimer === 0 
                        ? 'bg-green-500/20 border-green-500/30'
                        : allSetsComplete
                          ? 'bg-green-500/20 border-green-500/30'
                          : 'bg-card/30 border-white/5'
                  }`}>
                     <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                     
                     {/* Celebration animation when all sets complete */}
                     <AnimatePresence>
                       {allSetsComplete && (
                         <motion.div
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: 1, scale: 1 }}
                           exit={{ opacity: 0 }}
                           className="absolute inset-0 flex items-center justify-center z-20"
                         >
                           <motion.div
                             animate={{ rotate: 360 }}
                             transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                             className="absolute"
                           >
                             <Sparkles className="w-32 h-32 text-yellow-400/30" />
                           </motion.div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                     
                     {isTimedExercise ? (
                       <>
                         <Timer className={`w-16 h-16 mb-4 ${exerciseTimer <= 10 && exerciseTimer > 0 ? 'text-red-400 animate-pulse' : exerciseTimer === 0 ? 'text-green-400' : 'text-muted-foreground/20'}`} />
                         <span className={`text-6xl font-mono font-bold tabular-nums z-10 tracking-wider transition-colors ${
                           exerciseTimer <= 10 && exerciseTimer > 0 
                             ? 'text-red-400' 
                             : exerciseTimer === 0 
                               ? 'text-green-400'
                               : 'text-white'
                         }`}>
                           {formatTime(exerciseTimer)}
                         </span>
                         <span className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">
                           {exerciseTimer === 0 ? 'Complete!' : 'Countdown'}
                         </span>
                       </>
                     ) : isSetBasedExercise ? (
                       <>
                         {/* Set tracker circles */}
                         <div className="flex gap-3 mb-6 z-10">
                           {Array.from({ length: totalSets }).map((_, i) => (
                             <motion.button
                               key={i}
                               onClick={i === completedSets ? handleCompleteSet : undefined}
                               disabled={i !== completedSets}
                               className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all ${
                                 i < completedSets 
                                   ? 'bg-primary border-primary text-primary-foreground' 
                                   : i === completedSets 
                                     ? 'border-primary bg-primary/20 cursor-pointer hover:bg-primary/30' 
                                     : 'border-white/20 bg-white/5'
                               }`}
                               whileTap={i === completedSets ? { scale: 0.9 } : {}}
                               initial={false}
                               animate={i < completedSets ? { scale: [1, 1.2, 1] } : {}}
                               transition={{ duration: 0.3 }}
                               data-testid={`set-button-${i}`}
                             >
                               {i < completedSets ? (
                                 <Check className="w-6 h-6" />
                               ) : (
                                 <span className="text-sm font-bold">{i + 1}</span>
                               )}
                             </motion.button>
                           ))}
                         </div>
                         
                         {/* Set progress text */}
                         <div className="text-center z-10">
                           {allSetsComplete ? (
                             <motion.div
                               initial={{ scale: 0 }}
                               animate={{ scale: 1 }}
                               className="text-green-400"
                             >
                               <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                               <span className="text-xl font-bold uppercase">All Sets Done!</span>
                             </motion.div>
                           ) : (
                             <>
                               <span className="text-4xl font-mono font-bold text-white">
                                 {completedSets} / {totalSets}
                               </span>
                               <p className="text-xs text-muted-foreground mt-1 uppercase">
                                 Tap to complete set {completedSets + 1}
                               </p>
                             </>
                           )}
                         </div>
                         
                         {/* Timer still running in background */}
                         <span className="text-xs text-muted-foreground mt-4 font-mono z-10">
                           {formatTime(exerciseTimer)}
                         </span>
                       </>
                     ) : (
                       <>
                         <Dumbbell className="w-16 h-16 text-muted-foreground/20 mb-4" />
                         <span className="text-6xl font-mono font-bold text-white tabular-nums z-10 tracking-wider">
                           {formatTime(exerciseTimer)}
                         </span>
                       </>
                     )}
                  </div>

                  <div className="w-full space-y-2 text-center">
                    <h3 className="text-2xl font-display font-bold text-primary uppercase tracking-wider">{currentStep?.name || "Exercise Name"}</h3>
                    <p className="text-muted-foreground text-sm font-medium">{currentStep?.notes || currentStep?.description || "Description of the movement"}</p>
                    
                    <div className="inline-flex items-center justify-center gap-2 bg-blue-500/20 px-6 py-2 rounded-full border border-blue-500/30 mt-4 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                      <span className="text-sm font-bold text-blue-400 uppercase tracking-wide">
                        {isSetBasedExercise && currentStep?.reps 
                          ? `${currentStep.sets} Sets x ${currentStep.reps}` 
                          : currentStep?.reps 
                            ? `${currentStep.reps} Reps` 
                            : currentStep?.duration 
                              ? currentStep.duration 
                              : "Complete exercise"}
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
