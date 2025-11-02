-- Allow users to see unassigned data to support migration of legacy rows
-- Tasks: permit selecting rows where user_id is NULL or equals current user
CREATE POLICY "View own or unassigned tasks"
ON public.tasks
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Categories: permit selecting rows where user_id is NULL or equals current user
CREATE POLICY "View own or unassigned categories"
ON public.categories
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);