-- Add points column to tasks table
ALTER TABLE tasks ADD COLUMN points integer DEFAULT 1;

-- Add comment to explain the column
COMMENT ON COLUMN tasks.points IS 'Points awarded for completing this task';