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
  { id: "profile", title: "Profile Basics", description: "Personalize your experience" },
  { id: "fitness", title: "Fitness Background", description: "Where are you starting from?" },
  { id: "goals", title: "Goals", description: "What drives you?" },
  { id: "schedule", title: "Availability", description: "When do you train?" },
  { id: "equipment", title: "Equipment", description: "What do you have access to?" },
  { id: "limitations", title: "Limitations", description: "Your safety comes first" },
  { id: "style", title: "Training Style", description: "How do you like to train?" },
  { id: "avatar", title: "Choose Avatar", description: "Select your digital form" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    displayName: "",
    ageRange: "",
    fitnessLevel: "beginner",
    trainingExperience: "",
    primaryGoal: "",
    secondaryGoal: "",
    targetAreas: [] as string[],
    workoutDaysPerWeek: 3,
    preferredWorkoutLength: "30-min",
    bestTimeOfDay: "morning",
    workoutLocation: "home",
    equipment: [] as string[],
    injuriesOrLimitations: "no",
    movementsToAvoid: [] as string[],
    workoutStyle: "mixed",
    intensityPreference: "moderate",
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
        ageRange: formData.ageRange,
        fitnessLevel: formData.fitnessLevel as any,
        trainingExperience: formData.trainingExperience,
        primaryGoal: formData.primaryGoal,
        secondaryGoal: formData.secondaryGoal,
        targetAreas: formData.targetAreas,
        workoutDaysPerWeek: formData.workoutDaysPerWeek,
        preferredWorkoutLength: formData.preferredWorkoutLength,
        bestTimeOfDay: formData.bestTimeOfDay,
        workoutLocation: formData.workoutLocation,
        equipment: formData.equipment,
        injuriesOrLimitations: formData.injuriesOrLimitations,
        movementsToAvoid: formData.movementsToAvoid,
        workoutStyle: formData.workoutStyle,
        intensityPreference: formData.intensityPreference,
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

  // NEW RENDER FUNCTIONS
  const renderProfileBasics = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">What should we call you?</label>
          <Input
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
            placeholder="Enter your name"
            className="bg-card border-white/10"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Age Range (optional)</label>
          <div className="grid grid-cols-2 gap-2">
            {["under-18", "18-24", "25-34", "35-44", "45-54", "55+"].map((age) => (
              <button
                key={age}
                onClick={() => setFormData({ ...formData, ageRange: age })}
                className={`p-3 rounded-lg border text-sm transition-all ${
                  formData.ageRange === age
                    ? "border-primary bg-primary/20 text-primary"
                    : "border-white/10 bg-card hover:border-white/20"
                }`}
              >
                {age.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFitnessBackground = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Current Fitness Level</label>
        <div className="space-y-2">
          {[
            { value: "beginner", label: "Beginner", desc: "New or returning after a long break" },
            { value: "intermediate", label: "Intermediate", desc: "Consistent workouts 2-4x/week" },
            { value: "advanced", label: "Advanced", desc: "Structured training 4-6x/week" }
          ].map((level) => (
            <button
              key={level.value}
              onClick={() => setFormData({ ...formData, fitnessLevel: level.value })}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                formData.fitnessLevel === level.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              <div className="font-medium">{level.label}</div>
              <div className="text-sm opacity-70">{level.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Training Experience (optional)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "never", label: "Never trained" },
            { value: "some", label: "Some experience" },
            { value: "1-3-years", label: "1-3 years" },
            { value: "3-plus-years", label: "3+ years" }
          ].map((exp) => (
            <button
              key={exp.value}
              onClick={() => setFormData({ ...formData, trainingExperience: exp.value })}
              className={`p-3 rounded-lg border text-sm transition-all ${
                formData.trainingExperience === exp.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {exp.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderGoals = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Primary Goal</label>
        <div className="space-y-2">
          {[
            { value: "fat-loss", label: "Fat loss", icon: "🔥" },
            { value: "muscle-building", label: "Muscle building", icon: "💪" },
            { value: "strength", label: "Strength", icon: "⚡" },
            { value: "endurance", label: "Endurance", icon: "🏃" },
            { value: "mobility", label: "Mobility & flexibility", icon: "🧘" },
            { value: "general-health", label: "General health", icon: "❤️" }
          ].map((goal) => (
            <button
              key={goal.value}
              onClick={() => setFormData({ ...formData, primaryGoal: goal.value })}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                formData.primaryGoal === goal.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{goal.icon}</span>
                <div className="font-medium">{goal.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Secondary Goal (optional)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "posture", label: "Improve posture" },
            { value: "core-strength", label: "Core strength" },
            { value: "athletic-performance", label: "Athletic performance" },
            { value: "stress-reduction", label: "Stress reduction" }
          ].map((goal) => (
            <button
              key={goal.value}
              onClick={() => setFormData({ ...formData, secondaryGoal: goal.value })}
              className={`p-3 rounded-lg border text-sm transition-all ${
                formData.secondaryGoal === goal.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {goal.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Target Areas (multi-select)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            "full-body", "upper-body", "lower-body", "core", "glutes", "arms", "back"
          ].map((area) => (
            <button
              key={area}
              onClick={() => {
                const updated = formData.targetAreas.includes(area)
                  ? formData.targetAreas.filter(a => a !== area)
                  : [...formData.targetAreas, area];
                setFormData({ ...formData, targetAreas: updated });
              }}
              className={`p-3 rounded-lg border text-sm transition-all capitalize ${
                formData.targetAreas.includes(area)
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {area.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">How many days per week can you realistically work out?</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 1, label: "1-2 days" },
            { value: 3, label: "3 days" },
            { value: 4, label: "4 days" },
            { value: 5, label: "5+ days" }
          ].map((days) => (
            <button
              key={days.value}
              onClick={() => setFormData({ ...formData, workoutDaysPerWeek: days.value })}
              className={`p-3 rounded-lg border text-sm transition-all ${
                formData.workoutDaysPerWeek === days.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {days.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Preferred Workout Length</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            "15-20-min", "30-min", "45-min", "60-min"
          ].map((length) => (
            <button
              key={length}
              onClick={() => setFormData({ ...formData, preferredWorkoutLength: length })}
              className={`p-3 rounded-lg border text-sm transition-all ${
                formData.preferredWorkoutLength === length
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {length.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Best Time of Day to Train</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            "morning", "afternoon", "evening", "varies"
          ].map((time) => (
            <button
              key={time}
              onClick={() => setFormData({ ...formData, bestTimeOfDay: time })}
              className={`p-3 rounded-lg border text-sm transition-all capitalize ${
                formData.bestTimeOfDay === time
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderEquipment = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Available Equipment (multi-select)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            "bodyweight", "dumbbells", "barbell", "resistance-bands", "kettlebells", "machines", "cardio-equipment"
          ].map((item) => (
            <button
              key={item}
              onClick={() => {
                const updated = formData.equipment.includes(item)
                  ? formData.equipment.filter(e => e !== item)
                  : [...formData.equipment, item];
                setFormData({ ...formData, equipment: updated });
              }}
              className={`p-3 rounded-lg border text-sm transition-all capitalize ${
                formData.equipment.includes(item)
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {item.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Workout Location</label>
        <div className="grid grid-cols-3 gap-2">
          {["home", "gym", "both"].map((location) => (
            <button
              key={location}
              onClick={() => setFormData({ ...formData, workoutLocation: location })}
              className={`p-3 rounded-lg border text-sm transition-all capitalize ${
                formData.workoutLocation === location
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {location}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLimitations = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Do you have any injuries, pain, or limitations?</label>
        <div className="space-y-2">
          {[
            { value: "no", label: "No, I'm good to go!" },
            { value: "yes", label: "Yes, I have some limitations" }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFormData({ ...formData, injuriesOrLimitations: option.value })}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                formData.injuriesOrLimitations === option.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {formData.injuriesOrLimitations === "yes" && (
        <div>
          <label className="block text-sm font-medium mb-2">Please describe your limitations</label>
          <textarea
            value={formData.injuriesOrLimitations === "yes" ? formData.injuriesOrLimitations : ""}
            onChange={(e) => setFormData({ ...formData, injuriesOrLimitations: e.target.value })}
            placeholder="e.g., 'Knee pain when squatting', 'Lower back issues', 'Shoulder impingement'"
            className="w-full p-3 rounded-lg border border-white/10 bg-card text-sm min-h-[80px]"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Movements to Avoid (optional)</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            "squats", "lunges", "overhead-pressing", "running", "jumping"
          ].map((movement) => (
            <button
              key={movement}
              onClick={() => {
                const updated = formData.movementsToAvoid.includes(movement)
                  ? formData.movementsToAvoid.filter(m => m !== movement)
                  : [...formData.movementsToAvoid, movement];
                setFormData({ ...formData, movementsToAvoid: updated });
              }}
              className={`p-3 rounded-lg border text-sm transition-all capitalize ${
                formData.movementsToAvoid.includes(movement)
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              {movement.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStyle = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Workout Style You Enjoy Most</label>
        <div className="space-y-2">
          {[
            { value: "strength", label: "Strength training", desc: "Heavy weights, lower reps" },
            { value: "hiit", label: "HIIT", desc: "High intensity intervals" },
            { value: "circuits", label: "Circuits", desc: "Continuous movement" },
            { value: "cardio", label: "Cardio-focused", desc: "Heart rate elevation" },
            { value: "yoga", label: "Yoga / mobility", desc: "Flow and flexibility" },
            { value: "mixed", label: "Mixed", desc: "Variety is key" }
          ].map((style) => (
            <button
              key={style.value}
              onClick={() => setFormData({ ...formData, workoutStyle: style.value })}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                formData.workoutStyle === style.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              <div className="font-medium">{style.label}</div>
              <div className="text-sm opacity-70">{style.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Intensity Preference</label>
        <div className="space-y-2">
          {[
            { value: "low-steady", label: "Low & steady", desc: "Comfortable pace" },
            { value: "moderate", label: "Moderate", desc: "Challenging but doable" },
            { value: "push-hard", label: "Push me hard", desc: "Maximum effort" }
          ].map((intensity) => (
            <button
              key={intensity.value}
              onClick={() => setFormData({ ...formData, intensityPreference: intensity.value })}
              className={`w-full p-4 rounded-lg border text-left transition-all ${
                formData.intensityPreference === intensity.value
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-white/10 bg-card hover:border-white/20"
              }`}
            >
              <div className="font-medium">{intensity.label}</div>
              <div className="text-sm opacity-70">{intensity.desc}</div>
            </button>
          ))}
        </div>
      </div>
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
          {currentStep === 1 && renderProfileBasics()}
          {currentStep === 2 && renderFitnessBackground()}
          {currentStep === 3 && renderGoals()}
          {currentStep === 4 && renderSchedule()}
          {currentStep === 5 && renderEquipment()}
          {currentStep === 6 && renderLimitations()}
          {currentStep === 7 && renderStyle()}
          {currentStep === 8 && renderAvatarSelect()}
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
            (currentStep === 3 && formData.primaryGoal.length === 0) ||
            (currentStep === 5 && formData.equipment.length === 0) ||
            (updateOnboarding.isPending) // Disable when submitting
          }
        >
          {updateOnboarding.isPending ? "Generating..." : currentStep === steps.length - 1 ? "Start Journey" : "Next"}
        </Button>
      </div>
    </div>
  );
}
