import { useState, useEffect } from "react";
import { CurrentLevel } from "@/components/CurrentLevel";
import { TaskPlanner } from "@/components/TaskPlanner";
import { ProgressStats } from "@/components/ProgressStats";
import { AISuggestions } from "@/components/AISuggestions";
import { MindmapView } from "@/components/MindmapView";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSupabase } from "@/lib/safeSupabase";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(false);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const { toast } = useToast();

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

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;

      setTasks(data || []);
      setLevel(1 + (data?.filter(t => t.completed).length || 0));
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

  const handleAddTask = async (title: string, category?: string) => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert({ title, category, completed: false })
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
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            Focus Quest
          </h1>
          <p className="text-muted-foreground">One task. One level. Total focus.</p>
        </header>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-8">
            <ProgressStats
              level={level}
              completedToday={completedToday}
              totalTasks={tasks.length}
            />
            <div className="rounded-2xl bg-card border border-border p-8">
              <CurrentLevel
                task={currentTask}
                onComplete={handleCompleteTask}
                level={level}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-8">
            <Tabs defaultValue="planner" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="planner">Planner</TabsTrigger>
                <TabsTrigger value="ai">AI Assist</TabsTrigger>
                <TabsTrigger value="mindmap">Network</TabsTrigger>
              </TabsList>
              
              <TabsContent value="planner" className="mt-0">
                <TaskPlanner
                  tasks={tasks}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                />
              </TabsContent>
              
              <TabsContent value="ai" className="mt-0">
                <AISuggestions
                  tasks={tasks}
                  onAddTask={handleAddTask}
                />
              </TabsContent>
              
              <TabsContent value="mindmap" className="mt-0">
                <MindmapView tasks={tasks} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
