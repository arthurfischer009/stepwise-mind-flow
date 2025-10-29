import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "./TaskList";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
}

interface TaskPlannerProps {
  tasks: Task[];
  onAddTask: (title: string, category?: string) => void;
  onDeleteTask: (id: string) => void;
}

export const TaskPlanner = ({ tasks, onAddTask, onDeleteTask }: TaskPlannerProps) => {
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim(), category.trim() || undefined);
      setNewTask("");
      setCategory("");
    }
  };

  const suggestions = [
    "Review emails",
    "Deep work session",
    "Team meeting prep",
    "Learning time",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-1 flex-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full" />
        <h2 className="text-2xl font-bold whitespace-nowrap">Today's Quest</h2>
        <div className="h-1 flex-1 bg-gradient-to-r from-accent via-secondary to-primary rounded-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What's your next challenge?"
            className="flex-1 bg-card border-border focus:border-primary transition-colors"
          />
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-32 bg-card border-border focus:border-primary transition-colors"
          />
          <Button
            type="submit"
            size="icon"
            className="bg-primary hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </form>

      {tasks.length === 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="w-4 h-4" />
            <span>Quick suggestions to get started:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setNewTask(suggestion)}
                className="text-left p-3 rounded-lg bg-card border border-border hover:border-primary transition-all hover:scale-105 text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <TaskList tasks={tasks} onDeleteTask={onDeleteTask} />
    </div>
  );
};
