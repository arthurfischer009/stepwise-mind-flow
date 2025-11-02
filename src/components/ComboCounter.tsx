import { useEffect, useState } from "react";
import { Zap, Flame } from "lucide-react";

interface ComboCounterProps {
  combo: number;
  multiplier: number;
  onExpire: () => void;
}

export const ComboCounter = ({ combo, multiplier, onExpire }: ComboCounterProps) => {
  const [timeLeft, setTimeLeft] = useState(100);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (combo === 0) {
      setVisible(false);
      return;
    }

    setVisible(true);
    setTimeLeft(100);

    // 5 second timer
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const next = prev - 2;
        if (next <= 0) {
          clearInterval(interval);
          setTimeout(() => {
            setVisible(false);
            onExpire();
          }, 300);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [combo, onExpire]);

  if (!visible || combo === 0) return null;

  return (
    <div className="fixed top-24 right-4 z-50 animate-scale-in">
      <div className={`relative ${combo >= 5 ? 'animate-pulse' : ''}`}>
        <div 
          className="absolute inset-0 blur-xl opacity-50"
          style={{
            background: combo >= 10 
              ? 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))' 
              : combo >= 5 
              ? 'hsl(var(--primary))' 
              : 'hsl(var(--accent))'
          }}
        />
        <div className="relative bg-card border-2 rounded-2xl p-4 shadow-2xl backdrop-blur-sm"
          style={{
            borderColor: combo >= 10 
              ? 'hsl(var(--primary))' 
              : combo >= 5 
              ? 'hsl(var(--accent))' 
              : 'hsl(var(--border))'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              {combo >= 5 ? (
                <Flame className="w-8 h-8 text-orange-500 animate-pulse" />
              ) : (
                <Zap className="w-8 h-8 text-primary" />
              )}
            </div>
            <div>
              <div className="text-3xl font-bold text-foreground">
                {combo}x
              </div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide">
                Combo!
              </div>
            </div>
            {multiplier > 1 && (
              <div className="ml-2 px-2 py-1 rounded-lg bg-primary/20 text-primary text-sm font-bold">
                +{Math.round((multiplier - 1) * 100)}% XP
              </div>
            )}
          </div>
          <div className="mt-2 h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full transition-all duration-100 ease-linear"
              style={{ 
                width: `${timeLeft}%`,
                background: combo >= 10 
                  ? 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))' 
                  : combo >= 5 
                  ? 'hsl(var(--primary))' 
                  : 'hsl(var(--accent))'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
