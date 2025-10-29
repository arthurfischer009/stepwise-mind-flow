import { useState } from "react";
import { Trash2, GripVertical } from "lucide-react";
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
  onReorderTasks: (tasks: Task[]) => void;
  categoryColors: { [key: string]: string };
}

export const TaskList = ({ tasks, onDeleteTask, onReorderTasks, categoryColors }: TaskListProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const pendingTasks = tasks.filter((t) => !t.completed);

  if (pendingTasks.length === 0) return null;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTasks = [...pendingTasks];
    const draggedTask = newTasks[draggedIndex];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(index, 0, draggedTask);
    
    const completedTasks = tasks.filter((t) => t.completed);
    onReorderTasks([...newTasks, ...completedTasks]);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Upcoming Levels ({pendingTasks.length})
      </h3>
      <div className="space-y-1.5">
        {pendingTasks.map((task, index) => {
          const categoryColor = task.category ? categoryColors[task.category] : undefined;
          
          return (
            <div
              key={task.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className="group flex items-center gap-2 p-2 rounded bg-card border transition-all cursor-move"
              style={{
                borderColor: categoryColor || 'hsl(var(--border))',
                backgroundColor: categoryColor ? `${categoryColor}10` : undefined,
                opacity: draggedIndex === index ? 0.5 : 1
              }}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <div
                className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium text-white"
                style={{
                  backgroundColor: categoryColor || 'hsl(var(--muted))'
                }}
              >
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate leading-tight">{task.title}</div>
                {task.category && categoryColor && (
                  <div 
                    className="inline-block text-[10px] text-white font-semibold px-2 py-0.5 rounded-full mt-0.5"
                    style={{ backgroundColor: categoryColor }}
                  >
                    {task.category}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive h-6 w-6 p-0"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
