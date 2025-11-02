import { useState, useRef } from "react";
import { Trash2, GripVertical, Clock, Pencil, Check, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMinutes } from "date-fns";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  points?: number;
  is_priority?: boolean;
}

interface TaskListProps {
  tasks: Task[];
  onDeleteTask: (id: string) => void;
  onReorderTasks: (tasks: Task[]) => void;
  onUpdatePoints: (id: string, points: number) => void;
  onUpdateTask: (id: string, title: string) => void;
  categoryColors: { [key: string]: string };
}

export const TaskList = ({ tasks, onDeleteTask, onReorderTasks, onUpdatePoints, onUpdateTask, categoryColors }: TaskListProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [editingPoints, setEditingPoints] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState<string>("");
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchCurrentY, setTouchCurrentY] = useState<number | null>(null);
  const [isDraggingTouch, setIsDraggingTouch] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const touchElementRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoScrollIntervalRef = useRef<number | null>(null);
  const pendingTasks = (draggedIndex !== null ? localTasks : tasks.filter((t) => !t.completed));

  if (tasks.filter((t) => !t.completed).length === 0) return null;

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
    setLocalTasks(tasks.filter((t) => !t.completed));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newTasks = [...localTasks];
    const draggedTask = newTasks[draggedIndex];
    newTasks.splice(draggedIndex, 1);
    newTasks.splice(index, 0, draggedTask);
    
    setLocalTasks(newTasks);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      const completedTasks = tasks.filter((t) => t.completed);
      onReorderTasks([...localTasks, ...completedTasks]);
    }
    setDraggedIndex(null);
    setLocalTasks([]);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchCurrentY(touch.clientY);
    setDraggedIndex(index);
    setLocalTasks(tasks.filter((t) => !t.completed));
    setIsDraggingTouch(true);
    touchElementRef.current = e.currentTarget as HTMLDivElement;
    
    // Haptic feedback on supported devices
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null || !isDraggingTouch) return;
    
    e.preventDefault(); // Prevent scrolling while dragging
    const touch = e.touches[0];
    setTouchCurrentY(touch.clientY);

    // Auto-scroll when dragging near edges
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const scrollThreshold = 80;
      const scrollSpeed = 10;

      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      if (touch.clientY < containerRect.top + scrollThreshold) {
        // Scroll up
        autoScrollIntervalRef.current = window.setInterval(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop -= scrollSpeed;
          }
        }, 16);
      } else if (touch.clientY > containerRect.bottom - scrollThreshold) {
        // Scroll down
        autoScrollIntervalRef.current = window.setInterval(() => {
          if (containerRef.current) {
            containerRef.current.scrollTop += scrollSpeed;
          }
        }, 16);
      }
    }

    // Find which element we're hovering over
    const elements = document.elementsFromPoint(touch.clientX, touch.clientY);
    const taskElement = elements.find(el => 
      el.classList.contains('task-item') && el !== touchElementRef.current
    );

    if (taskElement) {
      const hoveredIndex = parseInt(taskElement.getAttribute('data-index') || '-1');
      setHoverIndex(hoveredIndex);
      
      if (hoveredIndex !== -1 && hoveredIndex !== draggedIndex) {
        const newTasks = [...localTasks];
        const draggedTask = newTasks[draggedIndex];
        newTasks.splice(draggedIndex, 1);
        newTasks.splice(hoveredIndex, 0, draggedTask);
        
        setLocalTasks(newTasks);
        setDraggedIndex(hoveredIndex);
        
        // Subtle haptic feedback when crossing items
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    } else {
      setHoverIndex(null);
    }
  };

  const handleTouchEnd = () => {
    // Clear auto-scroll interval
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    if (draggedIndex !== null && isDraggingTouch) {
      const completedTasks = tasks.filter((t) => t.completed);
      onReorderTasks([...localTasks, ...completedTasks]);
      
      // Haptic feedback on drop
      if ('vibrate' in navigator) {
        navigator.vibrate(30);
      }
    }
    setDraggedIndex(null);
    setLocalTasks([]);
    setTouchStartY(null);
    setTouchCurrentY(null);
    setIsDraggingTouch(false);
    setHoverIndex(null);
    touchElementRef.current = null;
  };

  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Upcoming Levels ({pendingTasks.length})
      </h3>
      <div ref={containerRef} className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {pendingTasks.map((task, index) => {
          const categoryColor = task.category ? categoryColors[task.category] : undefined;
          const startTime = getTaskStartTime(index);
          const isBeingDragged = draggedIndex === index;
          const touchOffset = isBeingDragged && touchStartY !== null && touchCurrentY !== null 
            ? touchCurrentY - touchStartY 
            : 0;
          const isHovered = hoverIndex === index && !isBeingDragged;
          
          return (
            <div key={task.id} className="relative">
              {/* Visual placeholder line */}
              {isHovered && isDraggingTouch && (
                <div 
                  className="absolute -top-1 left-0 right-0 h-0.5 rounded-full animate-pulse"
                  style={{ 
                    backgroundColor: categoryColor || 'hsl(var(--primary))',
                    boxShadow: `0 0 8px ${categoryColor || 'hsl(var(--primary))'}` 
                  }}
                />
              )}
              
              <div
                data-index={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                onTouchStart={(e) => handleTouchStart(e, index)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="task-item group flex items-center gap-2 p-2 rounded bg-card border transition-all duration-200 ease-out cursor-move"
                style={{
                  borderColor: categoryColor || 'hsl(var(--border))',
                  backgroundColor: categoryColor ? `${categoryColor}10` : undefined,
                  opacity: isBeingDragged ? 0.8 : 1,
                  transform: isBeingDragged && isDraggingTouch
                    ? `translateY(${touchOffset}px) scale(1.05)` 
                    : isBeingDragged 
                    ? 'scale(1.02)' 
                    : 'scale(1)',
                  zIndex: isBeingDragged ? 50 : 1,
                  position: isBeingDragged && isDraggingTouch ? 'relative' : 'static',
                  touchAction: 'none',
                  boxShadow: isBeingDragged && isDraggingTouch 
                    ? `0 8px 24px ${categoryColor ? `${categoryColor}40` : 'rgba(0,0,0,0.15)'}`
                    : 'none'
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
              {task.is_priority && (
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                {editingTitle === task.id ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={editingTitleValue}
                      onChange={(e) => setEditingTitleValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateTask(task.id, editingTitleValue);
                          setEditingTitle(null);
                        } else if (e.key === 'Escape') {
                          setEditingTitle(null);
                        }
                      }}
                      className="flex-1 px-2 py-1 text-sm bg-background border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onUpdateTask(task.id, editingTitleValue);
                        setEditingTitle(null);
                      }}
                      className="h-6 w-6 p-0"
                    >
                      <Check className="w-3 h-3 text-green-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingTitle(null)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                ) : (
                  <div className="font-medium text-sm truncate leading-tight">{task.title}</div>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: categoryColor ? 'white' : 'hsl(var(--muted-foreground))' }}>
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
              <div className="flex items-center gap-0.5">
                {editingTitle !== task.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingTitle(task.id);
                      setEditingTitleValue(task.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    <Pencil className="w-3 h-3" />
                  </Button>
                )}
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
