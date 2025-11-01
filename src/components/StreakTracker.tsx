import { useEffect, useState } from "react";
import { Flame, Gift, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { triggerAchievementConfetti } from "@/lib/confetti";
import { playStreakMilestone } from "@/lib/sounds";

interface UserStats {
  login_streak: number;
  longest_streak: number;
  streak_bonus_claimed_today: boolean;
  last_login_date: string;
}

interface StreakTrackerProps {
  userId: string;
  onBonusClaimed?: (bonusXP: number) => void;
}

export const StreakTracker = ({ userId, onBonusClaimed }: StreakTrackerProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAndUpdateStreak();
  }, [userId]);

  const loadAndUpdateStreak = async () => {
    try {
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      const today = new Date().toISOString().split('T')[0];

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (!existingStats) {
        // First time user
        const { data: newStats, error: insertError } = await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            last_login_date: today,
            login_streak: 1,
            longest_streak: 1,
            total_logins: 1,
            streak_bonus_claimed_today: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setStats(newStats);
      } else {
        const lastLogin = new Date(existingStats.last_login_date);
        const todayDate = new Date(today);
        const daysDiff = Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 0) {
          // Same day login
          setStats(existingStats);
        } else if (daysDiff === 1) {
          // Consecutive day - increment streak
          const newStreak = existingStats.login_streak + 1;
          const { data: updatedStats, error: updateError } = await supabase
            .from('user_stats')
            .update({
              last_login_date: today,
              login_streak: newStreak,
              longest_streak: Math.max(newStreak, existingStats.longest_streak),
              total_logins: existingStats.total_logins + 1,
              streak_bonus_claimed_today: false,
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) throw updateError;
          setStats(updatedStats);

          // Celebrate streak milestones
          if (newStreak % 7 === 0) {
            triggerAchievementConfetti('#FF6B35');
            playStreakMilestone(newStreak);
            toast({
              title: `🔥 ${newStreak} Day Streak!`,
              description: "You're on fire! Keep the momentum going!",
            });
          }
        } else {
          // Streak broken
          const { data: updatedStats, error: updateError } = await supabase
            .from('user_stats')
            .update({
              last_login_date: today,
              login_streak: 1,
              total_logins: existingStats.total_logins + 1,
              streak_bonus_claimed_today: false,
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) throw updateError;
          setStats(updatedStats);

          if (existingStats.login_streak > 3) {
            toast({
              title: "Streak Reset",
              description: `Your ${existingStats.login_streak}-day streak ended. Start fresh today!`,
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error('Error managing streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    if (!stats || stats.streak_bonus_claimed_today) return;

    const bonusXP = Math.min(stats.login_streak * 5, 50);

    try {
      const { error } = await supabase
        .from('user_stats')
        .update({ streak_bonus_claimed_today: true })
        .eq('user_id', userId);

      if (error) throw error;

      setStats({ ...stats, streak_bonus_claimed_today: true });
      triggerAchievementConfetti('#FFD700');
      
      toast({
        title: `+${bonusXP} Bonus XP! 🎁`,
        description: `${stats.login_streak}-day streak bonus claimed!`,
      });

      onBonusClaimed?.(bonusXP);
    } catch (error) {
      console.error('Error claiming bonus:', error);
      toast({
        title: "Error",
        description: "Failed to claim bonus",
        variant: "destructive",
      });
    }
  };

  if (loading || !stats) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Daily Streak</h3>
            <p className="text-sm text-muted-foreground">Keep it going!</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
            {stats.login_streak}
          </div>
          <p className="text-xs text-muted-foreground">days</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Best Streak</span>
          </div>
          <div className="text-2xl font-bold">{stats.longest_streak}</div>
        </div>
        
        <div className="bg-background/50 rounded-lg p-3 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Bonus XP</span>
          </div>
          <div className="text-2xl font-bold text-yellow-500">
            +{Math.min(stats.login_streak * 5, 50)}
          </div>
        </div>
      </div>

      {!stats.streak_bonus_claimed_today && (
        <Button 
          onClick={claimBonus}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
        >
          <Gift className="w-4 h-4 mr-2" />
          Claim Daily Bonus
        </Button>
      )}

      {stats.streak_bonus_claimed_today && (
        <div className="text-center py-2 text-sm text-muted-foreground">
          ✓ Bonus claimed! Come back tomorrow
        </div>
      )}
    </div>
  );
};
