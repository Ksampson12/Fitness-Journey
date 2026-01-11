import { Link, useLocation } from "wouter";
import { Map, Dumbbell, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const links = [
    { href: "/", icon: Map, label: "Journey" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/5 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {links.map((link) => {
          const isActive = location === link.href;
          const Icon = link.icon;
          
          return (
            <Link 
              key={link.href} 
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full space-y-1 transition-all duration-300",
                isActive ? "text-primary scale-110" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "w-6 h-6",
                  isActive && "drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="text-[10px] font-bold tracking-wider">{link.label}</span>
              {isActive && (
                <div className="absolute -bottom-[1px] w-8 h-1 bg-primary rounded-t-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
