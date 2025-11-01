import { Achievement } from "@/lib/achievements";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

interface AchievementNotificationProps {
  achievement: Achievement;
  onClose: () => void;
}

export const AchievementNotification = ({ achievement, onClose }: AchievementNotificationProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setVisible(true), 100);
    
    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const Icon = achievement.icon;

  return (
    <div 
      className={`fixed top-20 right-4 z-[100] transition-all duration-300 ${
        visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Card 
        className="p-4 w-80 border-2 shadow-2xl animate-bounce"
        style={{ 
          borderColor: achievement.color,
          backgroundColor: `${achievement.color}10`
        }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: achievement.color }}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
              🎉 Achievement Unlocked!
            </div>
            <div className="font-bold text-foreground mb-1">{achievement.title}</div>
            <div className="text-sm text-muted-foreground">{achievement.description}</div>
            <div 
              className="text-xs font-bold uppercase mt-2 inline-block px-2 py-0.5 rounded"
              style={{ 
                color: achievement.color,
                backgroundColor: `${achievement.color}20`
              }}
            >
              {achievement.rarity}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
