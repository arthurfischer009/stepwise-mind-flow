-- Add missing columns to deleted_tasks_log
ALTER TABLE public.deleted_tasks_log
ADD COLUMN IF NOT EXISTS task_category TEXT,
ADD COLUMN IF NOT EXISTS task_points INTEGER,
ADD COLUMN IF NOT EXISTS lock_in_session_id TEXT;