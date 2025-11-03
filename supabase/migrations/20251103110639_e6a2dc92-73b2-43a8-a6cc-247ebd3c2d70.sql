-- Add time_period column to tasks table
ALTER TABLE public.tasks ADD COLUMN time_period TEXT CHECK (time_period IN ('morning', 'day', 'evening', 'night'));

-- Add index for better query performance
CREATE INDEX idx_tasks_time_period ON public.tasks(time_period);

COMMENT ON COLUMN public.tasks.time_period IS 'Time period for the task: morning (5-12), day (12-17), evening (17-21), night (21-5)';