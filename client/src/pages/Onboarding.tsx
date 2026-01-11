import { useUpdateOnboarding } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Check, Dumbbell, Activity, Target } from "lucide-react";
import clsx from "clsx";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fitnessLevel: "beginner",
    goals: [] as string[],
    equipment: [] as string[],
    avatarArchetype: "shark",
  });
  
  const { mutate: updateOnboarding, isPending } = useUpdateOnboarding();
  const { toast } = useToast();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);
  
  const handleSubmit = () => {
    updateOnboarding(formData, {
      onError: () => toast({ title: "Error", description: "Something went wrong.", variant: "destructive" }),
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="w-full max-w-lg space-y-8"
      >
        {/* Progress */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`h-2 w-12 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-center">Choose Your Trainer</h2>
            <div className="grid grid-cols-2 gap-4">
              <ArchetypeCard 
                title="Shark" 
                selected={formData.avatarArchetype === "shark"}
                onClick={() => setFormData({ ...formData, avatarArchetype: "shark" })}
                color="bg-slate-200 dark:bg-slate-800"
              />
              <ArchetypeCard 
                title="Dolphin" 
                selected={formData.avatarArchetype === "dolphin"}
                onClick={() => setFormData({ ...formData, avatarArchetype: "dolphin" })}
                color="bg-blue-100 dark:bg-blue-900"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-center">Fitness Level</h2>
            <div className="space-y-3">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <SelectionButton
                  key={level}
                  label={level.charAt(0).toUpperCase() + level.slice(1)}
                  selected={formData.fitnessLevel === level}
                  onClick={() => setFormData({ ...formData, fitnessLevel: level })}
                  icon={<Activity className="w-5 h-5" />}
                />
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-center">Equipment</h2>
            <div className="space-y-3">
              {['None (Bodyweight)', 'Dumbbells', 'Resistance Bands', 'Yoga Mat'].map((item) => (
                <SelectionButton
                  key={item}
                  label={item}
                  selected={formData.equipment.includes(item)}
                  onClick={() => {
                    const newEq = formData.equipment.includes(item)
                      ? formData.equipment.filter(e => e !== item)
                      : [...formData.equipment, item];
                    setFormData({ ...formData, equipment: newEq });
                  }}
                  icon={<Dumbbell className="w-5 h-5" />}
                  multi
                />
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-center">Main Goals</h2>
            <div className="space-y-3">
              {['Strength', 'Cardio', 'Flexibility', 'Weight Loss'].map((goal) => (
                <SelectionButton
                  key={goal}
                  label={goal}
                  selected={formData.goals.includes(goal)}
                  onClick={() => {
                    const newGoals = formData.goals.includes(goal)
                      ? formData.goals.filter(g => g !== goal)
                      : [...formData.goals, goal];
                    setFormData({ ...formData, goals: newGoals });
                  }}
                  icon={<Target className="w-5 h-5" />}
                  multi
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-4 pt-4">
          {step > 1 && (
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={handleBack}>
              Back
            </Button>
          )}
          <Button 
            className="flex-1 h-12 rounded-xl bg-primary hover:bg-primary/90"
            onClick={step === 4 ? handleSubmit : handleNext}
            disabled={isPending}
          >
            {step === 4 ? (isPending ? "Creating Profile..." : "Finish") : "Next"}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ArchetypeCard({ title, selected, onClick, color }: any) {
  return (
    <Card 
      className={clsx(
        "p-6 cursor-pointer transition-all duration-200 border-2 relative overflow-hidden h-48 flex flex-col items-center justify-center",
        selected ? "border-primary ring-2 ring-primary/20 scale-[1.02]" : "border-transparent hover:border-border",
        color
      )}
      onClick={onClick}
    >
      <div className="text-4xl mb-4">{title === "Shark" ? "🦈" : "🐬"}</div>
      <h3 className="text-xl font-bold">{title}</h3>
      {selected && (
        <div className="absolute top-3 right-3 bg-primary text-white p-1 rounded-full">
          <Check className="w-4 h-4" />
        </div>
      )}
    </Card>
  );
}

function SelectionButton({ label, selected, onClick, icon, multi }: any) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-200 border-2 text-left",
        selected 
          ? "border-primary bg-primary/5 text-primary" 
          : "border-border bg-card hover:border-primary/50 text-muted-foreground"
      )}
    >
      <div className={clsx(
        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
        selected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
      )}>
        {selected ? <Check className="w-5 h-5" /> : icon}
      </div>
      <span className="font-semibold text-lg">{label}</span>
    </button>
  );
}
