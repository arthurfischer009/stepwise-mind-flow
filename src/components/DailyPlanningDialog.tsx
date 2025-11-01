import { useState, useEffect } from "react";
import { Calendar, Plus, Star, Clock, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { playClick, playPowerUp } from "@/lib/sounds";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  points?: number;
  is_priority?: boolean;
}

interface DailyPlanningDialogProps {
  tasks: Task[];
  onAddTask: (title: string, category?: string) => void;
  onUpdatePriority: (taskId: string, isPriority: boolean) => void;
  categoryColors: { [key: string]: string };
}

export const DailyPlanningDialog = ({
  tasks,
  onAddTask,
  onUpdatePriority,
  categoryColors,
}: DailyPlanningDialogProps) => {
  const [open, setOpen] = useState(false);
  const [dailyGoal, setDailyGoal] = useState("");
  const [quickTasks, setQuickTasks] = useState<string[]>(["", "", ""]);
  const [priorityTasks, setPriorityTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load daily goal from localStorage
    const saved = localStorage.getItem(`dailyGoal-${format(new Date(), 'yyyy-MM-dd')}`);
    if (saved) {
      setDailyGoal(saved);
    }

    // Load priority tasks
    const savedPriorities = tasks.filter(t => t.is_priority).map(t => t.id);
    setPriorityTasks(new Set(savedPriorities));
  }, [tasks]);

  const pendingTasks = tasks.filter(t => !t.completed);
  const priorityCount = priorityTasks.size;

  const handleSavePlan = () => {
    // Save daily goal
    if (dailyGoal.trim()) {
      localStorage.setItem(`dailyGoal-${format(new Date(), 'yyyy-MM-dd')}`, dailyGoal);
    }

    // Add quick tasks
    quickTasks.forEach(task => {
      if (task.trim()) {
        onAddTask(task.trim());
      }
    });

    // Update priority tasks
    priorityTasks.forEach(taskId => {
      onUpdatePriority(taskId, true);
    });

    playPowerUp();
    setOpen(false);
    setQuickTasks(["", "", ""]);
  };

  const togglePriority = (taskId: string) => {
    const newPriorities = new Set(priorityTasks);
    if (newPriorities.has(taskId)) {
      newPriorities.delete(taskId);
      onUpdatePriority(taskId, false);
    } else {
      if (newPriorities.size < 5) {
        newPriorities.add(taskId);
        onUpdatePriority(taskId, true);
      }
    }
    setPriorityTasks(newPriorities);
    playClick();
  };

  const updateQuickTask = (index: number, value: string) => {
    const updated = [...quickTasks];
    updated[index] = value;
    setQuickTasks(updated);
  };

  const addMoreQuickTask = () => {
    setQuickTasks([...quickTasks, ""]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm" 
          className="gap-2 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Plan Your Day</span>
          {priorityCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {priorityCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="w-6 h-6 text-primary" />
            Plan Your Day
          </DialogTitle>
          <DialogDescription>
            {format(new Date(), 'EEEE, MMMM d, yyyy')} • Focus on what matters most
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Daily Goal */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Target className="w-4 h-4 text-primary" />
              Today's Main Goal
            </label>
            <Textarea
              value={dailyGoal}
              onChange={(e) => setDailyGoal(e.target.value)}
              placeholder="What do you want to accomplish today?"
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Quick Add Tasks */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold">
              <Plus className="w-4 h-4 text-primary" />
              Quick Add Tasks
            </label>
            <div className="space-y-2">
              {quickTasks.map((task, index) => (
                <Input
                  key={index}
                  value={task}
                  onChange={(e) => updateQuickTask(index, e.target.value)}
                  placeholder={`Task ${index + 1}...`}
                  className="bg-card"
                />
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addMoreQuickTask}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add More
              </Button>
            </div>
          </div>

          {/* Priority Selection */}
          {pendingTasks.length > 0 && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <Star className="w-4 h-4 text-yellow-500" />
                Mark as Priority (max 5)
              </label>
              <p className="text-xs text-muted-foreground mb-3">
                Select your most important tasks for today
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {pendingTasks.map((task) => {
                  const isPriority = priorityTasks.has(task.id);
                  const categoryColor = task.category ? categoryColors[task.category] : undefined;

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                        isPriority 
                          ? 'bg-yellow-500/10 border-yellow-500/50' 
                          : 'bg-card border-border hover:border-primary/30'
                      }`}
                      onClick={() => togglePriority(task.id)}
                    >
                      <Checkbox
                        checked={isPriority}
                        onCheckedChange={() => togglePriority(task.id)}
                        className="pointer-events-none"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{task.title}</div>
                        {task.category && (
                          <Badge 
                            variant="outline" 
                            className="text-xs mt-1"
                            style={{ 
                              borderColor: categoryColor,
                              color: categoryColor 
                            }}
                          >
                            {task.category}
                          </Badge>
                        )}
                      </div>
                      {isPriority && (
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Today's Focus</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Priority Tasks:</span>
                <span className="ml-2 font-bold">{priorityCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Quick Adds:</span>
                <span className="ml-2 font-bold">
                  {quickTasks.filter(t => t.trim()).length}
                </span>
              </div>
            </div>
            {dailyGoal.trim() && (
              <div className="mt-2 pt-2 border-t border-primary/20">
                <span className="text-xs text-muted-foreground">Goal:</span>
                <p className="text-sm mt-1 font-medium">{dailyGoal}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSavePlan}
            className="flex-1 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
          >
            Start Your Day
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
