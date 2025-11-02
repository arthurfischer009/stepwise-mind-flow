-- Reassign all tasks and categories to the current authenticated user
CREATE OR REPLACE FUNCTION reassign_all_tasks_to_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tasks SET user_id = auth.uid();
  UPDATE categories SET user_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION reassign_all_tasks_to_current_user() TO authenticated;

COMMENT ON FUNCTION reassign_all_tasks_to_current_user() IS 'Assigns all tasks and categories to the current user. Intended for single-user/dev environments.';