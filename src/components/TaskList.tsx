import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
}

export const TaskList = ({ tasks, onDeleteTask }: TaskListProps) => {
  const pendingTasks = tasks.filter((t) => !t.completed);

  if (pendingTasks.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Upcoming Levels ({pendingTasks.length})
      </h3>
      <div className="space-y-2">
        {pendingTasks.map((task, index) => (
          <div
            key={task.id}
            className="group flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
          >
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{task.title}</div>
              {task.category && (
                <div className="text-xs text-muted-foreground">{task.category}</div>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDeleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
