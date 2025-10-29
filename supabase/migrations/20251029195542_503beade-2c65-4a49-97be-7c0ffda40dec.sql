-- Create categories table to store category names and colors
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create policies for categories (public access for simplicity)
CREATE POLICY "Allow all operations on categories" 
ON public.categories 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migrate existing categories from tasks to the new categories table
INSERT INTO public.categories (name, color)
SELECT DISTINCT 
  category,
  CASE 
    WHEN ROW_NUMBER() OVER (ORDER BY MIN(created_at)) % 8 = 1 THEN 'hsl(var(--primary))'
    WHEN ROW_NUMBER() OVER (ORDER BY MIN(created_at)) % 8 = 2 THEN 'hsl(var(--secondary))'
    WHEN ROW_NUMBER() OVER (ORDER BY MIN(created_at)) % 8 = 3 THEN 'hsl(var(--accent))'
    WHEN ROW_NUMBER() OVER (ORDER BY MIN(created_at)) % 8 = 4 THEN 'hsl(280, 80%, 60%)'
    WHEN ROW_NUMBER() OVER (ORDER BY MIN(created_at)) % 8 = 5 THEN 'hsl(200, 80%, 60%)'
    WHEN ROW_NUMBER() OVER (ORDER BY MIN(created_at)) % 8 = 6 THEN 'hsl(160, 80%, 50%)'
    WHEN ROW_NUMBER() OVER (ORDER BY MIN(created_at)) % 8 = 7 THEN 'hsl(30, 90%, 60%)'
    ELSE 'hsl(340, 80%, 60%)'
  END as color
FROM public.tasks
WHERE category IS NOT NULL
GROUP BY category
ON CONFLICT (name) DO NOTHING;