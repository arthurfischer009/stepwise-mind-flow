import { useState } from "react";
import { CurrentLevel } from "@/components/CurrentLevel";
import { TaskPlanner } from "@/components/TaskPlanner";
import { ProgressStats } from "@/components/ProgressStats";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
}

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [level, setLevel] = useState(1);
  const { toast } = useToast();

  const currentTask = tasks.find((t) => !t.completed) || null;
  const completedToday = tasks.filter((t) => t.completed).length;

  const handleAddTask = (title: string, category?: string) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      category,
      completed: false,
    };
    setTasks((prev) => [...prev, newTask]);
    toast({
      title: "Task Added",
      description: "New challenge accepted!",
    });
  };

  const handleCompleteTask = () => {
    if (!currentTask) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === currentTask.id ? { ...t, completed: true } : t))
    );
    setLevel((prev) => prev + 1);
    
    toast({
      title: "Level Complete! 🎉",
      description: `You've reached Level ${level + 1}`,
    });
  };

  const handleDeleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            Focus Quest
          </h1>
          <p className="text-muted-foreground">One task. One level. Complete focus.</p>
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
            <TaskPlanner
              tasks={tasks}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
