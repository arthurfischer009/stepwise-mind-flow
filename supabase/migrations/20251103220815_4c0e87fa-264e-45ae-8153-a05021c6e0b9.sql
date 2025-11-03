-- Create table to track tasks carried over to next day
CREATE TABLE IF NOT EXISTS public.carried_over_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  task_category TEXT,
  task_points INTEGER DEFAULT 1,
  original_time_period TEXT NOT NULL,
  lock_in_session_id TEXT,
  carried_over_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  original_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carried_over_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own carried over tasks"
  ON public.carried_over_tasks
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own carried over tasks"
  ON public.carried_over_tasks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add index for performance
CREATE INDEX idx_carried_over_tasks_user_date 
  ON public.carried_over_tasks(user_id, original_date);