-- Create lock_in_sessions table
CREATE TABLE IF NOT EXISTS public.lock_in_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lock_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_count INTEGER NOT NULL DEFAULT 0,
  tasks_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lock_in_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own lock-in sessions"
ON public.lock_in_sessions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lock-in sessions"
ON public.lock_in_sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create deleted_tasks_log table
CREATE TABLE IF NOT EXISTS public.deleted_tasks_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  penalty_points INTEGER NOT NULL DEFAULT 0,
  was_locked_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.deleted_tasks_log ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own deleted tasks log"
ON public.deleted_tasks_log
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deleted tasks log"
ON public.deleted_tasks_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create task_timers table
CREATE TABLE IF NOT EXISTS public.task_timers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id UUID NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  overrun_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_timers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own task timers"
ON public.task_timers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own task timers"
ON public.task_timers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task timers"
ON public.task_timers
FOR UPDATE
USING (auth.uid() = user_id);

-- Create daily_metrics table
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  commitment_rate NUMERIC(5,2) DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_planned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

-- Enable RLS
ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own daily metrics"
ON public.daily_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own daily metrics"
ON public.daily_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily metrics"
ON public.daily_metrics
FOR UPDATE
USING (auth.uid() = user_id);