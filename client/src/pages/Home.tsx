import { useMapData, useStartNode } from "@/hooks/use-game";
import { useUserProfile } from "@/hooks/use-user";
import { MapNode } from "@/components/MapNode";
import { AvatarOverlay } from "@/components/AvatarOverlay";
import { motion } from "framer-motion";
import { Loader2, Trophy, Flame } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function Home() {
  const { data: mapData, isLoading: mapLoading } = useMapData();
  const { data: profile } = useUserProfile();
  const { mutate: startNode, isPending: startingNode } = useStartNode();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  if (mapLoading || !profile || !mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ocean-pattern">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Determine node status
  const getNodeStatus = (nodeId: string) => {
    if (profile.completedNodeIds.includes(nodeId)) return "completed";
    if (profile.unlockedNodeIds.includes(nodeId)) return "unlocked";
    return "locked";
  };

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
  };

  const handleStartWorkout = () => {
    if (!selectedNodeId) return;
    startNode({ nodeId: selectedNodeId }, {
      onSuccess: (data) => {
        // Navigate to workout player
        // For MVP, passing state via URL or simple ID
        window.location.href = `/workout/${data.workoutId}`;
      },
      onError: (err) => {
        console.error(err);
      }
    });
  };

  const selectedNode = mapData.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="min-h-screen bg-ocean-pattern relative overflow-hidden">
      {/* Header Stats */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-md border-b border-border p-4 flex justify-between items-center safe-area-top">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full font-bold text-sm">
            <Trophy className="w-4 h-4" />
            {profile.xp} XP
          </div>
          <div className="flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full font-bold text-sm">
            <Flame className="w-4 h-4" />
            {profile.streak} Day Streak
          </div>
        </div>
        <div 
          className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer"
          onClick={() => setLocation("/profile")}
        >
          <span className="text-lg">👤</span>
        </div>
      </div>

      {/* Map Container - Scrollable */}
      <div className="w-full h-full overflow-auto pt-20 pb-32 px-4 relative min-h-screen">
        <div className="relative w-full max-w-md mx-auto" style={{ height: "800px" }}>
          {/* Connection Lines (Simple SVG for now) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
            {mapData.nodes.map(node => (
              node.prerequisites.map(preId => {
                const preNode = mapData.nodes.find(n => n.id === preId);
                if (!preNode) return null;
                return (
                  <line 
                    key={`${preId}-${node.id}`}
                    x1={preNode.x} y1={preNode.y}
                    x2={node.x} y2={node.y}
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeDasharray="8 4"
                    className="text-primary"
                  />
                );
              })
            ))}
          </svg>

          {/* Nodes */}
          {mapData.nodes.map((node) => (
            <MapNode 
              key={node.id} 
              node={node} 
              status={getNodeStatus(node.id)} 
              onClick={handleNodeClick}
              active={selectedNodeId === node.id}
            />
          ))}
        </div>
      </div>

      {/* Avatar Overlay */}
      <AvatarOverlay />

      {/* Node Detail Dialog */}
      <Dialog open={!!selectedNodeId} onOpenChange={(open) => !open && setSelectedNodeId(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">{selectedNode?.name}</DialogTitle>
            <DialogDescription className="text-lg pt-2">
              Difficulty: {Array(selectedNode?.difficulty).fill("⚡").join("")}
              <br />
              Type: <span className="uppercase font-bold text-primary">{selectedNode?.type}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted/50 p-4 rounded-xl">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                Targets:
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedNode?.aiTags?.map(tag => (
                  <span key={tag} className="bg-background border border-border px-2 py-1 rounded-md text-sm capitalize">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              size="lg" 
              className="w-full rounded-xl text-lg font-bold" 
              onClick={handleStartWorkout}
              disabled={startingNode}
            >
              {startingNode ? "Preparing..." : "Start Workout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
