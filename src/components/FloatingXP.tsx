import { useEffect, useState } from "react";
import { Star, Sparkles } from "lucide-react";

interface FloatingXPProps {
  xp: number;
  multiplier?: number;
  onComplete: () => void;
}

export const FloatingXP = ({ xp, multiplier = 1, onComplete }: FloatingXPProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 50);
    
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 1500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const totalXP = Math.round(xp * multiplier);
  const isBonus = multiplier > 1;

  return (
    <div 
      className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] transition-all duration-300 pointer-events-none ${
        visible ? 'opacity-100 scale-100 -translate-y-20' : 'opacity-0 scale-50'
      }`}
    >
      <div className="relative">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 blur-2xl opacity-60 animate-pulse"
          style={{
            background: isBonus 
              ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' 
              : 'hsl(48, 96%, 53%)'
          }}
        />
        
        {/* XP display */}
        <div className="relative flex items-center gap-2 bg-card/90 backdrop-blur-sm border-2 rounded-2xl px-6 py-3 shadow-2xl"
          style={{
            borderColor: isBonus ? 'hsl(var(--primary))' : 'hsl(48, 96%, 53%)'
          }}
        >
          {isBonus ? (
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          ) : (
            <Star className="w-6 h-6 text-yellow-500" />
          )}
          <div className="text-3xl font-bold"
            style={{
              color: isBonus ? 'hsl(var(--primary))' : 'hsl(48, 96%, 53%)'
            }}
          >
            +{totalXP} XP
          </div>
          {isBonus && (
            <div className="text-sm font-bold text-primary">
              ({multiplier}x)
            </div>
          )}
        </div>

        {/* Particle effects */}
        {isBonus && (
          <>
            <Star className="absolute -top-4 -left-4 w-4 h-4 text-yellow-500 animate-ping" />
            <Star className="absolute -top-2 -right-4 w-3 h-3 text-primary animate-ping" style={{ animationDelay: '0.2s' }} />
            <Star className="absolute -bottom-2 -left-2 w-3 h-3 text-accent animate-ping" style={{ animationDelay: '0.4s' }} />
          </>
        )}
      </div>
    </div>
  );
};
