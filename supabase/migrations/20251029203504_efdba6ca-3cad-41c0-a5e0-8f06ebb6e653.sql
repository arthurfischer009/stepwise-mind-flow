-- Add user_id column to tasks table
ALTER TABLE public.tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to categories table
ALTER TABLE public.categories ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Make user_id required for new rows (existing rows will need to be handled separately)
-- For now, we'll allow NULL to not break existing data, but new inserts will require it

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow all operations on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow all operations on task_relationships" ON public.task_relationships;

-- Create secure RLS policies for tasks
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create secure RLS policies for categories
CREATE POLICY "Users can view their own categories"
ON public.categories
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
ON public.categories
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- For task_relationships, we need to ensure both tasks belong to the user
CREATE POLICY "Users can view their own task relationships"
ON public.task_relationships
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_relationships.from_task_id
    AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own task relationships"
ON public.task_relationships
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_relationships.from_task_id
    AND tasks.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own task relationships"
ON public.task_relationships
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.tasks
    WHERE tasks.id = task_relationships.from_task_id
    AND tasks.user_id = auth.uid()
  )
);