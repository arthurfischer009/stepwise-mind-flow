import { Trophy } from "lucide-react";
import { ACHIEVEMENTS, getRarityColor } from "@/lib/achievements";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface AchievementsPanelProps {
  unlockedAchievements: string[];
}

export const AchievementsPanel = ({ unlockedAchievements }: AchievementsPanelProps) => {
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const progress = (unlockedCount / totalAchievements) * 100;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 relative">
          <Trophy className="w-4 h-4" />
          <span className="hidden sm:inline">Achievements</span>
          <Badge variant="secondary" className="ml-1">
            {unlockedCount}/{totalAchievements}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Achievements
          </DialogTitle>
        </DialogHeader>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {unlockedCount} / {totalAchievements}
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-3">
          {ACHIEVEMENTS.map((achievement) => {
            const isUnlocked = unlockedAchievements.includes(achievement.key);
            const Icon = achievement.icon;
            
            return (
              <Card 
                key={achievement.key}
                className={`p-4 transition-all ${
                  isUnlocked 
                    ? 'border-2 opacity-100' 
                    : 'opacity-40 grayscale'
                }`}
                style={isUnlocked ? { 
                  borderColor: achievement.color,
                  backgroundColor: `${achievement.color}08`
                } : {}}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      isUnlocked ? '' : 'bg-muted'
                    }`}
                    style={isUnlocked ? { 
                      backgroundColor: achievement.color 
                    } : {}}
                  >
                    <Icon className={`w-5 h-5 ${isUnlocked ? 'text-white' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold">{achievement.title}</span>
                      {isUnlocked && <span className="text-xl">✓</span>}
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {achievement.description}
                    </div>
                    <Badge 
                      variant="outline"
                      className="text-xs"
                      style={isUnlocked ? { 
                        borderColor: achievement.color,
                        color: achievement.color
                      } : {}}
                    >
                      {achievement.rarity.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
