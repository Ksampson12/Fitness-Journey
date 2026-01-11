import { useState } from "react";
import { motion } from "framer-motion";
import { useUpdateOnboarding } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dumbbell, Heart, Zap, User, Bike, Waves, Mountain, CircleDashed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const steps = [
  { id: "intro", title: "Welcome", description: "Let's get to know you." },
  { id: "level", title: "Fitness Level", description: "Where are you starting from?" },
  { id: "goals", title: "Primary Goal", description: "What drives you?" },
  { id: "equipment", title: "Equipment", description: "What do you have access to?" },
  { id: "activities", title: "Activities", description: "What do you enjoy?" },
  { id: "avatar", title: "Choose Avatar", description: "Select your digital form" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    displayName: "",
    fitnessLevel: "beginner",
    goals: [] as string[],
    equipment: [] as string[],
    activities: [] as string[],
    avatarArchetype: "shark-male",
  });

  const updateOnboarding = useUpdateOnboarding();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      await updateOnboarding.mutateAsync({
        displayName: formData.displayName,
        fitnessLevel: formData.fitnessLevel as any,
        goals: formData.goals,
        equipment: formData.equipment,
        activities: formData.activities,
        avatarArchetype: formData.avatarArchetype,
      });
      // Redirect to the plan reveal page instead of home
      setLocation("/plan-reveal");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to save profile." });
    }
  };

  const renderIntro = () => (
    <div className="space-y-6">
      <div className="text-center">
        <User className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Who is training today?</h3>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium text-muted-foreground">Your Name</label>
        <Input 
          value={formData.displayName}
          onChange={(e) => setFormData({...formData, displayName: e.target.value})}
          placeholder="Enter your name"
          className="text-lg py-6 bg-white/5 border-white/10"
        />
      </div>
    </div>
  );

  const renderLevelSelect = () => (
    <div className="space-y-4">
      {["beginner", "intermediate", "advanced"].map((level) => (
        <button
          key={level}
          onClick={() => setFormData({ ...formData, fitnessLevel: level })}
          className={`w-full p-6 rounded-2xl border text-left transition-all duration-200 ${
            formData.fitnessLevel === level
              ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "border-white/10 bg-card hover:border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xl font-display uppercase tracking-wide">{level}</span>
            {formData.fitnessLevel === level && <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,1)]" />}
          </div>
        </button>
      ))}
    </div>
  );

  const renderGoalsSelect = () => (
    <div className="grid grid-cols-2 gap-4">
      {[
        { id: "strength", icon: Dumbbell, label: "Strength" },
        { id: "cardio", icon: Heart, label: "Endurance" },
        { id: "flexibility", icon: Zap, label: "Agility" },
        { id: "balance", icon: User, label: "Balance" },
      ].map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => {
            const goals = formData.goals.includes(id)
              ? formData.goals.filter((g) => g !== id)
              : [...formData.goals, id];
            setFormData({ ...formData, goals });
          }}
          className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
            formData.goals.includes(id)
              ? "border-secondary bg-secondary/10 shadow-[0_0_15px_rgba(59,130,246,0.2)] text-secondary"
              : "border-white/10 bg-card hover:border-white/20 text-muted-foreground"
          }`}
        >
          <Icon className="w-8 h-8" />
          <span className="font-display font-bold uppercase text-sm">{label}</span>
        </button>
      ))}
    </div>
  );

  const renderEquipmentSelect = () => (
    <div className="grid grid-cols-2 gap-3">
      {[
        "Dumbbells", "Barbell", "Bench", "Kettlebell", 
        "Pull-up Bar", "Resistance Bands", "Medicine Ball", "Treadmill", "None (Bodyweight)"
      ].map((item) => (
        <button
          key={item}
          onClick={() => {
            const equipment = formData.equipment.includes(item)
              ? formData.equipment.filter((e) => e !== item)
              : [...formData.equipment, item];
            setFormData({ ...formData, equipment });
          }}
          className={`p-4 rounded-xl border text-sm font-bold transition-all ${
            formData.equipment.includes(item)
              ? "border-green-400 bg-green-400/10 text-green-400"
              : "border-white/10 bg-card hover:border-white/20 text-muted-foreground"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  );

  const renderActivitiesSelect = () => (
    <div className="grid grid-cols-2 gap-3">
      {[
        { id: "running", label: "Running", icon: Bike }, // reusing Bike icon for generic cardio
        { id: "cycling", label: "Cycling", icon: Bike },
        { id: "swimming", label: "Swimming", icon: Waves },
        { id: "hiking", label: "Hiking", icon: Mountain },
        { id: "yoga", label: "Yoga", icon: CircleDashed },
        { id: "weightlifting", label: "Weightlifting", icon: Dumbbell },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => {
            const activities = formData.activities.includes(id)
              ? formData.activities.filter((a) => a !== id)
              : [...formData.activities, id];
            setFormData({ ...formData, activities });
          }}
          className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
            formData.activities.includes(id)
              ? "border-purple-400 bg-purple-400/10 text-purple-400"
              : "border-white/10 bg-card hover:border-white/20 text-muted-foreground"
          }`}
        >
          <Icon className="w-5 h-5" />
          <span className="font-bold text-sm">{label}</span>
        </button>
      ))}
    </div>
  );

  const renderAvatarSelect = () => (
    <div className="grid grid-cols-2 gap-4">
      {[
        { id: "shark-male", label: "Shark (Male)", color: "text-blue-400", border: "border-blue-400", bg: "bg-blue-400/10" },
        { id: "dolphin-female", label: "Dolphin (Female)", color: "text-pink-400", border: "border-pink-400", bg: "bg-pink-400/10" }
      ].map((type) => (
        <button
          key={type.id}
          onClick={() => setFormData({ ...formData, avatarArchetype: type.id })}
          className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
            formData.avatarArchetype === type.id
              ? `${type.border} ${type.bg} ${type.color} shadow-[0_0_15px_rgba(0,0,0,0.2)]`
              : "border-white/10 bg-card hover:border-white/20 text-muted-foreground"
          }`}
        >
          <User className="w-12 h-12 opacity-80" />
          <span className="font-display font-bold uppercase text-xs">{type.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background p-6 flex flex-col justify-center max-w-lg mx-auto">
      <div className="mb-8 mt-8">
        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
          Initialize
        </h1>
        <p className="text-muted-foreground">
          Configure your fitness profile to begin the simulation.
        </p>
      </div>

      <div className="flex-1">
        <div className="mb-6">
          <h2 className="text-xl font-display text-white mb-2">{steps[currentStep].title}</h2>
          <p className="text-sm text-muted-foreground">{steps[currentStep].description}</p>
        </div>

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && renderIntro()}
          {currentStep === 1 && renderLevelSelect()}
          {currentStep === 2 && renderGoalsSelect()}
          {currentStep === 3 && renderEquipmentSelect()}
          {currentStep === 4 && renderActivitiesSelect()}
          {currentStep === 5 && renderAvatarSelect()}
        </motion.div>
      </div>

      <div className="mt-8 flex justify-between items-center pb-8">
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full transition-colors ${
                idx === currentStep ? "bg-primary shadow-[0_0_5px_rgba(16,185,129,1)]" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <Button 
          onClick={handleNext}
          className="px-8"
          disabled={
            (currentStep === 0 && formData.displayName.length === 0) ||
            (currentStep === 2 && formData.goals.length === 0) ||
            (currentStep === 3 && formData.equipment.length === 0) ||
            (currentStep === 4 && formData.activities.length === 0) ||
            (updateOnboarding.isPending) // Disable when submitting
          }
        >
          {updateOnboarding.isPending ? "Generating..." : currentStep === steps.length - 1 ? "Start Journey" : "Next"}
        </Button>
      </div>
    </div>
  );
}
