import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Dumbbell, Play, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen-safe bg-background text-foreground flex flex-col relative overflow-hidden safe-area-all">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-primary/5 blur-[100px] rounded-full -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-full h-[500px] bg-secondary/5 blur-[100px] rounded-full translate-y-1/2 pointer-events-none" />

      {/* Hero Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/5 backdrop-blur-sm text-primary text-sm font-bold uppercase tracking-widest mb-4 shadow-[0_0_20px_inset_rgba(16,185,129,0.1)]">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            System Online
          </div>

          <h1 className="text-6xl md:text-8xl font-display font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/50 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            LEVEL UP <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">YOUR LIFE</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Transform your fitness journey into an RPG adventure. Complete workouts, 
            unlock new zones, and evolve your avatar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button size="lg" className="text-lg h-16 px-10" asChild data-testid="button-start-mission">
              <a href="/login">
                Start Mission <Play className="ml-2 w-5 h-5 fill-current" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg h-16 px-10" data-testid="button-demo">
              View Demo
            </Button>
          </div>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
          {[
            { icon: Dumbbell, title: "AI Workouts", desc: "Generated missions adapted to your gear and level." },
            { icon: Shield, title: "Progression", desc: "Earn XP and unlock new abilities as you get stronger." },
            { icon: Play, title: "Gamified Map", desc: "Explore diverse zones and conquer boss battles." },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-6 rounded-2xl bg-card/50 border border-white/5 backdrop-blur-sm hover:border-primary/30 transition-colors"
            >
              <feature.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
