import { useState } from "react";
import { useGameMap, useStartNode } from "@/hooks/use-game";
import { useUserProfile } from "@/hooks/use-user";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/Navigation";
import { StatsBar } from "@/components/StatsBar";
import { WorkoutPlayer } from "@/components/WorkoutPlayer";
import { motion } from "framer-motion";
import { Lock, MapPin, Star, Skull } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Home() {
  const { data: map, isLoading } = useGameMap();
  const { data: profile } = useUserProfile();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [workoutData, setWorkoutData] = useState<any>(null);
  
  const startNodeMutation = useStartNode();
  const { toast } = useToast();

  if (isLoading || !map || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="font-mono text-xs text-primary animate-pulse">LOADING MAP DATA...</p>
        </div>
      </div>
    );
  }

  const handleStartWorkout = async () => {
    try {
      const data = await startNodeMutation.mutateAsync({ nodeId: selectedNode.id });
      setWorkoutData(data);
      setSelectedNode(null); // Close modal
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: error.message || "Failed to start mission.",
      });
    }
  };

  const isNodeLocked = (nodeId: string) => {
    // If it's the first node, it's unlocked if user has no unlocked nodes
    if (map.nodes[0].id === nodeId && (!profile.unlockedNodeIds || profile.unlockedNodeIds.length === 0)) return false;
    return !profile.unlockedNodeIds.includes(nodeId) && !profile.completedNodeIds.includes(nodeId);
  };

  const isNodeCompleted = (nodeId: string) => profile.completedNodeIds.includes(nodeId);

  return (
    <div className="min-h-screen bg-background pb-20 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      <StatsBar />

      <main className="p-6 max-w-md mx-auto relative z-10 min-h-[80vh] flex flex-col items-center gap-8 pt-12">
        {/* Zones / Nodes */}
        {map.zones.sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((zone: any) => (
          <div key={zone.id} className="w-full relative group">
            <div className="absolute -left-4 top-0 bottom-0 w-1 bg-white/5 rounded-full" />
            
            <div className="mb-6 pl-6">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest block mb-1">Zone {zone.orderIndex}</span>
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-wide flex items-center gap-2">
                {zone.name}
                {zone.orderIndex > 1 && <Lock className="w-4 h-4 text-muted-foreground" />}
              </h2>
            </div>

            <div className="space-y-12 pl-6 relative">
              {map.nodes
                .filter((n: any) => n.zoneId === zone.id)
                .sort((a: any, b: any) => a.orderIndex - b.orderIndex)
                .map((node: any, index: number) => {
                  const locked = isNodeLocked(node.id);
                  const completed = isNodeCompleted(node.id);
                  const active = !locked && !completed;
                  
                  return (
                    <motion.button
                      key={node.id}
                      onClick={() => !locked && setSelectedNode(node)}
                      whileHover={!locked ? { scale: 1.05 } : {}}
                      whileTap={!locked ? { scale: 0.95 } : {}}
                      className={`relative w-full aspect-[3/1] rounded-xl border flex items-center justify-between px-6 transition-all duration-300 group
                        ${locked 
                          ? "bg-card/30 border-white/5 opacity-50 cursor-not-allowed grayscale" 
                          : completed
                            ? "bg-primary/10 border-primary/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                            : "bg-card border-white/10 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                        }
                      `}
                    >
                      {/* Connection Line */}
                      {index < map.nodes.length - 1 && (
                        <div className="absolute left-6 top-full h-12 w-0.5 bg-white/5 -z-10" />
                      )}

                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2
                          ${locked 
                            ? "border-muted-foreground/30 bg-muted/20" 
                            : completed 
                              ? "border-primary bg-primary text-background" 
                              : "border-primary/50 bg-background text-primary neon-border"
                          }
                        `}>
                          {locked ? <Lock className="w-4 h-4" /> : completed ? <Star className="w-5 h-5 fill-current" /> : <MapPin className="w-5 h-5" />}
                        </div>
                        
                        <div className="text-left">
                          <h3 className={`font-display font-bold text-lg uppercase ${locked ? "text-muted-foreground" : "text-foreground"}`}>
                            {node.name}
                          </h3>
                          <p className="text-xs font-mono text-muted-foreground uppercase">{node.type} • Lvl {node.difficulty}</p>
                        </div>
                      </div>

                      {node.type === "boss" && (
                        <div className="absolute -right-2 -top-2 bg-destructive text-destructive-foreground p-1.5 rounded-lg shadow-lg rotate-12">
                          <Skull className="w-4 h-4" />
                        </div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        ))}
      </main>

      <Navigation />

      {/* Node Detail Modal */}
      <Dialog open={!!selectedNode} onOpenChange={(o) => !o && setSelectedNode(null)}>
        <DialogContent className="sm:max-w-md border-white/10 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl uppercase tracking-wide text-primary">
              Mission Briefing
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-white/5">
              <span className="text-muted-foreground text-sm uppercase font-bold">Target</span>
              <span className="text-white font-mono">{selectedNode?.name}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border border-white/5">
                 <div className="text-xs text-muted-foreground uppercase mb-1">Difficulty</div>
                 <div className="flex gap-1">
                   {[...Array(5)].map((_, i) => (
                     <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (selectedNode?.difficulty || 0) ? "bg-orange-500" : "bg-white/10"}`} />
                   ))}
                 </div>
              </div>
              <div className="p-4 rounded-xl bg-background border border-white/5">
                 <div className="text-xs text-muted-foreground uppercase mb-1">Rewards</div>
                 <div className="font-mono text-primary font-bold">+150 XP</div>
              </div>
            </div>

            <Button 
              className="w-full text-lg h-14 mt-4" 
              onClick={handleStartWorkout}
              disabled={startNodeMutation.isPending}
            >
              {startNodeMutation.isPending ? "Generating..." : "Accept Mission"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workout Player Fullscreen Overlay */}
      {workoutData && (
        <WorkoutPlayer
          isOpen={!!workoutData}
          onClose={() => setWorkoutData(null)}
          workoutId={workoutData.workoutId}
          workout={workoutData.workout}
        />
      )}
    </div>
  );
}
