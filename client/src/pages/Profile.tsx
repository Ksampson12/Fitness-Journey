import { useUserProfile } from "@/hooks/use-user";
import { useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, User } from "lucide-react";

export default function Profile() {
  const { data: profile } = useUserProfile();
  const { logout } = useAuth();

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="h-48 bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-20" />
      </div>

      <div className="px-6 -mt-16 relative z-10">
        <div className="flex justify-between items-end mb-6">
          <div className="w-32 h-32 rounded-2xl bg-card border-4 border-background shadow-xl flex items-center justify-center relative overflow-hidden group">
            <User className="w-16 h-16 text-muted-foreground" />
            <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent opacity-50" />
            <div className="absolute bottom-0 w-full bg-black/50 text-[10px] text-center py-1 text-white font-mono uppercase backdrop-blur-sm">
              Level {Math.floor(profile.xp / 1000) + 1}
            </div>
          </div>
          <Button variant="outline" size="icon" className="rounded-full">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        <h1 className="text-3xl font-display font-bold uppercase mb-1">User-{profile.userId.slice(0, 4)}</h1>
        <p className="text-primary font-mono text-sm uppercase tracking-wider mb-8">{profile.avatarArchetype} Class</p>

        <div className="space-y-6">
          <section>
             <h2 className="text-sm font-bold uppercase text-muted-foreground mb-4 tracking-wider">Stats</h2>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-white mb-1">{profile.xp}</div>
                  <div className="text-xs text-muted-foreground uppercase">Total XP</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-white mb-1">{profile.completedNodeIds?.length || 0}</div>
                  <div className="text-xs text-muted-foreground uppercase">Missions Complete</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-orange-400 mb-1">{profile.streak}</div>
                  <div className="text-xs text-muted-foreground uppercase">Day Streak</div>
                </div>
                <div className="bg-card border border-white/5 p-4 rounded-xl">
                  <div className="text-2xl font-display font-bold text-yellow-400 mb-1">{profile.coins}</div>
                  <div className="text-xs text-muted-foreground uppercase">Coins</div>
                </div>
             </div>
          </section>

          <Button 
            variant="destructive" 
            className="w-full mt-8" 
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" /> Log Out
          </Button>
        </div>
      </div>
      
      <Navigation />
    </div>
  );
}
