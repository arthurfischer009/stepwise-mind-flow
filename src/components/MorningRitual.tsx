import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Flame, Star, Target, Sparkles, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MorningRitualProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStreak: number;
  todayTasksCount: number;
  yesterdayCompleted: number;
  level: number;
  dailyLoginBonus: number;
}

export const MorningRitual = ({
  open,
  onOpenChange,
  currentStreak,
  todayTasksCount,
  yesterdayCompleted,
  level,
  dailyLoginBonus,
}: MorningRitualProps) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const getMotivationalMessage = () => {
    if (currentStreak >= 7) return "Unglaublich! Deine Streak ist on fire! 🔥";
    if (currentStreak >= 3) return "Du bist auf einem großartigen Weg!";
    if (yesterdayCompleted >= 5) return "Gestern warst du produktiv - lass uns weitermachen!";
    return "Heute ist der perfekte Tag für einen Neustart!";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-2 border-primary/20 bg-gradient-to-br from-background via-background to-primary/5">
        <DialogHeader>
          <DialogTitle className="text-2xl text-center flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
            {getGreeting()}!
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Daily Login Bonus */}
          <div className="text-center p-6 rounded-xl bg-primary/10 border-2 border-primary/30 animate-scale-in">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-8 h-8 text-yellow-500 animate-pulse" />
              <span className="text-3xl font-bold text-primary">+{dailyLoginBonus} XP</span>
            </div>
            <p className="text-sm text-muted-foreground">Daily Login Bonus erhalten!</p>
          </div>

          {/* Motivational Message */}
          <div className="text-center">
            <p className="text-lg font-medium">{getMotivationalMessage()}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-lg bg-card border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Flame className={`w-5 h-5 ${currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <span className="text-2xl font-bold">{currentStreak}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tage Streak</p>
            </div>

            <div className="p-4 rounded-lg bg-card border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-2xl font-bold">Level {level}</span>
              </div>
              <p className="text-xs text-muted-foreground">Dein Level</p>
            </div>

            <div className="p-4 rounded-lg bg-card border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="w-5 h-5 text-accent" />
                <span className="text-2xl font-bold">{todayTasksCount}</span>
              </div>
              <p className="text-xs text-muted-foreground">Tasks heute</p>
            </div>

            <div className="p-4 rounded-lg bg-card border text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-2xl font-bold">{yesterdayCompleted}</span>
              </div>
              <p className="text-xs text-muted-foreground">Gestern erledigt</p>
            </div>
          </div>

          {/* Call to Action */}
          <Button
            onClick={() => onOpenChange(false)}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            <Target className="w-5 h-5 mr-2" />
            Let's start your day!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
