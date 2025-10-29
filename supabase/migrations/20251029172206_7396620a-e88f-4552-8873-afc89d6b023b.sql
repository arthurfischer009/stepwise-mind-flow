-- Create tasks table for storing all tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS (public access for testing without auth)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow all operations for testing
CREATE POLICY "Allow all operations on tasks"
  ON public.tasks
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create task relationships table for mindmap
CREATE TABLE public.task_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  to_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(from_task_id, to_task_id)
);

-- Enable RLS on relationships
ALTER TABLE public.task_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on task_relationships"
  ON public.task_relationships
  FOR ALL
  USING (true)
  WITH CHECK (true);