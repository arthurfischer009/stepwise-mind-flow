-- ============================================
-- LOCK-IN & TIMER SYSTEM MIGRATION
-- ============================================
-- Features:
-- 1. Lock-In System - Freezes task list at a point in time
-- 2. Automatic Timers - 45min work + 15min break cycles
-- 3. Metrics Tracking - Commitment rate, overruns, deletions
-- 4. Push Notifications - Hourly reminders
-- ============================================

-- Add timer and duration fields to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS estimated_duration INTEGER DEFAULT 60, -- minutes (based on points * 60)
ADD COLUMN IF NOT EXISTS actual_duration INTEGER, -- actual minutes spent
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timer_paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timer_status TEXT DEFAULT 'not_started' CHECK (timer_status IN ('not_started', 'running', 'paused', 'break', 'completed'));

-- ============================================
-- 1. LOCK-IN SESSIONS TABLE
-- ============================================
-- Tracks when user "locks in" their daily task list
CREATE TABLE IF NOT EXISTS public.lock_in_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lock_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tasks_count INTEGER NOT NULL DEFAULT 0, -- number of tasks at lock-in
  tasks_snapshot JSONB, -- snapshot of tasks at lock-in time
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lock_date) -- one lock-in per user per day
);

ALTER TABLE public.lock_in_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own lock-in sessions"
ON public.lock_in_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lock-in sessions"
ON public.lock_in_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. TASK TIMERS TABLE
-- ============================================
-- Tracks individual timer sessions for each task
CREATE TABLE IF NOT EXISTS public.task_timers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('work', 'break')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER, -- actual duration when ended
  planned_duration INTEGER DEFAULT 45, -- 45min for work, 15min for break
  overrun_minutes INTEGER DEFAULT 0, -- how many minutes over planned
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.task_timers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own task timers"
ON public.task_timers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own task timers"
ON public.task_timers FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own task timers"
ON public.task_timers FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 3. DELETED TASKS LOG
-- ============================================
-- Tracks tasks deleted after lock-in (negative metric)
CREATE TABLE IF NOT EXISTS public.deleted_tasks_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_title TEXT NOT NULL,
  task_category TEXT,
  task_points INTEGER,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  lock_in_session_id UUID REFERENCES public.lock_in_sessions(id),
  was_after_lock_in BOOLEAN DEFAULT false,
  penalty_points INTEGER DEFAULT 0, -- negative points for deleting after lock-in
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.deleted_tasks_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own deleted tasks"
ON public.deleted_tasks_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own deleted tasks"
ON public.deleted_tasks_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. DAILY METRICS TABLE
-- ============================================
-- Aggregated daily metrics for charts and analytics
CREATE TABLE IF NOT EXISTS public.daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Lock-in metrics
  lock_in_time TIME, -- time of day when locked in
  tasks_planned INTEGER DEFAULT 0, -- tasks in plan at lock-in
  tasks_completed INTEGER DEFAULT 0, -- tasks actually completed
  commitment_rate NUMERIC(5,2), -- percentage of planned tasks completed

  -- Timer metrics
  total_work_minutes INTEGER DEFAULT 0,
  total_break_minutes INTEGER DEFAULT 0,
  total_overrun_minutes INTEGER DEFAULT 0,
  average_overrun_minutes NUMERIC(5,2),

  -- Deletion metrics
  tasks_deleted_after_lock_in INTEGER DEFAULT 0,
  penalty_points INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, metric_date)
);

ALTER TABLE public.daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own daily metrics"
ON public.daily_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily metrics"
ON public.daily_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily metrics"
ON public.daily_metrics FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_daily_metrics_updated_at
BEFORE UPDATE ON public.daily_metrics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. PUSH NOTIFICATION SETTINGS
-- ============================================
-- User preferences for push notifications
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT true,
  hourly_reminders BOOLEAN DEFAULT true,
  break_reminders BOOLEAN DEFAULT true,
  push_subscription JSONB, -- web push subscription object
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notification settings"
ON public.notification_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification settings"
ON public.notification_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification settings"
ON public.notification_settings FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_notification_settings_updated_at
BEFORE UPDATE ON public.notification_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_lock_in_sessions_user_date ON public.lock_in_sessions(user_id, lock_date);
CREATE INDEX IF NOT EXISTS idx_task_timers_task_id ON public.task_timers(task_id);
CREATE INDEX IF NOT EXISTS idx_task_timers_user_started ON public.task_timers(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_deleted_tasks_user_deleted ON public.deleted_tasks_log(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_user_date ON public.daily_metrics(user_id, metric_date);
