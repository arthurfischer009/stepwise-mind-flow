-- Add is_priority column to tasks table
ALTER TABLE public.tasks 
ADD COLUMN is_priority BOOLEAN DEFAULT false;

-- Create index for better performance when filtering priority tasks
CREATE INDEX idx_tasks_is_priority ON public.tasks(is_priority) WHERE is_priority = true;