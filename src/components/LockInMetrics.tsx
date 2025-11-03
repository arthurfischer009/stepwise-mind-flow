import { Lock, TrendingUp, TrendingDown, AlertCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { format, subDays } from "date-fns";

interface LockInMetricsProps {
  userId?: string;
}

export const LockInMetrics = ({ userId }: LockInMetricsProps) => {
  const [lockInData, setLockInData] = useState<any[]>([]);
  const [deletedTasksData, setDeletedTasksData] = useState<any[]>([]);
  const [timerData, setTimerData] = useState<any[]>([]);
  const [commitmentRate, setCommitmentRate] = useState<number>(0);

  useEffect(() => {
    if (userId) {
      loadMetrics();
    }
  }, [userId]);

  const loadMetrics = async () => {
    if (!userId) return;

    try {
      // Load last 7 days of metrics
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, 'yyyy-MM-dd');
      });

      // Get lock-in times for last 7 days
      const { data: lockIns } = await supabase
        .from('lock_in_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('lock_date', last7Days[0])
        .order('lock_date', { ascending: true });

      const lockInChart = last7Days.map(date => {
        const lockIn = lockIns?.find(l => l.lock_date === date);
        return {
          date: format(new Date(date), 'MMM dd'),
          time: lockIn ? new Date(lockIn.locked_at).getHours() + new Date(lockIn.locked_at).getMinutes() / 60 : null,
          tasksPlanned: lockIn?.tasks_count || 0,
        };
      });

      setLockInData(lockInChart);

      // Get deleted tasks after lock-in
      const { data: deleted } = await supabase
        .from('deleted_tasks_log')
        .select('*')
        .eq('user_id', userId)
        .eq('was_locked_in', true)
        .gte('deleted_at', new Date(last7Days[0]).toISOString())
        .order('deleted_at', { ascending: false });

      const deletedChart = last7Days.map(date => {
        const count = deleted?.filter(d =>
          format(new Date(d.deleted_at), 'yyyy-MM-dd') === date
        ).length || 0;

        const penalty = deleted?.filter(d =>
          format(new Date(d.deleted_at), 'yyyy-MM-dd') === date
        ).reduce((sum, d) => sum + Math.abs(d.penalty_points || 0), 0) || 0;

        return {
          date: format(new Date(date), 'MMM dd'),
          count,
          penalty,
        };
      });

      setDeletedTasksData(deletedChart);

      // Get timer overruns
      const { data: timers } = await supabase
        .from('task_timers')
        .select('*')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('started_at', new Date(last7Days[0]).toISOString())
        .order('started_at', { ascending: true });

      const timerChart = last7Days.map(date => {
        const dayTimers = timers?.filter(t =>
          format(new Date(t.started_at), 'yyyy-MM-dd') === date
        ) || [];

        const avgOverrun = dayTimers.length > 0
          ? dayTimers.reduce((sum, t) => sum + (t.overrun_minutes || 0), 0) / dayTimers.length
          : 0;

        return {
          date: format(new Date(date), 'MMM dd'),
          overrun: Math.round(avgOverrun * 10) / 10,
          sessions: dayTimers.length,
        };
      });

      setTimerData(timerChart);

      // Calculate commitment rate
      const { data: dailyMetrics } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('metric_date', last7Days[0])
        .order('metric_date', { ascending: false })
        .limit(7);

      if (dailyMetrics && dailyMetrics.length > 0) {
        const avgRate = dailyMetrics.reduce((sum, m) => sum + (m.commitment_rate || 0), 0) / dailyMetrics.length;
        setCommitmentRate(Math.round(avgRate));
      }

    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
        Lock-In & Timer Metrics
      </h2>

      <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {/* Commitment Rate Card */}
        <div className="rounded-2xl bg-card border border-border p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            Commitment Rate (7d avg)
          </h3>
          <div className="text-center">
            <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
              {commitmentRate}%
            </div>
            <div className="text-sm text-muted-foreground">
              Tasks completed vs. planned
            </div>
            <div className="mt-4 w-full bg-muted rounded-full h-3">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                style={{ width: `${commitmentRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lock-In Time Chart */}
        <div className="rounded-xl bg-card border border-border p-4 xl:col-span-2">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Daily Lock-In Time (Last 7 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lockInData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                domain={[6, 24]}
                ticks={[6, 9, 12, 15, 18, 21, 24]}
                label={{ value: 'Hour', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                formatter={(value: any) => {
                  if (value === null) return 'Not locked in';
                  const hours = Math.floor(value);
                  const minutes = Math.round((value - hours) * 60);
                  return `${hours}:${minutes.toString().padStart(2, '0')}`;
                }}
              />
              <Line
                type="monotone"
                dataKey="time"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Overrun Chart */}
        <div className="rounded-xl bg-card border border-border p-4">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Avg Task Overrun (minutes)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={timerData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="overrun">
                {timerData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.overrun > 10 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Deleted Tasks After Lock-In */}
        <div className="rounded-xl bg-card border border-border p-4 xl:col-span-2">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            Tasks Deleted After Lock-In
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={deletedTasksData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="count" fill="hsl(var(--destructive))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
