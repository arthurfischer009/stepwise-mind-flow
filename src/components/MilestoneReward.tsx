import { useEffect, useState } from "react";
import { Trophy, Sparkles, Zap } from "lucide-react";

interface MilestoneRewardProps {
  level: number;
  onClose: () => void;
}

export const MilestoneReward = ({ level, onClose }: MilestoneRewardProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 500);
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const isMajorMilestone = level % 50 === 0;
  const isSignificantMilestone = level % 25 === 0;
  const bonusXP = isMajorMilestone ? 100 : isSignificantMilestone ? 50 : 25;

  return (
    <div 
      className={`fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className={`relative transition-all duration-500 ${
        visible ? 'scale-100 translate-y-0' : 'scale-75 translate-y-10'
      }`}>
        {/* Animated glow rings */}
        <div className="absolute inset-0 animate-ping">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-secondary opacity-30 blur-2xl" />
        </div>
        
        {/* Main content */}
        <div className="relative bg-card border-2 border-primary rounded-3xl p-8 shadow-2xl max-w-md">
          {/* Floating particles */}
          <div className="absolute -top-4 -left-4">
            <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
          </div>
          <div className="absolute -top-4 -right-4">
            <Sparkles className="w-8 h-8 text-primary animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
          <div className="absolute -bottom-4 -left-4">
            <Zap className="w-8 h-8 text-accent animate-pulse" style={{ animationDelay: '0.6s' }} />
          </div>
          <div className="absolute -bottom-4 -right-4">
            <Zap className="w-8 h-8 text-yellow-400 animate-pulse" style={{ animationDelay: '0.9s' }} />
          </div>

          {/* Trophy icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-50 bg-gradient-to-r from-primary via-accent to-yellow-400 animate-pulse" />
              <div className="relative bg-gradient-to-br from-primary to-accent p-6 rounded-full">
                <Trophy className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Text content */}
          <div className="text-center space-y-2">
            <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-accent to-yellow-400">
              🎉 MILESTONE REACHED! 🎉
            </div>
            <div className="text-4xl font-black text-foreground">
              LEVEL {level}
            </div>
            <div className="text-sm text-muted-foreground">
              {isMajorMilestone 
                ? "LEGENDARY ACHIEVEMENT!" 
                : isSignificantMilestone 
                ? "Incredible Progress!" 
                : "Keep up the amazing work!"}
            </div>
            
            {/* Bonus XP */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-yellow-400/10 border border-primary/20">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                Milestone Bonus
              </div>
              <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                +{bonusXP} XP
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
