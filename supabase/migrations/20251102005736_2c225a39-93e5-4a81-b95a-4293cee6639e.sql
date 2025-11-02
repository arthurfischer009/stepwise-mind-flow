-- Fix the search_path security issue
CREATE OR REPLACE FUNCTION claim_orphaned_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update tasks with NULL user_id to belong to the current user
  UPDATE tasks
  SET user_id = auth.uid()
  WHERE user_id IS NULL;
  
  -- Update categories with NULL user_id to belong to the current user
  UPDATE categories
  SET user_id = auth.uid()
  WHERE user_id IS NULL;
END;
$$;