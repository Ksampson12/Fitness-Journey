import { useUserProfile } from "@/hooks/use-user";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Trophy, Calendar, Target, CheckCircle2, TrendingUp } from "lucide-react";

export default function Goals() {
  const { data: profile } = useUserProfile();

  if (!profile) return null;

  // Derived stats
  const level = Math.floor(profile.xp / 1000) + 1;
  const xpProgress = (profile.xp % 1000) / 10; // 0-100%
  const totalWorkouts = profile.completedNodeIds?.length || 0;
  // We don't strictly track "Plans Completed" yet, so we'll mock it or use a proxy if available.
  // For now, we'll omit it or show 0/1 (Current Plan).
  
  const weeklyPlan = profile.weeklyPlan as any;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-6 pt-12">
        <h1 className="text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
          Your Progress
        </h1>
        <p className="text-muted-foreground mb-8">
          Track your achievements and current streak.
        </p>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="bg-orange-500/10 border-orange-500/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Flame className="w-8 h-8 text-orange-500 mb-2" />
              <div className="text-3xl font-display font-bold text-white">{profile.streak}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Day Streak</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
              <Trophy className="w-8 h-8 text-blue-500 mb-2" />
              <div className="text-3xl font-display font-bold text-white">{totalWorkouts}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Missions Done</div>
            </CardContent>
          </Card>
        </div>

        {/* Level Progress */}
        <div className="mb-8 space-y-2">
          <div className="flex justify-between items-end">
            <span className="font-bold text-white">Level {level}</span>
            <span className="text-xs text-muted-foreground">{profile.xp % 1000} / 1000 XP</span>
          </div>
          <Progress value={xpProgress} className="h-3" />
        </div>

        {/* Current Plan / In Progress */}
        <div className="space-y-6">
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-primary" />
              <h2 className="font-display font-bold uppercase tracking-wider">Current Goals</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.goals?.map((goal: string) => (
                <div key={goal} className="px-4 py-2 rounded-xl bg-card border border-white/5 text-sm font-medium capitalize">
                  {goal}
                </div>
              ))}
              {(!profile.goals || profile.goals.length === 0) && (
                <div className="text-muted-foreground text-sm italic">No specific goals set.</div>
              )}
            </div>
          </section>

          {weeklyPlan && weeklyPlan.schedule && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h2 className="font-display font-bold uppercase tracking-wider">Active Plan Progress</h2>
              </div>
              <Card className="border-white/10 bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Weekly Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {weeklyPlan.schedule.map((day: any, i: number) => (
                     <div key={i} className="flex items-center gap-4 py-2 border-b border-white/5 last:border-0">
                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-muted-foreground">
                         {day.day.substring(0,3)}
                       </div>
                       <div className="flex-1">
                         <div className="font-medium text-sm">{day.focus}</div>
                         <div className="text-xs text-muted-foreground">{day.duration}</div>
                       </div>
                       {/* Todo: We need to actually track which days are done in the DB */}
                       <div className="w-6 h-6 rounded-full border-2 border-white/10" />
                     </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}

           <section>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h2 className="font-display font-bold uppercase tracking-wider">All Time Stats</h2>
            </div>
             <div className="grid grid-cols-2 gap-3">
               <div className="p-4 rounded-xl bg-card border border-white/5">
                 <div className="text-sm text-muted-foreground mb-1">Total XP</div>
                 <div className="text-xl font-bold">{profile.xp}</div>
               </div>
               <div className="p-4 rounded-xl bg-card border border-white/5">
                 <div className="text-sm text-muted-foreground mb-1">Total Coins</div>
                 <div className="text-xl font-bold text-yellow-400">{profile.coins}</div>
               </div>
             </div>
          </section>
        </div>
      </div>

      <Navigation />
    </div>
  );
}
