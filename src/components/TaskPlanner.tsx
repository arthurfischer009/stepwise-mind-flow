import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
          <Select
            value={category || "none"}
            onValueChange={(value) => setCategory(value === "none" ? "" : value)}
          >
            <SelectTrigger 
              className="w-36 h-9 text-sm bg-card border-border"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-background border border-border shadow-lg z-[100]">
              <SelectItem value="none" className="text-xs hover:bg-accent">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  No category
                </div>
              </SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.name} value={cat.name} className="text-xs hover:bg-accent">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
