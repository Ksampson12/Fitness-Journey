import { useUserProfile } from "@/hooks/use-user";
import { Flame, Coins, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export function StatsBar() {
  const { data: profile } = useUserProfile();

  if (!profile) return null;

  return (
    <div className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 px-4 py-3">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {/* Streak */}
        <div className="flex items-center gap-2">
          <div className="bg-orange-500/10 p-1.5 rounded-lg border border-orange-500/20">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500/20" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Streak</span>
            <span className="text-sm font-display font-bold text-orange-400 leading-none">{profile.streak} Days</span>
          </div>
        </div>

        {/* Level / XP */}
        <div className="flex flex-col items-center px-4 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>LVL {Math.floor(profile.xp / 1000) + 1}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className="h-full bg-primary shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              initial={{ width: 0 }}
              animate={{ width: `${(profile.xp % 1000) / 10}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Coins */}
        <div className="flex items-center gap-2 justify-end">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-muted-foreground font-bold uppercase">Coins</span>
            <span className="text-sm font-display font-bold text-yellow-400 leading-none">{profile.coins}</span>
          </div>
          <div className="bg-yellow-500/10 p-1.5 rounded-lg border border-yellow-500/20">
            <Coins className="w-5 h-5 text-yellow-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
