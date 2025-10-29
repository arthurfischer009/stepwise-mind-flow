import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentLevel } from "@/components/CurrentLevel";
import { TaskPlanner } from "@/components/TaskPlanner";
import { ProgressStats } from "@/components/ProgressStats";
import { AISuggestions } from "@/components/AISuggestions";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Network } from "lucide-react";
import { getSupabase } from "@/lib/safeSupabase";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  sort_order?: number;
  points?: number;
}

const Index = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>(() => {
    const saved = localStorage.getItem('aiSuggestions');
    return saved ? JSON.parse(saved) : [];
  });
  const { toast } = useToast();

  // Save suggestions to localStorage whenever they change
  useEffect(() => {
    if (suggestions.length > 0) {
      localStorage.setItem('aiSuggestions', JSON.stringify(suggestions));
    } else {
      localStorage.removeItem('aiSuggestions');
    }
  }, [suggestions]);

  // Create category to color mapping from database
  const categoryColors = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.color;
    return acc;
  }, {} as { [key: string]: string });

  // Load tasks from database
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({
          title: "Backend not ready",
          description: "Refresh the page to finish Cloud setup.",
        });
        return;
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      setTasks(tasksData || []);
      setLevel(1 + (tasksData?.filter(t => t.completed).length || 0));

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTask = tasks.find((t) => !t.completed) || null;
  const completedToday = tasks.filter((t) => t.completed).length;
  const totalPoints = tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.points || 1), 0);
  const currentTaskColor = currentTask?.category ? categoryColors[currentTask.category] : undefined;

  const handleAddTask = async (title: string, category?: string) => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const maxSortOrder = Math.max(...tasks.map(t => t.sort_order || 0), 0);

      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, category, completed: false, sort_order: maxSortOrder + 1, points: 1 })
        .select()
        .single();

      if (error) throw error;

      setTasks((prev) => [...prev, data]);
      toast({
        title: "Task Added",
        description: "New challenge accepted!",
      });
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: "Error",
        description: "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask) return;

    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', currentTask.id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === currentTask.id ? { ...t, completed: true, completed_at: new Date().toISOString() } : t))
      );
      setLevel((prev) => prev + 1);
      
      toast({
        title: "Level Complete! 🎉",
        description: `You've reached Level ${level + 1}`,
      });
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    try {
      setTasks(reorderedTasks);

      const supabase = await getSupabase();
      if (!supabase) return;

      // Update sort_order for all reordered tasks
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        sort_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (error: any) {
      console.error('Error reordering tasks:', error);
      toast({
        title: "Error",
        description: "Failed to reorder tasks",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePoints = async (id: string, points: number) => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const { error } = await supabase
        .from('tasks')
        .update({ points })
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, points } : t))
      );
    } catch (error: any) {
      console.error('Error updating points:', error);
      toast({
        title: "Error",
        description: "Failed to update points",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your quest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <header className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
              Focus Quest
            </h1>
            <Button
              onClick={() => navigate('/mindmap')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Network className="w-4 h-4" />
              Network
            </Button>
            <Button
              onClick={() => navigate('/categories')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              Categories
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">One task. One level. Total focus.</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          <div className="space-y-4">
            <ProgressStats
              level={level}
              completedToday={completedToday}
              totalTasks={tasks.length}
              totalPoints={totalPoints}
            />
            <div className="rounded-2xl bg-card border border-border p-4">
              <CurrentLevel
                task={currentTask}
                onComplete={handleCompleteTask}
                level={level}
                categoryColor={currentTaskColor}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-4">
            <TaskPlanner
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onReorderTasks={handleReorderTasks}
              onUpdatePoints={handleUpdatePoints}
              categoryColors={categoryColors}
            />
          </div>
        </div>

        <AISuggestions
          tasks={tasks}
          suggestions={suggestions}
          onSuggestionsChange={setSuggestions}
          onAddTask={handleAddTask}
          categoryColors={categoryColors}
        />
      </div>
    </div>
  );
};

export default Index;
