import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Timer, Dumbbell, X, ArrowRight, Sparkles, RotateCcw, Moon, Heart } from "lucide-react";
import { useCompleteNode } from "@/hooks/use-game";

type WorkoutPlayerProps = {
  workoutId: number;
  workout: any;
  isOpen: boolean;
  onClose: () => void;
};

type WorkoutProgress = {
  workoutId: number;
  stepIndex: number;
  completedSets: number;
  totalTimer: number;
  exerciseTimer: number;
  timestamp: number;
};

const PROGRESS_STORAGE_KEY = 'fitness-workout-progress';

function saveProgress(progress: WorkoutProgress) {
  try {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch (e) {
    console.error('Failed to save workout progress', e);
  }
}

function loadProgress(): WorkoutProgress | null {
  try {
    const data = localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (data) {
      const progress = JSON.parse(data) as WorkoutProgress;
      const hoursSinceLastActive = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
      if (hoursSinceLastActive < 24) {
        return progress;
      }
      clearProgress();
    }
  } catch (e) {
    console.error('Failed to load workout progress', e);
  }
  return null;
}

function clearProgress() {
  try {
    localStorage.removeItem(PROGRESS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear workout progress', e);
  }
}

export function WorkoutPlayer({ workoutId, workout, isOpen, onClose }: WorkoutPlayerProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [totalTimer, setTotalTimer] = useState(0);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedSets, setCompletedSets] = useState(0);
  const [allSetsComplete, setAllSetsComplete] = useState(false);
  const [hasRestoredProgress, setHasRestoredProgress] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const savedProgressRef = useRef<WorkoutProgress | null>(null);
  const skipNextResetRef = useRef(false);
  const lastStepIndexRef = useRef<number | null>(null);
  
  const completeMutation = useCompleteNode();

  const steps = workout?.exercises || workout?.steps || [];
  const currentStep = steps[stepIndex];
  
  const totalSets = typeof currentStep?.sets === 'number' ? currentStep.sets : 0;
  const isSetBasedExercise = totalSets > 0;

  const parseDuration = useCallback((duration: string | undefined): number | null => {
    if (!duration) return null;
    const lower = duration.toLowerCase();
    const minuteMatch = lower.match(/(\d+)(?:–|-)?(\d+)?\s*min/);
    const secondMatch = lower.match(/(\d+)(?:–|-)?(\d+)?\s*sec/);
    if (minuteMatch) return parseInt(minuteMatch[1]) * 60;
    if (secondMatch) return parseInt(secondMatch[1]);
    return null;
  }, []);

  const exerciseDuration = parseDuration(currentStep?.duration);
  const isTimedExercise = exerciseDuration !== null && exerciseDuration > 0;
  const isTimedWithSets = isTimedExercise && isSetBasedExercise;

  // Check for saved progress on open
  useEffect(() => {
    if (isOpen && !hasRestoredProgress) {
      const savedProgress = loadProgress();
      if (savedProgress && savedProgress.workoutId === workoutId) {
        savedProgressRef.current = savedProgress;
        setShowResumePrompt(true);
      }
      setHasRestoredProgress(true);
    }
  }, [isOpen, workoutId, hasRestoredProgress]);

  const handleResumeWorkout = () => {
    const progress = savedProgressRef.current;
    if (progress) {
      skipNextResetRef.current = true;
      lastStepIndexRef.current = progress.stepIndex;
      setStepIndex(progress.stepIndex);
      setCompletedSets(progress.completedSets);
      setTotalTimer(progress.totalTimer);
      setExerciseTimer(progress.exerciseTimer);
      if (progress.completedSets >= (steps[progress.stepIndex]?.sets || 0) && (steps[progress.stepIndex]?.sets || 0) > 0) {
        setAllSetsComplete(true);
      }
    }
    setShowResumePrompt(false);
  };

  const handleStartFresh = () => {
    clearProgress();
    savedProgressRef.current = null;
    setShowResumePrompt(false);
  };

  // Reset exercise state when moving to a new step (only if not restoring)
  useEffect(() => {
    // Skip reset if we just restored progress
    if (skipNextResetRef.current && stepIndex === lastStepIndexRef.current) {
      skipNextResetRef.current = false;
      return;
    }
    
    if (!showResumePrompt) {
      if (isTimedExercise) {
        setExerciseTimer(exerciseDuration);
      } else {
        setExerciseTimer(0);
      }
      setCompletedSets(0);
      setAllSetsComplete(false);
    }
  }, [stepIndex, isTimedExercise, exerciseDuration, showResumePrompt]);

  // Handle completing a set (for rep-based exercises)
  const handleCompleteSet = useCallback(() => {
    if (completedSets < totalSets) {
      const newCompleted = completedSets + 1;
      setCompletedSets(newCompleted);
      
      // For timed exercises with sets, reset the timer for the next set
      if (isTimedWithSets && exerciseDuration && newCompleted < totalSets) {
        setExerciseTimer(exerciseDuration);
      }
      
      if (newCompleted === totalSets) {
        setAllSetsComplete(true);
      }
    }
  }, [completedSets, totalSets, isTimedWithSets, exerciseDuration]);

  // Auto-complete set when timer reaches 0 for timed exercises with sets
  useEffect(() => {
    if (isTimedWithSets && exerciseTimer === 0 && completedSets < totalSets && !allSetsComplete) {
      const timer = setTimeout(() => {
        handleCompleteSet();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [exerciseTimer, isTimedWithSets, completedSets, totalSets, allSetsComplete, handleCompleteSet]);

  // Main timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !showResumePrompt) {
      interval = setInterval(() => {
        setTotalTimer((t) => t + 1);
        if (isTimedExercise) {
          setExerciseTimer((t) => Math.max(0, t - 1));
        } else {
          setExerciseTimer((t) => t + 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isTimedExercise, showResumePrompt]);

  // Save progress periodically and on close
  useEffect(() => {
    if (isOpen && !completed && !showResumePrompt && stepIndex > 0 || completedSets > 0 || totalTimer > 30) {
      const progress: WorkoutProgress = {
        workoutId,
        stepIndex,
        completedSets,
        totalTimer,
        exerciseTimer,
        timestamp: Date.now(),
      };
      saveProgress(progress);
    }
  }, [isOpen, completed, workoutId, stepIndex, completedSets, totalTimer, exerciseTimer, showResumePrompt]);

  const handleClose = () => {
    if (!completed) {
      const progress: WorkoutProgress = {
        workoutId,
        stepIndex,
        completedSets,
        totalTimer,
        exerciseTimer,
        timestamp: Date.now(),
      };
      saveProgress(progress);
    }
    // Reset state flags so resume check runs on next open
    setHasRestoredProgress(false);
    skipNextResetRef.current = false;
    lastStepIndexRef.current = null;
    onClose();
  };

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
    clearProgress();
    // Reset state flags
    setHasRestoredProgress(false);
    skipNextResetRef.current = false;
    lastStepIndexRef.current = null;
    try {
      await completeMutation.mutateAsync({
        workoutId,
        metrics: {
          durationSeconds: totalTimer,
          calories: Math.floor(totalTimer * 0.15),
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md w-full h-[90vh] sm:h-auto p-0 border-none bg-background overflow-hidden flex flex-col">
        {/* Resume Prompt */}
        {showResumePrompt ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <RotateCcw className="w-10 h-10 text-primary" />
            </motion.div>
            
            <div>
              <h2 className="text-2xl font-display text-white mb-2">Resume Workout?</h2>
              <p className="text-muted-foreground text-sm">
                You have an unfinished workout. Would you like to continue where you left off?
              </p>
              {savedProgressRef.current && (
                <p className="text-xs text-muted-foreground mt-2">
                  Exercise {savedProgressRef.current.stepIndex + 1}/{steps.length} - {formatTime(savedProgressRef.current.totalTimer)} elapsed
                </p>
              )}
            </div>

            <div className="w-full space-y-3">
              <Button 
                onClick={handleResumeWorkout} 
                size="lg" 
                className="w-full"
                data-testid="button-resume-workout"
              >
                Resume Workout
              </Button>
              <Button 
                onClick={handleStartFresh} 
                variant="outline" 
                size="lg" 
                className="w-full"
                data-testid="button-start-fresh"
              >
                Start Fresh
              </Button>
            </div>
          </div>
        ) : completed ? (
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

             <Button onClick={handleClose} size="lg" className="w-full" data-testid="button-return-map">Return to Map</Button>
          </div>
        ) : workout?.isRestDay ? (
          /* REST DAY SPECIAL UI */
          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center"
            >
              <Moon className="w-12 h-12 text-purple-400" />
            </motion.div>
            
            <div>
              <h2 className="text-2xl font-display text-purple-400 mb-2 uppercase tracking-wide">{workout?.title || "Rest Day"}</h2>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                {workout?.restMessage || "Your body recovers and grows stronger during rest. Take it easy today!"}
              </p>
            </div>

            <div className="flex items-center gap-2 text-purple-400/70">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">Recovery Mode Active</span>
            </div>

            {workout?.notes && (
              <div className="bg-card/50 rounded-xl p-4 border border-white/5 max-w-sm">
                <p className="text-sm text-muted-foreground">{workout.notes}</p>
              </div>
            )}

            <Button 
              onClick={handleFinish} 
              size="lg" 
              className="w-full max-w-xs"
              disabled={completeMutation.isPending}
              data-testid="button-complete-rest-day"
            >
              {completeMutation.isPending ? "Completing..." : "Complete Rest Day"}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleClose} 
              className="text-muted-foreground"
              data-testid="button-close-rest-day"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
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
                  <span className="font-display font-bold tracking-wide text-white text-sm truncate max-w-[180px]">{workout?.title || "Workout"}</span>
                  <span className="text-xs text-muted-foreground font-mono">Total: {formatTime(totalTimer)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{stepIndex + 1}/{steps.length}</span>
                <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 rounded-full text-muted-foreground hover:text-white" data-testid="button-close-workout">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 py-2 bg-card/30">
              <div className="flex items-center justify-between mb-1">
                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden mr-4">
                  <motion.div 
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((stepIndex) / steps.length) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <span className="text-xs font-mono text-muted-foreground">{formatTime(exerciseTimer)}</span>
              </div>
            </div>

            {/* Main Content - Exercise Card */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
                  {/* Exercise Card */}
                  <div className={`w-full rounded-2xl border p-6 transition-colors duration-300 relative ${
                    allSetsComplete || (isTimedExercise && !isSetBasedExercise && exerciseTimer === 0)
                      ? 'bg-primary/5 border-primary/30'
                      : 'bg-card/50 border-white/10'
                  }`}>
                    
                    {/* Celebration sparkles */}
                    <AnimatePresence>
                      {allSetsComplete && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 pointer-events-none flex items-center justify-center"
                        >
                          <Sparkles className="w-16 h-16 text-yellow-400/40 animate-pulse" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Icon placeholder */}
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                        <Dumbbell className="w-10 h-10 text-primary/60" />
                      </div>
                    </div>

                    {/* Exercise Name */}
                    <h3 className="text-xl font-display font-bold text-white text-center uppercase tracking-wider mb-4">
                      {currentStep?.name || "Exercise"}
                    </h3>

                    {/* Set Buttons Row - for set-based exercises */}
                    {isSetBasedExercise && (
                      <div className="flex justify-center gap-2 mb-4 flex-wrap">
                        {Array.from({ length: totalSets }).map((_, i) => (
                          <button
                            key={i}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                              i < completedSets 
                                ? 'bg-primary text-primary-foreground' 
                                : i === completedSets 
                                  ? 'bg-primary/20 text-primary border border-primary' 
                                  : 'bg-white/5 text-muted-foreground border border-white/10'
                            }`}
                            data-testid={`set-indicator-${i}`}
                          >
                            Set {i + 1}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Counter Display */}
                    <div className="text-center mb-2">
                      {isTimedExercise ? (
                        <span className={`text-5xl font-mono font-bold ${
                          exerciseTimer <= 10 && exerciseTimer > 0 
                            ? 'text-red-400' 
                            : exerciseTimer === 0 
                              ? 'text-primary'
                              : 'text-white'
                        }`}>
                          {formatTime(exerciseTimer)}
                        </span>
                      ) : isSetBasedExercise ? (
                        <span className="text-5xl font-mono font-bold text-white">
                          {completedSets} / {totalSets}
                        </span>
                      ) : (
                        <span className="text-5xl font-mono font-bold text-white">
                          {formatTime(exerciseTimer)}
                        </span>
                      )}
                    </div>

                    {/* Set progress for set-based (non-timed) exercises */}
                    {isSetBasedExercise && !isTimedExercise && (
                      <p className="text-center text-muted-foreground text-sm font-mono mb-4">
                        {formatTime(exerciseTimer)}
                      </p>
                    )}

                    {/* Set progress text for timed exercises with sets */}
                    {isTimedWithSets && (
                      <p className="text-center text-muted-foreground text-sm mb-2">
                        Set {Math.min(completedSets + 1, totalSets)} of {totalSets}
                      </p>
                    )}

                    {/* Complete Set Button - only for non-timed set-based exercises */}
                    {isSetBasedExercise && !isTimedExercise && !allSetsComplete && (
                      <div className="flex justify-center mb-4">
                        <Button
                          onClick={handleCompleteSet}
                          className="px-8 py-2 rounded-full bg-primary text-primary-foreground font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                          data-testid="button-complete-set"
                        >
                          Complete Set
                        </Button>
                      </div>
                    )}

                    {/* All sets complete indicator */}
                    {allSetsComplete && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex justify-center mb-4"
                      >
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-bold uppercase">All Sets Complete!</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Timed exercise (no sets) complete indicator */}
                    {isTimedExercise && !isSetBasedExercise && exerciseTimer === 0 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex justify-center mb-4"
                      >
                        <div className="flex items-center gap-2 text-primary">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-bold uppercase">Time Complete!</span>
                        </div>
                      </motion.div>
                    )}

                    {/* Description */}
                    <p className="text-muted-foreground text-sm text-center mb-4 leading-relaxed">
                      {currentStep?.notes || currentStep?.description || "Complete this exercise"}
                    </p>

                    {/* Sets x Reps Badge */}
                    <div className="flex justify-center">
                      <div className="inline-flex items-center justify-center px-4 py-2 rounded-full border border-primary/30 bg-primary/10">
                        <span className="text-sm font-bold text-primary uppercase tracking-wide">
                          {isSetBasedExercise && currentStep?.reps 
                            ? `${currentStep.sets} Sets x ${currentStep.reps}` 
                            : isSetBasedExercise && currentStep?.duration
                              ? `${currentStep.sets} Sets x ${currentStep.duration}`
                              : currentStep?.reps 
                                ? `${currentStep.reps}` 
                                : currentStep?.duration 
                                  ? currentStep.duration 
                                  : "Complete exercise"}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Navigation */}
            <div className="p-4 border-t border-white/5 bg-card/50 backdrop-blur-sm">
              <div className="flex gap-3 items-center">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="h-12 w-12 shrink-0 rounded-full border-primary/30 bg-transparent hover:bg-primary/10 text-primary"
                  onClick={() => setIsPlaying(!isPlaying)}
                  data-testid="button-toggle-timer"
                >
                  <Timer className={`w-5 h-5 ${isPlaying ? 'animate-pulse' : ''}`} />
                </Button>
                
                <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                  <Button 
                    className="w-full h-12 text-base font-display font-bold uppercase tracking-widest rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]" 
                    onClick={handleNext}
                    data-testid="button-next-exercise"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    {stepIndex === steps.length - 1 ? "Finish Workout" : "Next Exercise"}
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
