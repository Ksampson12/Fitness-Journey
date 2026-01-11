import { GameNode } from "@shared/schema";
import { motion } from "framer-motion";
import { Lock, Check, Star } from "lucide-react";
import clsx from "clsx";

interface MapNodeProps {
  node: GameNode;
  status: "locked" | "unlocked" | "completed";
  onClick: (nodeId: string) => void;
  active?: boolean;
}

export function MapNode({ node, status, onClick, active }: MapNodeProps) {
  return (
    <motion.button
      onClick={() => status !== "locked" && onClick(node.id)}
      className={clsx(
        "absolute w-16 h-28 transform -translate-x-1/2 -translate-y-1/2",
        "flex flex-col items-center justify-center",
        "transition-all duration-300 group focus:outline-none"
      )}
      style={{ left: node.x, top: node.y }}
      whileHover={status !== "locked" ? { scale: 1.1, rotate: 2 } : {}}
      whileTap={status !== "locked" ? { scale: 0.95 } : {}}
    >
      {/* Surfboard Shape */}
      <div 
        className={clsx(
          "w-12 h-24 clip-surfboard shadow-lg relative border-2",
          status === "locked" && "bg-slate-200 dark:bg-slate-800 border-slate-400 grayscale",
          status === "unlocked" && "bg-gradient-to-b from-yellow-300 to-orange-400 border-yellow-500 animate-pulse-slow",
          status === "completed" && "bg-gradient-to-b from-primary to-blue-600 border-blue-400",
          active && "ring-4 ring-white ring-opacity-50"
        )}
      >
        {/* Pattern/Icon inside */}
        <div className="absolute inset-0 flex items-center justify-center text-white/90">
          {status === "locked" && <Lock className="w-5 h-5 text-slate-400" />}
          {status === "completed" && <Check className="w-6 h-6 stroke-[3]" />}
          {status === "unlocked" && <Star className="w-6 h-6 fill-white" />}
        </div>
        
        {/* Stringer (surfboard center line) */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-black/10 -translate-x-1/2" />
      </div>

      {/* Label */}
      <div 
        className={clsx(
          "mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm",
          status === "locked" ? "bg-slate-100 text-slate-400" : "bg-white text-foreground"
        )}
      >
        {node.name}
      </div>
    </motion.button>
  );
}
