-- Add timer fields to tasks table
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS timer_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timer_paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS timer_status TEXT,
ADD COLUMN IF NOT EXISTS timer_elapsed_seconds INTEGER DEFAULT 0;