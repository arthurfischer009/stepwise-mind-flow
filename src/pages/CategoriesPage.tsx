import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Plus, Trash2, Loader2, Pencil, Check, X } from "lucide-react";
import { getSupabase } from "@/lib/safeSupabase";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingColor, setEditingColor] = useState<string | null>(null);

  const categoryColorPalette = [
    'hsl(221, 83%, 53%)',   // Blue
    'hsl(142, 76%, 36%)',   // Green
    'hsl(262, 83%, 58%)',   // Purple
    'hsl(346, 77%, 50%)',   // Red
    'hsl(48, 96%, 53%)',    // Yellow
    'hsl(198, 93%, 60%)',   // Cyan
    'hsl(31, 97%, 52%)',    // Orange
    'hsl(328, 86%, 70%)',   // Pink
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    }
  };

  const categoryColors = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.color;
    return acc;
  }, {} as { [key: string]: string });

  const getCategoryTaskCount = (categoryName: string) => {
    return tasks.filter(t => t.category === categoryName).length;
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCategory.trim();
    
    if (!trimmed) {
      toast({
        title: "Invalid category",
        description: "Category name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (categories.some(c => c.name === trimmed)) {
      toast({
        title: "Category exists",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      // Add category with a default color
      const defaultColor = categoryColorPalette[categories.length % categoryColorPalette.length];
      const { error } = await supabase
        .from('categories')
        .insert({ name: trimmed, color: defaultColor });

      if (error) throw error;

      await loadData();
      setNewCategory("");
      
      toast({
        title: "Category added",
        description: `"${trimmed}" is ready to use`,
      });
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    setDeleting(categoryName);
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      // Update all tasks with this category to have no category
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ category: null })
        .eq('category', categoryName);

      if (tasksError) throw tasksError;

      // Delete the category
      const { error: catError } = await supabase
        .from('categories')
        .delete()
        .eq('name', categoryName);

      if (catError) throw catError;

      await loadData();
      
      toast({
        title: "Category deleted",
        description: `All tasks from "${categoryName}" are now uncategorized`,
      });
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleStartEdit = (categoryName: string) => {
    setEditing(categoryName);
    setEditValue(categoryName);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const handleSaveEdit = async (oldCategoryName: string) => {
    const trimmed = editValue.trim();
    
    if (!trimmed) {
      toast({
        title: "Invalid name",
        description: "Category name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (trimmed === oldCategoryName) {
      handleCancelEdit();
      return;
    }

    if (categories.some(c => c.name === trimmed)) {
      toast({
        title: "Category exists",
        description: "This category name already exists",
        variant: "destructive",
      });
      return;
    }

    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      // Update category name
      const { error: catError } = await supabase
        .from('categories')
        .update({ name: trimmed })
        .eq('name', oldCategoryName);

      if (catError) throw catError;

      // Update all tasks with this category to the new name
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ category: trimmed })
        .eq('category', oldCategoryName);

      if (tasksError) throw tasksError;

      await loadData();
      handleCancelEdit();
      
      toast({
        title: "Category renamed",
        description: `"${oldCategoryName}" is now "${trimmed}"`,
      });
    } catch (error: any) {
      console.error('Error renaming category:', error);
      toast({
        title: "Error",
        description: "Failed to rename category",
        variant: "destructive",
      });
    }
  };

  const handleChangeColor = async (categoryName: string, newColor: string) => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const { error } = await supabase
        .from('categories')
        .update({ color: newColor })
        .eq('name', categoryName);

      if (error) throw error;

      // Update locally without reloading all data
      setCategories(prev => prev.map(cat => 
        cat.name === categoryName ? { ...cat, color: newColor } : cat
      ));
      setEditingColor(null);
      
      toast({
        title: "Color updated",
        description: `Color changed for "${categoryName}"`,
      });
    } catch (error: any) {
      console.error('Error changing color:', error);
      toast({
        title: "Error",
        description: "Failed to change color",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Quest
          </Button>
          
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent mb-2">
            Manage Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Add or remove task categories to organize your quest
          </p>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Add New Category</h2>
          <form onSubmit={handleAddCategory} className="flex gap-2">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Enter category name..."
              className="flex-1 bg-background"
            />
            <Button type="submit" className="gap-2">
              <Plus className="w-4 h-4" />
              Add
            </Button>
          </form>
        </div>

        <div className="rounded-2xl bg-card border border-border p-6">
          <h2 className="text-lg font-bold mb-4">Existing Categories ({categories.length})</h2>
          
          {categories.length === 0 ? (
            <div className="text-center text-muted-foreground py-8 border border-dashed rounded-lg">
              No categories yet. Add tasks with categories to see them here.
            </div>
          ) : (
            <div className="grid gap-3">
              {categories.map((category) => {
                const categoryColor = category.color;
                const taskCount = getCategoryTaskCount(category.name);
                const isEditing = editing === category.name;
                const isEditingColor = editingColor === category.name;
                
                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-4 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: categoryColor,
                      background: `linear-gradient(135deg, ${categoryColor}15, ${categoryColor}05)`
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 cursor-pointer relative group"
                        style={{ backgroundColor: categoryColor }}
                        onClick={() => setEditingColor(isEditingColor ? null : category.name)}
                      >
                        {taskCount}
                        {isEditingColor && (
                          <div className="absolute top-14 left-0 bg-card border-2 border-border rounded-lg p-2 shadow-xl z-50 grid grid-cols-4 gap-2">
                            {categoryColorPalette.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 border-white"
                                style={{ backgroundColor: color }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleChangeColor(category.name, color);
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(category.name);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1 bg-background"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveEdit(category.name)}
                            className="gap-1 hover:bg-primary/10"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                            className="gap-1 hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1">
                          <div className="font-bold text-lg">{category.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'} • Click circle to change color
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!isEditing && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(category.name)}
                          className="gap-2 hover:bg-primary/10"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category.name)}
                          disabled={deleting === category.name}
                          className="gap-2 hover:bg-destructive/10 hover:text-destructive"
                        >
                          {deleting === category.name ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
