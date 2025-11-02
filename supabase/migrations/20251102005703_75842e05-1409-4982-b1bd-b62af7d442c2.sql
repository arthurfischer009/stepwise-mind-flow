-- Update existing tasks to belong to the current user (for migration purposes)
-- This will assign all NULL user_id tasks to any authenticated user who runs this
-- In production, you would want to be more selective about which tasks to migrate

-- First, let's create a function that users can call to claim orphaned tasks
CREATE OR REPLACE FUNCTION claim_orphaned_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_orphaned_tasks() TO authenticated;

COMMENT ON FUNCTION claim_orphaned_tasks() IS 'Allows authenticated users to claim orphaned tasks and categories that have no user_id assigned';