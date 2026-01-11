import { useUserProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogOut, Settings, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Profile() {
  const { data: profile } = useUserProfile();
  const { logout } = useAuth();

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b bg-card">
        <button onClick={() => window.location.href = "/"} className="p-2 hover:bg-muted rounded-full">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display font-bold text-xl">My Profile</h1>
        <button className="p-2 hover:bg-muted rounded-full">
          <Settings className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 space-y-8 max-w-md mx-auto">
        {/* Avatar Section */}
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-6xl mb-4 shadow-xl">
             {profile.avatarArchetype === "shark" ? "🦈" : "🐬"}
          </div>
          <h2 className="text-2xl font-bold">Level {profile.evolutionStage} {profile.avatarArchetype === "shark" ? "Shark" : "Dolphin"}</h2>
          <p className="text-muted-foreground">{profile.fitnessLevel} • {profile.xp} Total XP</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Streak" value={profile.streak} icon="🔥" color="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" />
          <StatCard label="Coins" value={profile.coins} icon="🪙" color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" />
          <StatCard label="Completed" value={profile.completedNodeIds.length} icon="✅" color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" />
          <StatCard label="Items" value={profile.equippedItems.length} icon="🎒" color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" />
        </div>

        {/* Goals */}
        <div className="space-y-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" /> Current Goals
          </h3>
          <div className="flex flex-wrap gap-2">
            {profile.goals?.map(goal => (
              <span key={goal} className="px-3 py-1 rounded-full bg-muted text-sm font-medium">
                {goal}
              </span>
            ))}
          </div>
        </div>

        <Button 
          variant="destructive" 
          className="w-full rounded-xl mt-8"
          onClick={() => logout()}
        >
          <LogOut className="w-4 h-4 mr-2" /> Log Out
        </Button>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: any) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className={`p-4 rounded-2xl ${color} flex flex-col items-center justify-center gap-1`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs uppercase tracking-wider opacity-80">{label}</span>
    </motion.div>
  );
}
