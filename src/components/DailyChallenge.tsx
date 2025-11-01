import { useEffect, useState } from "react";
import { Target, Trophy, CheckCircle2, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { triggerLevelUpConfetti } from "@/lib/confetti";
import { playAchievementUnlock } from "@/lib/sounds";

interface DailyChallenge {
  id: string;
  challenge_type: string;
  challenge_title: string;
  challenge_description: string;
  target_count: number;
  current_count: number;
  bonus_xp: number;
  completed: boolean;
  completed_at?: string;
}

interface DailyChallengeProps {
  userId: string;
  completedToday: number;
}

const CHALLENGE_TEMPLATES = [
  {
    type: "complete_tasks",
    title: "Speed Runner",
    description: "Complete 5 tasks today",
    target: 5,
    bonus: 25,
  },
  {
    type: "complete_tasks",
    title: "Productivity Beast",
    description: "Complete 8 tasks today",
    target: 8,
    bonus: 40,
  },
  {
    type: "complete_tasks",
    title: "Unstoppable",
    description: "Complete 10 tasks today",
    target: 10,
    bonus: 50,
  },
];

export const DailyChallenge = ({ userId, completedToday }: DailyChallengeProps) => {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadOrCreateChallenge();
    }
  }, [userId]);

  useEffect(() => {
    if (challenge && !challenge.completed && userId) {
      updateChallengeProgress();
    }
  }, [completedToday, challenge, userId]);

  const loadOrCreateChallenge = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data: existingChallenge, error: fetchError } = await supabase
        .from('daily_challenges')
        .select('*')
        .eq('user_id', userId)
        .eq('challenge_date', today)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingChallenge) {
        setChallenge(existingChallenge);
      } else {
        const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
        
        const { data: newChallenge, error: insertError } = await supabase
          .from('daily_challenges')
          .insert({
            user_id: userId,
            challenge_date: today,
            challenge_type: template.type,
            challenge_title: template.title,
            challenge_description: template.description,
            target_count: template.target,
            current_count: 0,
            bonus_xp: template.bonus,
            completed: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setChallenge(newChallenge);
      }
    } catch (error) {
      console.error('Error managing daily challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateChallengeProgress = async () => {
    if (!challenge || challenge.completed) return;

    const newCount = Math.min(completedToday, challenge.target_count);
    const justCompleted = newCount >= challenge.target_count && !challenge.completed;

    try {
      const updateData: any = {
        current_count: newCount,
      };

      if (justCompleted) {
        updateData.completed = true;
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updated, error } = await supabase
        .from('daily_challenges')
        .update(updateData)
        .eq('id', challenge.id)
        .select()
        .single();

      if (error) throw error;

      setChallenge(updated);

      if (justCompleted) {
        triggerLevelUpConfetti();
        playAchievementUnlock('legendary');
        toast({
          title: `🎉 Challenge Complete!`,
          description: `+${challenge.bonus_xp} Bonus XP earned!`,
        });
      }
    } catch (error) {
      console.error('Error updating challenge:', error);
    }
  };

  if (loading || !challenge || !userId) {
    return null;
  }

  const progress = (challenge.current_count / challenge.target_count) * 100;
  const timeLeft = new Date();
  timeLeft.setHours(29, 0, 0, 0);
  const hoursLeft = Math.max(0, Math.floor((timeLeft.getTime() - new Date().getTime()) / (1000 * 60 * 60)));

  return (
    <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            {challenge.completed ? (
              <Trophy className="w-6 h-6 text-white" />
            ) : (
              <Target className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold">{challenge.challenge_title}</h3>
            <p className="text-sm text-muted-foreground">{challenge.challenge_description}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-3xl font-bold text-yellow-500">
            +{challenge.bonus_xp}
          </div>
          <p className="text-xs text-muted-foreground">XP</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Progress: {challenge.current_count}/{challenge.target_count}
            </span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {hoursLeft}h left
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        {challenge.completed ? (
          <div className="flex items-center justify-center gap-2 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-green-500">Challenge Completed!</span>
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground">
            Complete {challenge.target_count - challenge.current_count} more task{challenge.target_count - challenge.current_count !== 1 ? 's' : ''} to unlock bonus
          </div>
        )}
      </div>
    </div>
  );
};
