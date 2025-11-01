-- Create user_stats table to track habits and streaks
CREATE TABLE IF NOT EXISTS public.user_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  last_login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  login_streak INTEGER NOT NULL DEFAULT 1,
  longest_streak INTEGER NOT NULL DEFAULT 1,
  total_logins INTEGER NOT NULL DEFAULT 1,
  streak_bonus_claimed_today BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own stats"
ON public.user_stats FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
ON public.user_stats FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
ON public.user_stats FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create daily_challenges table
CREATE TABLE IF NOT EXISTS public.daily_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  challenge_type TEXT NOT NULL,
  challenge_title TEXT NOT NULL,
  challenge_description TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  current_count INTEGER NOT NULL DEFAULT 0,
  bonus_xp INTEGER NOT NULL DEFAULT 10,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own challenges"
ON public.daily_challenges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
ON public.daily_challenges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
ON public.daily_challenges FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_stats_updated_at
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_daily_challenges_updated_at
BEFORE UPDATE ON public.daily_challenges
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();