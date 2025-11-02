import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "./TaskList";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  points?: number;
}

interface Category {
  name: string;
  color: string;
}

interface TaskPlannerProps {
  tasks: Task[];
  onAddTask: (title: string, category?: string) => void;
  onDeleteTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onUpdatePoints: (id: string, points: number) => void;
  onUpdateTask: (id: string, title: string) => void;
  categoryColors: { [key: string]: string };
  categories?: Category[];
}

export const TaskPlanner = ({ tasks, onAddTask, onDeleteTask, onReorderTasks, onUpdatePoints, onUpdateTask, categoryColors, categories = [] }: TaskPlannerProps) => {
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

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-0.5 flex-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full" />
        <h2 className="text-lg font-bold whitespace-nowrap">Today's Quest</h2>
        <div className="h-0.5 flex-1 bg-gradient-to-r from-accent via-secondary to-primary rounded-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What's your next challenge?"
            className="flex-1 bg-card border-border focus:border-primary transition-colors h-9 text-sm"
          />
          <div className="relative w-36">
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category"
              list="categories-list"
              className="w-full h-9 text-sm bg-card border-border focus:border-primary transition-colors"
            />
            <datalist id="categories-list">
              {categories.map((cat) => (
                <option key={cat.name} value={cat.name} />
              ))}
            </datalist>
            {category && categories.find(c => c.name === category) && (
              <div
                className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none"
                style={{ backgroundColor: categoryColors[category] }}
              />
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            className="bg-primary hover:bg-primary/90 transition-all h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </form>

      <TaskList 
        tasks={tasks}
        onDeleteTask={onDeleteTask}
        onReorderTasks={onReorderTasks}
        onUpdatePoints={onUpdatePoints}
        onUpdateTask={onUpdateTask}
        categoryColors={categoryColors}
      />
    </div>
  );
};
