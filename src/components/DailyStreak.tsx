import { useState, useEffect } from "react";
import { Flame, Gift, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playStreakMilestone, playXPGain } from "@/lib/sounds";
import { triggerAchievementConfetti } from "@/lib/confetti";

interface DailyStreakProps {
  userId: string;
  onBonusClaimed: () => void;
}

interface UserStats {
  login_streak: number;
  longest_streak: number;
  total_logins: number;
  streak_bonus_claimed_today: boolean;
  last_login_date: string;
}

export const DailyStreak = ({ userId, onBonusClaimed }: DailyStreakProps) => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadAndUpdateStreak();
    }
  }, [userId]);

  const loadAndUpdateStreak = async () => {
    try {
      const { data: existingStats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const today = new Date().toISOString().split('T')[0];

      if (!existingStats) {
        // First login
        const { data: newStats, error: insertError } = await supabase
          .from('user_stats')
          .insert({
            user_id: userId,
            last_login_date: today,
            login_streak: 1,
            longest_streak: 1,
            total_logins: 1,
            streak_bonus_claimed_today: false
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setStats(newStats);
        
        toast({
          title: "🎉 Welcome!",
          description: "Your journey begins! Come back tomorrow to build your streak.",
        });
      } else {
        const lastLogin = existingStats.last_login_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastLogin === today) {
          // Already logged in today
          setStats(existingStats);
        } else if (lastLogin === yesterdayStr) {
          // Consecutive day
          const newStreak = existingStats.login_streak + 1;
          const { data: updatedStats, error: updateError } = await supabase
            .from('user_stats')
            .update({
              last_login_date: today,
              login_streak: newStreak,
              longest_streak: Math.max(newStreak, existingStats.longest_streak),
              total_logins: existingStats.total_logins + 1,
              streak_bonus_claimed_today: false
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) throw updateError;
          setStats(updatedStats);

          // Celebrate streak
          playStreakMilestone(newStreak);
          if (newStreak % 7 === 0) {
            triggerAchievementConfetti('hsl(48, 96%, 53%)');
          }

          toast({
            title: `🔥 ${newStreak} Day Streak!`,
            description: `Amazing! Claim your bonus ${newStreak} XP!`,
          });
        } else {
          // Streak broken
          const { data: resetStats, error: resetError } = await supabase
            .from('user_stats')
            .update({
              last_login_date: today,
              login_streak: 1,
              total_logins: existingStats.total_logins + 1,
              streak_bonus_claimed_today: false
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (resetError) throw resetError;
          setStats(resetStats);

          if (existingStats.login_streak > 3) {
            toast({
              title: "💔 Streak Reset",
              description: `Your ${existingStats.login_streak} day streak ended. Start fresh today!`,
              variant: "destructive",
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error managing streak:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimBonus = async () => {
    if (!stats || stats.streak_bonus_claimed_today) return;

    try {
      const bonusXP = stats.login_streak;
      
      const { error } = await supabase
        .from('user_stats')
        .update({ streak_bonus_claimed_today: true })
        .eq('user_id', userId);

      if (error) throw error;

      setStats({ ...stats, streak_bonus_claimed_today: true });
      playXPGain();
      triggerAchievementConfetti('hsl(221, 83%, 53%)');
      
      toast({
        title: `+${bonusXP} Bonus XP Claimed! 🎁`,
        description: `Keep your streak going tomorrow for +${bonusXP + 1} XP!`,
      });

      onBonusClaimed();
    } catch (error: any) {
      console.error('Error claiming bonus:', error);
      toast({
        title: "Error",
        description: "Failed to claim bonus",
        variant: "destructive",
      });
    }
  };

  if (loading || !stats) return null;

  const bonusXP = stats.login_streak;
  const isWeekMilestone = stats.login_streak % 7 === 0 && stats.login_streak > 0;

  return (
    <div className="rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/30 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Daily Streak</h3>
            <p className="text-sm text-muted-foreground">
              Keep the fire burning! 🔥
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-orange-500">{stats.login_streak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-card/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">{stats.longest_streak}</div>
          <div className="text-xs text-muted-foreground">Best Streak</div>
        </div>
        <div className="bg-card/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-secondary">{stats.total_logins}</div>
          <div className="text-xs text-muted-foreground">Total Days</div>
        </div>
      </div>

      {!stats.streak_bonus_claimed_today && (
        <Button
          onClick={claimBonus}
          className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold gap-2"
          size="lg"
        >
          <Gift className="w-5 h-5" />
          Claim +{bonusXP} Bonus XP
          <Zap className="w-5 h-5" />
        </Button>
      )}

      {stats.streak_bonus_claimed_today && (
        <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center text-sm">
          ✅ Bonus claimed! Come back tomorrow for +{bonusXP + 1} XP
        </div>
      )}

      {isWeekMilestone && (
        <div className="mt-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3 text-center text-sm animate-pulse">
          🌟 Week Milestone! You're on fire! 🌟
        </div>
      )}
    </div>
  );
};
