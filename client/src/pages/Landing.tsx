import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Anchor } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-ocean-pattern relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Animated Background Elements */}
      <motion.div 
        className="absolute top-20 right-[-100px] w-64 h-64 bg-yellow-300 rounded-full blur-3xl opacity-20"
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div 
        className="absolute bottom-20 left-[-100px] w-80 h-80 bg-primary rounded-full blur-3xl opacity-20"
        animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary to-accent rounded-3xl flex items-center justify-center shadow-2xl mb-6 rotate-3">
            <Anchor className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-display font-bold text-foreground mb-4">
            Tidal Fit
          </h1>
          <p className="text-xl text-muted-foreground font-light leading-relaxed">
            Ride the wave of fitness. Turn your workouts into an ocean adventure.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="space-y-4"
        >
          <Button 
            size="lg" 
            className="w-full h-14 text-lg font-semibold rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:-translate-y-1 transition-all"
            onClick={() => window.location.href = "/api/login"}
          >
            Start Your Journey
          </Button>
          <p className="text-sm text-muted-foreground">
            Powered by Replit Auth
          </p>
        </motion.div>
      </div>
      
      {/* Decorative Wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden pointer-events-none">
         <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full h-full text-primary/10 fill-current">
            <path d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,128C960,139,1056,181,1152,186.7C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
         </svg>
      </div>
    </div>
  );
}
