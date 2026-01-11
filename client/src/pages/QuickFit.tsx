import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Dumbbell, Timer, Flame, Brain, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function QuickFit() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    duration: "30",
    focus: "Full Body",
    intensity: "Moderate",
    mood: "Energized"
  });
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);

  const generateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch(api.game.quickFit.path, {
        method: api.game.quickFit.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to generate workout");
      return await res.json();
    },
    onSuccess: (data) => {
      setGeneratedWorkout(data.workout);
      setStep(5); // Result step
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate workout", variant: "destructive" });
    }
  });

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <Timer className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold">How much time do you have?</h2>
              <p className="text-muted-foreground">Select your workout duration</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {['30', '60'].map((val) => (
                <button
                  key={val}
                  onClick={() => setFormData({...formData, duration: val})}
                  className={cn(
                    "p-6 rounded-xl border-2 transition-all",
                    formData.duration === val 
                      ? "border-primary bg-primary/10" 
                      : "border-white/5 bg-card hover:border-primary/50"
                  )}
                >
                  <span className="text-3xl font-bold">{val}</span>
                  <span className="text-xs uppercase tracking-wider block">Minutes</span>
                </button>
              ))}
            </div>
            <Button className="w-full mt-8" onClick={handleNext}>Next</Button>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <Dumbbell className="w-12 h-12 text-blue-400 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold">What's your focus?</h2>
              <p className="text-muted-foreground">Target specific areas or go full body</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {['Full Body', 'Upper Body', 'Lower Body', 'Core', 'Cardio', 'Mobility'].map((val) => (
                <button
                  key={val}
                  onClick={() => setFormData({...formData, focus: val})}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    formData.focus === val 
                      ? "border-blue-400 bg-blue-400/10" 
                      : "border-white/5 bg-card hover:border-blue-400/50"
                  )}
                >
                  <span className="font-bold">{val}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" className="w-full" onClick={handleBack}>Back</Button>
              <Button className="w-full" onClick={handleNext}>Next</Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <Flame className="w-12 h-12 text-orange-400 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold">Intensity Level</h2>
              <p className="text-muted-foreground">How hard do you want to push?</p>
            </div>
            <div className="space-y-4">
              {['Low', 'Moderate', 'High'].map((val) => (
                <button
                  key={val}
                  onClick={() => setFormData({...formData, intensity: val})}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-left transition-all",
                    formData.intensity === val 
                      ? "border-orange-400 bg-orange-400/10" 
                      : "border-white/5 bg-card hover:border-orange-400/50"
                  )}
                >
                  <span className="font-bold block">{val}</span>
                  <span className="text-xs text-muted-foreground">
                    {val === 'Low' && 'Active recovery, focus on form'}
                    {val === 'Moderate' && 'Steady heart rate, good sweat'}
                    {val === 'High' && 'Maximum effort, HIIT style'}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" className="w-full" onClick={handleBack}>Back</Button>
              <Button className="w-full" onClick={handleNext}>Next</Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="text-center mb-8">
              <Brain className="w-12 h-12 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-display font-bold">How do you feel?</h2>
              <p className="text-muted-foreground">Adjust for your energy levels</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['Energized', 'Tired', 'Stressed', 'Focused'].map((val) => (
                <button
                  key={val}
                  onClick={() => setFormData({...formData, mood: val})}
                  className={cn(
                    "p-4 rounded-xl border-2 text-center transition-all",
                    formData.mood === val 
                      ? "border-purple-400 bg-purple-400/10" 
                      : "border-white/5 bg-card hover:border-purple-400/50"
                  )}
                >
                  <span className="font-bold">{val}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <Button variant="outline" className="w-full" onClick={handleBack}>Back</Button>
              <Button 
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600" 
                onClick={() => generateMutation.mutate(formData)}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? "Generating..." : "Create Workout"}
              </Button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in zoom-in-95 duration-300">
             <div className="text-center mb-6">
              <div className="inline-block p-3 rounded-full bg-green-500/20 mb-4">
                <Play className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-white">{generatedWorkout?.title}</h2>
              <p className="text-green-400 font-mono text-sm">AI COACH GENERATED</p>
            </div>

            <div className="bg-card border border-white/10 rounded-xl p-4 max-h-[50vh] overflow-y-auto">
              {generatedWorkout?.exercises?.map((ex: any, i: number) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-white/5 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">{ex.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {ex.sets ? `${ex.sets} sets` : ''} 
                      {ex.reps ? ` • ${ex.reps} reps` : ''} 
                      {ex.duration ? ` • ${ex.duration}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full size-lg text-lg font-bold" onClick={() => toast({ title: "Coming Soon", description: "Workout player integration for QuickFit coming next!" })}>
              Start Session
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => setStep(1)}>
              Create Another
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <div className="h-24 bg-gradient-to-b from-blue-500/10 to-background flex items-end p-6">
        <h1 className="text-xl font-display font-bold uppercase tracking-wider text-blue-400">QuickFit Coach</h1>
      </div>

      <div className="flex-1 p-6 flex flex-col justify-center max-w-md mx-auto w-full">
        {renderStep()}
      </div>

      <Navigation />
    </div>
  );
}
