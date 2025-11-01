-- Create achievements table to track user progress
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Enable Row Level Security
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Create policies for achievements
CREATE POLICY "Users can view their own achievements" 
ON public.achievements 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own achievements" 
ON public.achievements 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add index for better performance
CREATE INDEX idx_achievements_user_id ON public.achievements(user_id);
CREATE INDEX idx_achievements_achievement_key ON public.achievements(achievement_key);