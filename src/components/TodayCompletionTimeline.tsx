import { CheckCircle2, Clock } from "lucide-react";
import { getCustomDayBoundaries } from "@/lib/dateUtils";
import { parseISO, isWithinInterval, format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  points?: number;
}

interface TodayCompletionTimelineProps {
  tasks: Task[];
  categoryColors: { [key: string]: string };
}

export const TodayCompletionTimeline = ({ tasks, categoryColors }: TodayCompletionTimelineProps) => {
  const { start, end } = getCustomDayBoundaries();
  
  // Filter and sort today's completed tasks by completion time
  const todayCompletedTasks = tasks
    .filter(task => {
      if (!task.completed || !task.completed_at) return false;
      const completedAt = parseISO(task.completed_at);
      return isWithinInterval(completedAt, { start, end });
    })
    .sort((a, b) => {
      if (!a.completed_at || !b.completed_at) return 0;
      return parseISO(a.completed_at).getTime() - parseISO(b.completed_at).getTime();
    });

  if (todayCompletedTasks.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          Heute erledigt
        </h3>
        <div className="text-center py-8 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Noch keine Tasks heute erledigt</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Heute erledigt
        </h3>
        <Badge variant="secondary">
          {todayCompletedTasks.length} Task{todayCompletedTasks.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Timeline with colored dots */}
      <div className="space-y-4">
        {todayCompletedTasks.map((task, index) => {
          const color = categoryColors[task.category || ''] || 'hsl(var(--muted-foreground))';
          const time = task.completed_at ? format(parseISO(task.completed_at), 'HH:mm') : '';
          const points = task.points || 1;
          
          return (
            <div key={task.id} className="flex items-start gap-3 group">
              {/* Colored dot with connecting line */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-background shadow-lg transition-transform group-hover:scale-125"
                  style={{ 
                    backgroundColor: color,
                    boxShadow: `0 0 8px ${color}50`
                  }}
                />
                {index < todayCompletedTasks.length - 1 && (
                  <div 
                    className="w-0.5 h-8 mt-1"
                    style={{ backgroundColor: color + '30' }}
                  />
                )}
              </div>

              {/* Task info */}
              <div className="flex-1 pt-0.5 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight mb-1">
                      {task.title}
                    </p>
                    {task.category && (
                      <Badge 
                        variant="outline" 
                        className="text-xs"
                        style={{ 
                          borderColor: color + '50',
                          color: color
                        }}
                      >
                        {task.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground font-mono">
                      {time}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      +{points}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary footer */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <span className="text-sm text-muted-foreground shrink-0">Kategorien:</span>
          {todayCompletedTasks.map((task) => {
            const color = categoryColors[task.category || ''] || 'hsl(var(--muted-foreground))';
            return (
              <div
                key={task.id}
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                title={task.category || 'Uncategorized'}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
