import { Trophy, TrendingUp } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { Progress } from "@/components/ui/progress";

interface AchievementProgressProps {
  totalCompleted: number;
  currentStreak: number;
  totalPoints: number;
  completedToday: number;
  categories: string[];
  unlockedAchievements: string[];
}

export const AchievementProgress = ({
  totalCompleted,
  currentStreak,
  totalPoints,
  completedToday,
  categories,
  unlockedAchievements,
}: AchievementProgressProps) => {
  // Find next achievable achievements
  const checkData = { totalCompleted, currentStreak, totalPoints, completedToday, categories };
  
  const nextAchievements = ACHIEVEMENTS
    .filter(achievement => !unlockedAchievements.includes(achievement.key))
    .map(achievement => {
      // Try to calculate progress for numeric achievements
      let progress = 0;
      let target = 0;
      let current = 0;
      
      if (achievement.key.includes('task') && achievement.key.includes('master')) {
        target = parseInt(achievement.key.match(/\d+/)?.[0] || '0');
        current = totalCompleted;
        progress = Math.min((current / target) * 100, 100);
      } else if (achievement.key.includes('streak')) {
        target = parseInt(achievement.key.match(/\d+/)?.[0] || '0');
        current = currentStreak;
        progress = Math.min((current / target) * 100, 100);
      } else if (achievement.key.includes('points')) {
        const match = achievement.key.match(/\d+/);
        target = match ? parseInt(match[0]) * 1000 : 0;
        current = totalPoints;
        progress = Math.min((current / target) * 100, 100);
      } else if (achievement.key.includes('daily') && achievement.key.includes('warrior')) {
        target = parseInt(achievement.key.match(/\d+/)?.[0] || '0');
        current = completedToday;
        progress = Math.min((current / target) * 100, 100);
      }
      
      return {
        achievement,
        progress,
        target,
        current,
        canShow: target > 0 && current > 0 && progress > 0 && progress < 100
      };
    })
    .filter(item => item.canShow)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 2);

  if (nextAchievements.length === 0) return null;

  return (
    <div className="rounded-xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Next Achievements</h3>
      </div>
      
      <div className="space-y-3">
        {nextAchievements.map(({ achievement, progress, current, target }) => {
          const Icon = achievement.icon;
          return (
            <div key={achievement.key} className="space-y-2">
              <div className="flex items-center gap-2">
                <div 
                  className="p-1.5 rounded-lg flex-shrink-0"
                  style={{ backgroundColor: `${achievement.color}20` }}
                >
                  <Icon className="w-3 h-3" style={{ color: achievement.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{achievement.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {current} / {target}
                  </div>
                </div>
                <div className="text-xs font-bold" style={{ color: achievement.color }}>
                  {Math.round(progress)}%
                </div>
              </div>
              <Progress 
                value={progress} 
                className="h-1.5"
                style={{
                  ['--progress-background' as string]: achievement.color
                } as React.CSSProperties}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
