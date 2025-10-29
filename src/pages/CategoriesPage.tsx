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

const CategoriesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const categoryColorPalette = [
    'hsl(var(--primary))',
    'hsl(var(--secondary))',
    'hsl(var(--accent))',
    'hsl(280, 80%, 60%)',
    'hsl(200, 80%, 60%)',
    'hsl(160, 80%, 50%)',
    'hsl(30, 90%, 60%)',
    'hsl(340, 80%, 60%)',
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    }
  };

  const categories = Array.from(new Set(tasks.map(t => t.category).filter(Boolean))) as string[];
  
  const categoryColors = categories.reduce((acc, cat, idx) => {
    acc[cat] = categoryColorPalette[idx % categoryColorPalette.length];
    return acc;
  }, {} as { [key: string]: string });

  const getCategoryTaskCount = (category: string) => {
    return tasks.filter(t => t.category === category).length;
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

    if (categories.includes(trimmed)) {
      toast({
        title: "Category exists",
        description: "This category already exists",
        variant: "destructive",
      });
      return;
    }

    setNewCategory("");
    toast({
      title: "Category ready",
      description: `You can now add tasks with the "${trimmed}" category`,
    });
  };

  const handleDeleteCategory = async (category: string) => {
    setDeleting(category);
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      // Update all tasks with this category to have no category
      const { error } = await supabase
        .from('tasks')
        .update({ category: null })
        .eq('category', category);

      if (error) throw error;

      await loadTasks();
      
      toast({
        title: "Category deleted",
        description: `All tasks from "${category}" are now uncategorized`,
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

  const handleStartEdit = (category: string) => {
    setEditing(category);
    setEditValue(category);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const handleSaveEdit = async (oldCategory: string) => {
    const trimmed = editValue.trim();
    
    if (!trimmed) {
      toast({
        title: "Invalid name",
        description: "Category name cannot be empty",
        variant: "destructive",
      });
      return;
    }

    if (trimmed === oldCategory) {
      handleCancelEdit();
      return;
    }

    if (categories.includes(trimmed)) {
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

      // Update all tasks with this category to the new name
      const { error } = await supabase
        .from('tasks')
        .update({ category: trimmed })
        .eq('category', oldCategory);

      if (error) throw error;

      await loadTasks();
      handleCancelEdit();
      
      toast({
        title: "Category renamed",
        description: `"${oldCategory}" is now "${trimmed}"`,
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
                const categoryColor = categoryColors[category];
                const taskCount = getCategoryTaskCount(category);
                const isEditing = editing === category;
                
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between p-4 rounded-lg border-2 transition-all"
                    style={{
                      borderColor: categoryColor,
                      background: `linear-gradient(135deg, ${categoryColor}15, ${categoryColor}05)`
                    }}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {taskCount}
                      </div>
                      {isEditing ? (
                        <div className="flex-1 flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(category);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="flex-1 bg-background"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveEdit(category)}
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
                          <div className="font-bold text-lg">{category}</div>
                          <div className="text-sm text-muted-foreground">
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {!isEditing && (
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(category)}
                          className="gap-2 hover:bg-primary/10"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCategory(category)}
                          disabled={deleting === category}
                          className="gap-2 hover:bg-destructive/10 hover:text-destructive"
                        >
                          {deleting === category ? (
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
