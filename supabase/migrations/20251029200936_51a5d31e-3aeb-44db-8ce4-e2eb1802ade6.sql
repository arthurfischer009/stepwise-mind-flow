-- Add sort_order column to tasks table
ALTER TABLE tasks ADD COLUMN sort_order integer;

-- Set initial sort_order based on created_at
UPDATE tasks SET sort_order = row_number FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at ASC) as row_number
  FROM tasks
) as numbered
WHERE tasks.id = numbered.id;

-- Add default value for new tasks
ALTER TABLE tasks ALTER COLUMN sort_order SET DEFAULT 0;