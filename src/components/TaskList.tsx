import { useState } from "react";
import { Trash2, GripVertical, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMinutes } from "date-fns";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  points?: number;
}

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onUpdatePoints: (id: string, points: number) => void;
  categoryColors: { [key: string]: string };
}

export const TaskList = ({ tasks, onDeleteTask, onReorderTasks, onUpdatePoints, categoryColors }: TaskListProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingPoints, setEditingPoints] = useState<string | null>(null);
  const pendingTasks = tasks.filter((t) => !t.completed);

  if (pendingTasks.length === 0) return null;

  // Calculate start time for each task
  // First task starts in 75 minutes (after current task completes)
  // Each subsequent task starts 75 minutes after the previous one (45 min work + 30 min break)
  const getTaskStartTime = (index: number): Date => {
    const now = new Date();
    const minutesUntilStart = 75 * (index + 1); // +1 because first upcoming task is after current
    return addMinutes(now, minutesUntilStart);
  };

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
          const startTime = getTaskStartTime(index);
          
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
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{format(startTime, 'HH:mm')}</span>
                  </div>
                  {task.category && categoryColor && (
                    <div 
                      className="inline-block text-[10px] text-white font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: categoryColor }}
                    >
                      {task.category}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {editingPoints === task.id ? (
                  <input
                    type="number"
                    min="1"
                    max="999"
                    defaultValue={task.points || 1}
                    onBlur={(e) => {
                      const points = parseInt(e.target.value) || 1;
                      onUpdatePoints(task.id, points);
                      setEditingPoints(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const points = parseInt(e.currentTarget.value) || 1;
                        onUpdatePoints(task.id, points);
                        setEditingPoints(null);
                      }
                    }}
                    autoFocus
                    className="w-12 h-6 px-1 text-xs text-center bg-background border rounded"
                  />
                ) : (
                  <button
                    onClick={() => setEditingPoints(task.id)}
                    className="flex items-center gap-0.5 px-1.5 py-0.5 text-xs font-semibold rounded hover:bg-primary/10 transition-colors"
                    style={{ color: categoryColor || 'hsl(var(--primary))' }}
                  >
                    <span>{task.points || 1}</span>
                    <span className="text-[10px]">XP</span>
                  </button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive h-6 w-6 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
