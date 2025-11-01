import { useState, useEffect } from "react";
import { Target, Trophy, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playAchievementUnlock } from "@/lib/sounds";
import { triggerAchievementConfetti } from "@/lib/confetti";

interface DailyChallengeProps {
  userId: string;
  completedToday: number;
}

interface Challenge {
  id: string;
  challenge_type: string;
  challenge_title: string;
  challenge_description: string;
  target_count: number;
  current_count: number;
  bonus_xp: number;
  completed: boolean;
}

const CHALLENGE_TYPES = [
  {
    type: 'complete_tasks',
    getTitle: (count: number) => `Complete ${count} Tasks`,
    getDescription: (count: number) => `Finish ${count} tasks today to earn bonus XP`,
    minTarget: 3,
    maxTarget: 7,
    baseXP: 15,
  },
  {
    type: 'complete_priority',
    getTitle: (count: number) => `Complete ${count} Priority Tasks`,
    getDescription: (count: number) => `Focus on your priority tasks and complete ${count} of them`,
    minTarget: 2,
    maxTarget: 4,
    baseXP: 20,
  },
  {
    type: 'early_start',
    getTitle: () => 'Early Bird',
    getDescription: () => 'Complete your first task before noon',
    minTarget: 1,
    maxTarget: 1,
    baseXP: 10,
  },
];

export const DailyChallenge = ({ userId, completedToday }: DailyChallengeProps) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadOrCreateChallenge();
    }
  }, [userId]);

  useEffect(() => {
    if (challenge && !challenge.completed) {
      checkChallengeProgress();
    }
  }, [completedToday, challenge]);

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
        // Generate new challenge
        const challengeTemplate = CHALLENGE_TYPES[Math.floor(Math.random() * CHALLENGE_TYPES.length)];
        const targetCount = Math.floor(
          Math.random() * (challengeTemplate.maxTarget - challengeTemplate.minTarget + 1) + challengeTemplate.minTarget
        );

        const { data: newChallenge, error: insertError } = await supabase
          .from('daily_challenges')
          .insert({
            user_id: userId,
            challenge_date: today,
            challenge_type: challengeTemplate.type,
            challenge_title: challengeTemplate.getTitle(targetCount),
            challenge_description: challengeTemplate.getDescription(targetCount),
            target_count: targetCount,
            current_count: 0,
            bonus_xp: challengeTemplate.baseXP + (targetCount * 2),
            completed: false
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setChallenge(newChallenge);

        toast({
          title: "🎯 New Daily Challenge!",
          description: newChallenge.challenge_title,
        });
      }
    } catch (error: any) {
      console.error('Error loading challenge:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkChallengeProgress = async () => {
    if (!challenge || challenge.completed) return;

    const newCount = completedToday;
    
    if (newCount !== challenge.current_count) {
      try {
        const isComplete = newCount >= challenge.target_count;

        const { data: updated, error } = await supabase
          .from('daily_challenges')
          .update({
            current_count: newCount,
            completed: isComplete,
            completed_at: isComplete ? new Date().toISOString() : null
          })
          .eq('id', challenge.id)
          .select()
          .single();

        if (error) throw error;
        setChallenge(updated);

        if (isComplete && !challenge.completed) {
          playAchievementUnlock('epic');
          triggerAchievementConfetti('hsl(262, 83%, 58%)');
          
          toast({
            title: `🏆 Challenge Complete! +${challenge.bonus_xp} XP`,
            description: "Amazing work! New challenge tomorrow!",
          });
        }
      } catch (error: any) {
        console.error('Error updating challenge:', error);
      }
    }
  };

  if (loading || !challenge) return null;

  const progress = Math.min((challenge.current_count / challenge.target_count) * 100, 100);

  return (
    <div className={`rounded-2xl border-2 p-6 animate-fade-in transition-all ${
      challenge.completed 
        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
        : 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            challenge.completed 
              ? 'bg-gradient-to-br from-purple-500 to-pink-600' 
              : 'bg-gradient-to-br from-blue-500 to-cyan-600'
          }`}>
            {challenge.completed ? (
              <Trophy className="w-6 h-6 text-white" />
            ) : (
              <Target className="w-6 h-6 text-white" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">{challenge.challenge_title}</h3>
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <p className="text-sm text-muted-foreground">
              {challenge.challenge_description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-500">+{challenge.bonus_xp}</div>
          <div className="text-xs text-muted-foreground">Bonus XP</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-bold">
            {challenge.current_count} / {challenge.target_count}
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </div>

      {challenge.completed && (
        <div className="mt-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3 text-center text-sm font-bold animate-pulse">
          ✅ Challenge Completed! Come back tomorrow for a new one!
        </div>
      )}
    </div>
  );
};
