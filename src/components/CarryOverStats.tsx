import { useEffect, useState } from "react";
import { AlertTriangle, TrendingDown } from "lucide-react";
import { getCarryOverStats } from "@/lib/taskCarryOver";
import { Card } from "@/components/ui/card";

interface CarryOverStatsProps {
  userId: string;
  daysAgo?: number;
}

export const CarryOverStats = ({ userId, daysAgo = 7 }: CarryOverStatsProps) => {
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const data = await getCarryOverStats(userId, daysAgo);
      setStats(data);
      setLoading(false);
    };

    loadStats();
  }, [userId, daysAgo]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-3/4"></div>
        </div>
      </Card>
    );
  }

  if (stats.length === 0) {
    return (
      <Card className="p-4 border-green-500/20 bg-green-500/5">
        <div className="flex items-center gap-2">
          <div className="text-green-500">✅</div>
          <div>
            <h3 className="text-sm font-semibold text-green-500">Perfect Record!</h3>
            <p className="text-xs text-muted-foreground">No tasks carried over in the last {daysAgo} days</p>
          </div>
        </div>
      </Card>
    );
  }

  const totalCarriedOver = stats.length;
  const totalPoints = stats.reduce((sum, task) => sum + (task.task_points || 1), 0);

  return (
    <Card className="p-4 border-orange-500/20 bg-orange-500/5">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <div>
            <h3 className="text-sm font-semibold text-orange-500">Carried Over Tasks</h3>
            <p className="text-xs text-muted-foreground">Last {daysAgo} days</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
          <div>
            <div className="text-2xl font-bold text-orange-500">{totalCarriedOver}</div>
            <div className="text-xs text-muted-foreground">Tasks</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-500">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">Total XP Lost</div>
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingDown className="w-3 h-3" />
            <span>Complete tasks before 5 AM to avoid carry-over penalties</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
