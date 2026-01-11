import { useUserProfile } from "@/hooks/use-user";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { isToday } from "date-fns";
import { MessageCircle } from "lucide-react";

// Simple SVG placeholders for Shark and Dolphin
// In a real app, these would be Lottie animations or detailed illustrations

const SharkAvatar = ({ isHappy }: { isHappy: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
    <motion.g
      animate={{ y: isHappy ? [0, -5, 0] : 0 }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
    >
      {/* Fin */}
      <path d="M50 20 L60 40 L40 40 Z" fill="#64748b" />
      {/* Body */}
      <ellipse cx="50" cy="50" rx="35" ry="25" fill="#94a3b8" />
      {/* Eye */}
      <circle cx="65" cy="45" r="3" fill="black" />
      {/* Mouth */}
      {isHappy ? (
        <path d="M55 55 Q65 65 75 55" stroke="white" strokeWidth="3" fill="none" />
      ) : (
        <path d="M60 55 L70 55" stroke="black" strokeWidth="2" />
      )}
      {/* Zzz for tired */}
      {!isHappy && (
        <motion.g
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], x: 10, y: -10 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <text x="75" y="30" fontSize="12" fill="white">z</text>
          <text x="80" y="25" fontSize="10" fill="white">z</text>
        </motion.g>
      )}
    </motion.g>
  </svg>
);

const DolphinAvatar = ({ isHappy }: { isHappy: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
    <motion.g
      animate={{ 
        y: isHappy ? [0, -8, 0] : 0,
        rotate: isHappy ? [0, 5, 0] : 0
      }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
    >
      {/* Body */}
      <path d="M20 50 Q50 20 80 50 Q50 80 20 50" fill="#0ea5e9" />
      {/* Fin */}
      <path d="M50 25 L40 45 L60 45 Z" fill="#0284c7" />
      {/* Eye */}
      <circle cx="65" cy="45" r="3" fill="black" />
       {/* Mouth */}
      {isHappy ? (
        <path d="M60 55 Q70 60 75 52" stroke="white" strokeWidth="2" fill="none" />
      ) : (
        <circle cx="70" cy="55" r="2" fill="black" />
      )}
      {!isHappy && (
        <motion.g
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: 1 }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <text x="80" y="30" fontSize="14" fill="white">...</text>
        </motion.g>
      )}
    </motion.g>
  </svg>
);

export function AvatarOverlay() {
  const { data: profile } = useUserProfile();
  const [message, setMessage] = useState<string | null>(null);

  if (!profile) return null;

  const isActiveToday = profile.lastActiveDate 
    ? isToday(new Date(profile.lastActiveDate))
    : false;
  
  const archetype = profile.avatarArchetype || "shark";
  const messages = isActiveToday 
    ? ["Great job today!", "You're crushing it!", "Keep making waves!"]
    : ["Time to dive in?", "The ocean misses you!", "Let's get moving!"];

  const handleClick = () => {
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setMessage(randomMsg);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className="mb-2 mr-4 bg-white dark:bg-slate-800 text-foreground px-4 py-2 rounded-2xl rounded-tr-none shadow-lg border border-border flex items-center gap-2 max-w-[200px]"
          >
            <MessageCircle className="w-4 h-4 text-primary shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="relative w-24 h-24 md:w-32 md:h-32 cursor-pointer pointer-events-auto hover:scale-105 transition-transform"
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
      >
        {archetype === "dolphin" ? (
          <DolphinAvatar isHappy={isActiveToday} />
        ) : (
          <SharkAvatar isHappy={isActiveToday} />
        )}
        
        {/* Status Indicator */}
        <div className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-white ${isActiveToday ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
      </motion.div>
    </div>
  );
}
