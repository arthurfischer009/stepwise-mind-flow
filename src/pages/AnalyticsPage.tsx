import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp, Calendar, Award, Target, Clock, Zap, BarChart3, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/safeSupabase";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { getCustomDayStart, getCustomDayEnd, getCustomDayBoundaries } from "@/lib/dateUtils";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  points?: number;
}

interface Category {
  name: string;
  color: string;
}

const AnalyticsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate('/auth');
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate('/auth');
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({
          title: "Backend not ready",
          description: "Refresh the page to finish Cloud setup.",
        });
        return;
      }

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;

      setTasks(tasksData || []);
      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Chart 1: Tasks completed over last 7 days (custom day starts at 5 AM)
  const getLast7DaysData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i;
      const { start, end } = getCustomDayBoundaries(daysAgo);
      
      return {
        date: format(start, 'MMM dd'),
        completed: tasks.filter(t => {
          if (!t.completed || !t.completed_at) return false;
          const completedDate = parseISO(t.completed_at);
          return isWithinInterval(completedDate, { start, end });
        }).length,
        points: tasks.filter(t => {
          if (!t.completed || !t.completed_at) return false;
          const completedDate = parseISO(t.completed_at);
          return isWithinInterval(completedDate, { start, end });
        }).reduce((sum, t) => sum + (t.points || 1), 0)
      };
    });
    return last7Days;
  };

  // Chart 2: Category distribution (Pie)
  const getCategoryDistribution = () => {
    const categoryMap = new Map<string, number>();
    tasks.forEach(task => {
      const cat = task.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))'
    }));
  };

  // Chart 3: Completion rate by category
  const getCompletionByCategory = () => {
    const categoryMap = new Map<string, { total: number; completed: number }>();
    tasks.forEach(task => {
      const cat = task.category || 'Uncategorized';
      const current = categoryMap.get(cat) || { total: 0, completed: 0 };
      categoryMap.set(cat, {
        total: current.total + 1,
        completed: current.completed + (task.completed ? 1 : 0)
      });
    });
    return Array.from(categoryMap.entries()).map(([name, data]) => ({
      name,
      rate: Math.round((data.completed / data.total) * 100),
      completed: data.completed,
      pending: data.total - data.completed,
      color: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))'
    }));
  };

  // Chart 4: Points by category
  const getPointsByCategory = () => {
    const categoryMap = new Map<string, number>();
    tasks.filter(t => t.completed).forEach(task => {
      const cat = task.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + (task.points || 1));
    });
    return Array.from(categoryMap.entries()).map(([name, points]) => ({
      name,
      points,
      color: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))'
    }));
  };

  // Chart 5: Cumulative progress
  const getCumulativeProgress = () => {
    const completedTasks = tasks
      .filter(t => t.completed && t.completed_at)
      .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());

    let cumulative = 0;
    let cumulativePoints = 0;
    return completedTasks.map(task => {
      cumulative++;
      cumulativePoints += task.points || 1;
      return {
        date: format(parseISO(task.completed_at!), 'MMM dd'),
        tasks: cumulative,
        points: cumulativePoints
      };
    }).filter((_, index, arr) => index === 0 || index === arr.length - 1 || index % Math.ceil(arr.length / 10) === 0);
  };

  // Chart 6: Task velocity (tasks per day average) - custom day
  const getTaskVelocity = () => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const daysAgo = 13 - i;
      const { start, end } = getCustomDayBoundaries(daysAgo);
      
      const completed = tasks.filter(t => {
        if (!t.completed || !t.completed_at) return false;
        const completedDate = parseISO(t.completed_at);
        return isWithinInterval(completedDate, { start, end });
      }).length;
      
      return {
        date: format(start, 'MMM dd'),
        completed,
        avg: 0
      };
    });

    // Calculate moving average
    return last14Days.map((day, index) => {
      const windowSize = Math.min(3, index + 1);
      const avg = last14Days
        .slice(Math.max(0, index - windowSize + 1), index + 1)
        .reduce((sum, d) => sum + d.completed, 0) / windowSize;
      return { ...day, avg: Math.round(avg * 10) / 10 };
    });
  };

  // Chart 7: Category performance radar
  const getCategoryRadarData = () => {
    return getCompletionByCategory().map(cat => ({
      category: cat.name,
      completion: cat.rate,
      tasks: Math.min(100, cat.completed * 10),
      color: cat.color
    }));
  };

  // Chart 8: Weekly comparison (custom day)
  const getWeeklyComparison = () => {
    const thisWeekStart = getCustomDayBoundaries(7).start;
    const thisWeekEnd = getCustomDayBoundaries(0).end;
    const lastWeekStart = getCustomDayBoundaries(14).start;
    const lastWeekEnd = getCustomDayBoundaries(7).end;
    
    const thisWeek = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const completedDate = parseISO(t.completed_at);
      return isWithinInterval(completedDate, {
        start: thisWeekStart,
        end: thisWeekEnd
      });
    }).length;

    const lastWeek = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const completedDate = parseISO(t.completed_at);
      return isWithinInterval(completedDate, {
        start: lastWeekStart,
        end: lastWeekEnd
      });
    }).length;

    return [
      { period: 'Last Week', completed: lastWeek, points: tasks.filter(t => {
        if (!t.completed || !t.completed_at) return false;
        const completedDate = parseISO(t.completed_at);
        return isWithinInterval(completedDate, {
          start: lastWeekStart,
          end: lastWeekEnd
        });
      }).reduce((sum, t) => sum + (t.points || 1), 0) },
      { period: 'This Week', completed: thisWeek, points: tasks.filter(t => {
        if (!t.completed || !t.completed_at) return false;
        const completedDate = parseISO(t.completed_at);
        return isWithinInterval(completedDate, {
          start: thisWeekStart,
          end: thisWeekEnd
        });
      }).reduce((sum, t) => sum + (t.points || 1), 0) }
    ];
  };

  // Chart 9: Points distribution
  const getPointsDistribution = () => {
    const distribution = new Map<number, number>();
    tasks.forEach(task => {
      const points = task.points || 1;
      distribution.set(points, (distribution.get(points) || 0) + 1);
    });
    return Array.from(distribution.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([points, count]) => ({
        points: `${points} XP`,
        count
      }));
  };

  // Chart 10: Overall stats summary
  const getOverallStats = () => {
    const completed = tasks.filter(t => t.completed).length;
    const totalPoints = tasks.filter(t => t.completed).reduce((sum, t) => sum + (t.points || 1), 0);
    const avgPoints = completed > 0 ? Math.round(totalPoints / completed) : 0;
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

    return [
      { metric: 'Total Tasks', value: tasks.length, icon: Target },
      { metric: 'Completed', value: completed, icon: Award },
      { metric: 'Total XP', value: totalPoints, icon: Zap },
      { metric: 'Avg XP/Task', value: avgPoints, icon: TrendingUp },
      { metric: 'Completion %', value: completionRate, icon: BarChart3 },
    ];
  };

  // Monthly Overview: Tasks completed per month
  const getMonthlyTasksOverview = () => {
    const monthlyData = new Map<string, { completed: number; total: number; points: number }>();
    
    tasks.forEach(task => {
      const date = task.completed_at ? parseISO(task.completed_at) : parseISO(task.created_at || new Date().toISOString());
      const monthKey = format(date, 'MMM yyyy');
      
      const current = monthlyData.get(monthKey) || { completed: 0, total: 0, points: 0 };
      monthlyData.set(monthKey, {
        completed: current.completed + (task.completed ? 1 : 0),
        total: current.total + 1,
        points: current.points + (task.completed ? (task.points || 1) : 0)
      });
    });

    return Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const dateA = new Date(a.month);
        const dateB = new Date(b.month);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-6); // Last 6 months
  };

  // Monthly Overview: Best performing days
  const getMonthlyProductiveDays = () => {
    const currentMonth = format(new Date(), 'MMM yyyy');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

    const dailyData = new Map<string, number>();
    
    tasks.filter(t => t.completed && t.completed_at).forEach(task => {
      const taskDate = parseISO(task.completed_at!);
      if (taskDate >= monthStart && taskDate <= monthEnd) {
        const dayKey = format(taskDate, 'MMM dd');
        dailyData.set(dayKey, (dailyData.get(dayKey) || 0) + 1);
      }
    });

    return Array.from(dailyData.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Top 7 days
  };

  // Monthly Overview: Current vs Previous Month
  const getMonthComparison = () => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonth = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const date = parseISO(t.completed_at);
      return date >= currentMonthStart && date <= currentMonthEnd;
    });

    const previousMonth = tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const date = parseISO(t.completed_at);
      return date >= previousMonthStart && date <= previousMonthEnd;
    });

    return [
      {
        period: format(previousMonthStart, 'MMM yyyy'),
        completed: previousMonth.length,
        points: previousMonth.reduce((sum, t) => sum + (t.points || 1), 0)
      },
      {
        period: format(currentMonthStart, 'MMM yyyy'),
        completed: currentMonth.length,
        points: currentMonth.reduce((sum, t) => sum + (t.points || 1), 0)
      }
    ];
  };

  // Monthly Overview: Category distribution this month
  const getMonthlyCategories = () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const categoryMap = new Map<string, number>();
    
    tasks.filter(t => {
      if (!t.completed || !t.completed_at) return false;
      const date = parseISO(t.completed_at);
      return date >= monthStart && date <= monthEnd;
    }).forEach(task => {
      const cat = task.category || 'Uncategorized';
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({
        name,
        value,
        color: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))'
      }))
      .sort((a, b) => b.value - a.value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <header className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                Analytics Dashboard
              </h1>
              <p className="text-sm text-muted-foreground">Track your progress and identify trends</p>
            </div>
          </div>
        </header>

        {/* Overall Stats Cards */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {getOverallStats().map((stat) => (
            <div
              key={stat.metric}
              className="rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition-all"
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4 text-primary" />
                <div className="text-xs text-muted-foreground">{stat.metric}</div>
              </div>
              <div className="text-2xl font-bold">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Chart 1: Daily Progress */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Last 7 Days Progress
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={getLast7DaysData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Category Distribution */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Tasks by Category
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={getCategoryDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {getCategoryDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Completion Rate by Category */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Completion Rate by Category
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getCompletionByCategory()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="completed">
                  {getCompletionByCategory().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Bar dataKey="pending" fill="hsl(var(--muted))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Points by Category */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              XP Earned by Category
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getPointsByCategory()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="points">
                  {getPointsByCategory().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 5: Cumulative Progress */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Cumulative Progress
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getCumulativeProgress()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Line type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="points" stroke="hsl(var(--accent))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 6: Task Velocity */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Task Velocity (14 Days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={getTaskVelocity()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Line type="monotone" dataKey="completed" stroke="hsl(var(--secondary))" strokeWidth={2} />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 7: Category Performance Radar */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Category Performance
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={getCategoryRadarData()}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                <Radar name="Completion %" dataKey="completion" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 8: Weekly Comparison */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Weekly Comparison
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getWeeklyComparison()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="completed" fill="hsl(var(--primary))" />
                <Bar dataKey="points" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 9: Points Distribution */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              XP Distribution
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getPointsDistribution()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="points" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 10: Points per Day */}
          <div className="rounded-xl bg-card border border-border p-4">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              XP Earned (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={getLast7DaysData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Area type="monotone" dataKey="points" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Overview Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-primary" />
            Monthly Overview
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Monthly Tasks Trend */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Last 6 Months Progress
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={getMonthlyTasksOverview()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} name="Completed" />
                  <Area type="monotone" dataKey="points" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} name="XP" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Current vs Previous Month */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Month-over-Month Comparison
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getMonthComparison()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" name="Tasks" />
                  <Bar dataKey="points" fill="hsl(var(--accent))" name="XP" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Productive Days This Month */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Most Productive Days (This Month)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getMonthlyProductiveDays()} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="day" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--secondary))" name="Tasks Completed" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* This Month's Categories */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Category Focus (This Month)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={getMonthlyCategories()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {getMonthlyCategories().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;