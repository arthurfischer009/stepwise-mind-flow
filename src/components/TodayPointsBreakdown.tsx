import { Trophy, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCustomDayBoundaries } from "@/lib/dateUtils";
import { parseISO, isWithinInterval } from "date-fns";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  points?: number;
}

interface Category {
  name: string;
  color: string;
}

interface TodayPointsBreakdownProps {
  tasks: Task[];
  categoryColors: { [key: string]: string };
  categories: Category[];
}

export const TodayPointsBreakdown = ({ tasks, categoryColors, categories }: TodayPointsBreakdownProps) => {
  const { start, end } = getCustomDayBoundaries();
  
  // Filter today's completed tasks
  const todayCompletedTasks = tasks.filter(task => {
    if (!task.completed || !task.completed_at) return false;
    const completedAt = parseISO(task.completed_at);
    return isWithinInterval(completedAt, { start, end });
  });

  // Group by category and sum points
  const categoryPoints = new Map<string, number>();
  todayCompletedTasks.forEach(task => {
    const category = task.category || 'Uncategorized';
    const points = task.points || 1;
    categoryPoints.set(category, (categoryPoints.get(category) || 0) + points);
  });

  const totalPointsToday = Array.from(categoryPoints.values()).reduce((sum, points) => sum + points, 0);

  // Sort categories by points (highest first)
  const sortedCategories = Array.from(categoryPoints.entries())
    .sort((a, b) => b[1] - a[1]);

  if (todayCompletedTasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          Heute erledigt
        </h3>
        <Badge variant="secondary" className="text-lg px-3 py-1">
          {totalPointsToday} Punkte
        </Badge>
      </div>

      <div className="space-y-3">
        {sortedCategories.map(([category, points]) => {
          const color = categoryColors[category] || 'hsl(var(--muted))';
          const percentage = totalPointsToday > 0 ? (points / totalPointsToday) * 100 : 0;
          
          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color }}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: color }}
                  />
                  {category}
                </span>
                <span className="text-sm font-bold">{points} Punkte</span>
              </div>
              <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {todayCompletedTasks.length} Task{todayCompletedTasks.length !== 1 ? 's' : ''} erledigt
          </span>
          <span className="font-medium">
            ⌀ {(totalPointsToday / todayCompletedTasks.length).toFixed(1)} Punkte/Task
          </span>
        </div>
      </div>
    </div>
  );
};
