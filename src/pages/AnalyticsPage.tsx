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
import { CarryOverStats } from "@/components/CarryOverStats";

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
    const pushedData = getTasksPushedToNextDay();

    return [
      { metric: 'Total Tasks', value: tasks.length, icon: Target },
      { metric: 'Completed', value: completed, icon: Award },
      { metric: 'Total XP', value: totalPoints, icon: Zap },
      { metric: 'Avg XP/Task', value: avgPoints, icon: TrendingUp },
      { metric: 'Completion %', value: completionRate, icon: BarChart3 },
      { metric: 'Pushed to Next Day', value: pushedData.total, icon: Clock, highlight: true },
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

  // Time Period Analytics: Completion by time period
  const getCompletionByTimePeriod = () => {
    const timePeriodMap = new Map<string, { completed: number; total: number }>();
    
    const timePeriods = [
      { id: 'morning', label: 'Morning', icon: '🌅', color: 'hsl(43, 100%, 70%)' },
      { id: 'day', label: 'Day', icon: '☀️', color: 'hsl(200, 90%, 60%)' },
      { id: 'evening', label: 'Evening', icon: '🌆', color: 'hsl(25, 95%, 65%)' },
      { id: 'night', label: 'Night', icon: '🌙', color: 'hsl(240, 60%, 50%)' }
    ];

    timePeriods.forEach(period => {
      timePeriodMap.set(period.id, { completed: 0, total: 0 });
    });

    tasks.forEach(task => {
      if (!task.completed_at) return;
      const hour = parseISO(task.completed_at).getHours();
      let period = 'night';
      if (hour >= 5 && hour < 10) period = 'morning';
      else if (hour >= 10 && hour < 16) period = 'day';
      else if (hour >= 16 && hour < 21) period = 'evening';
      
      const current = timePeriodMap.get(period) || { completed: 0, total: 0 };
      timePeriodMap.set(period, {
        completed: current.completed + (task.completed ? 1 : 0),
        total: current.total + 1
      });
    });

    return timePeriods.map(period => {
      const data = timePeriodMap.get(period.id) || { completed: 0, total: 0 };
      return {
        name: `${period.icon} ${period.label}`,
        completed: data.completed,
        rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        color: period.color
      };
    });
  };

  // Time Period Analytics: Points by time period
  const getPointsByTimePeriod = () => {
    const timePeriodMap = new Map<string, number>();
    
    const timePeriods = [
      { id: 'morning', label: 'Morning', icon: '🌅', color: 'hsl(43, 100%, 70%)' },
      { id: 'day', label: 'Day', icon: '☀️', color: 'hsl(200, 90%, 60%)' },
      { id: 'evening', label: 'Evening', icon: '🌆', color: 'hsl(25, 95%, 65%)' },
      { id: 'night', label: 'Night', icon: '🌙', color: 'hsl(240, 60%, 50%)' }
    ];

    timePeriods.forEach(period => {
      timePeriodMap.set(period.id, 0);
    });

    tasks.filter(t => t.completed && t.completed_at).forEach(task => {
      const hour = parseISO(task.completed_at!).getHours();
      let period = 'night';
      if (hour >= 5 && hour < 10) period = 'morning';
      else if (hour >= 10 && hour < 16) period = 'day';
      else if (hour >= 16 && hour < 21) period = 'evening';
      
      timePeriodMap.set(period, (timePeriodMap.get(period) || 0) + (task.points || 1));
    });

    return timePeriods.map(period => ({
      name: `${period.icon} ${period.label}`,
      points: timePeriodMap.get(period.id) || 0,
      color: period.color
    }));
  };

  // Time Period Analytics: Average tasks per day by period
  const getAvgTasksByTimePeriod = () => {
    const timePeriodMap = new Map<string, number[]>();
    const dayMap = new Map<string, Set<string>>();
    
    const timePeriods = [
      { id: 'morning', label: 'Morning', icon: '🌅', color: 'hsl(43, 100%, 70%)' },
      { id: 'day', label: 'Day', icon: '☀️', color: 'hsl(200, 90%, 60%)' },
      { id: 'evening', label: 'Evening', icon: '🌆', color: 'hsl(25, 95%, 65%)' },
      { id: 'night', label: 'Night', icon: '🌙', color: 'hsl(240, 60%, 50%)' }
    ];

    timePeriods.forEach(period => {
      timePeriodMap.set(period.id, []);
      dayMap.set(period.id, new Set());
    });

    tasks.filter(t => t.completed && t.completed_at).forEach(task => {
      const date = parseISO(task.completed_at!);
      const hour = date.getHours();
      const dayKey = format(date, 'yyyy-MM-dd');
      
      let period = 'night';
      if (hour >= 5 && hour < 10) period = 'morning';
      else if (hour >= 10 && hour < 16) period = 'day';
      else if (hour >= 16 && hour < 21) period = 'evening';
      
      dayMap.get(period)?.add(dayKey);
      timePeriodMap.get(period)?.push(1);
    });

    return timePeriods.map(period => {
      const tasks = timePeriodMap.get(period.id) || [];
      const days = dayMap.get(period.id)?.size || 1;
      return {
        name: `${period.icon} ${period.label}`,
        avgTasks: Math.round((tasks.length / days) * 10) / 10,
        totalTasks: tasks.length,
        color: period.color
      };
    });
  };

  // Category-Time Period Matrix
  const getCategoryTimePeriodMatrix = () => {
    const matrix = new Map<string, { morning: number; day: number; evening: number; night: number }>();
    
    // Initialize categories
    categories.forEach(cat => {
      matrix.set(cat.name, { morning: 0, day: 0, evening: 0, night: 0 });
    });
    matrix.set('Uncategorized', { morning: 0, day: 0, evening: 0, night: 0 });

    // Count tasks by category and time period
    tasks.filter(t => t.completed && t.completed_at).forEach(task => {
      const hour = parseISO(task.completed_at!).getHours();
      const category = task.category || 'Uncategorized';
      
      let period: 'morning' | 'day' | 'evening' | 'night' = 'night';
      if (hour >= 5 && hour < 10) period = 'morning';
      else if (hour >= 10 && hour < 16) period = 'day';
      else if (hour >= 16 && hour < 21) period = 'evening';
      
      const current = matrix.get(category);
      if (current) {
        current[period]++;
      } else {
        matrix.set(category, { morning: 0, day: 0, evening: 0, night: 0 });
        matrix.get(category)![period] = 1;
      }
    });

    // Convert to array and filter out empty categories
    return Array.from(matrix.entries())
      .filter(([_, counts]) => counts.morning + counts.day + counts.evening + counts.night > 0)
      .map(([category, counts]) => {
        const total = counts.morning + counts.day + counts.evening + counts.night;
        return {
          category,
          morning: counts.morning,
          day: counts.day,
          evening: counts.evening,
          night: counts.night,
          total,
          color: categories.find(c => c.name === category)?.color || 'hsl(var(--muted))',
          // Calculate dominant period
          dominant: Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0] as 'morning' | 'day' | 'evening' | 'night'
        };
      })
      .sort((a, b) => b.total - a.total);
  };

  // Top categories per time period
  const getTopCategoriesPerPeriod = () => {
    const periods = {
      morning: new Map<string, number>(),
      day: new Map<string, number>(),
      evening: new Map<string, number>(),
      night: new Map<string, number>()
    };

    tasks.filter(t => t.completed && t.completed_at).forEach(task => {
      const hour = parseISO(task.completed_at!).getHours();
      const category = task.category || 'Uncategorized';
      
      let period: 'morning' | 'day' | 'evening' | 'night' = 'night';
      if (hour >= 5 && hour < 10) period = 'morning';
      else if (hour >= 10 && hour < 16) period = 'day';
      else if (hour >= 16 && hour < 21) period = 'evening';
      
      periods[period].set(category, (periods[period].get(category) || 0) + 1);
    });

    return {
      morning: Array.from(periods.morning.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count, color: categories.find(c => c.name === name)?.color || 'hsl(var(--muted))' })),
      day: Array.from(periods.day.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count, color: categories.find(c => c.name === name)?.color || 'hsl(var(--muted))' })),
      evening: Array.from(periods.evening.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count, color: categories.find(c => c.name === name)?.color || 'hsl(var(--muted))' })),
      night: Array.from(periods.night.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count, color: categories.find(c => c.name === name)?.color || 'hsl(var(--muted))' }))
    };
  };

  // Tasks Pushed to Next Day Analytics
  const getTasksPushedToNextDay = () => {
    const pushedTasks = tasks.filter(task => {
      if (!task.completed || !task.completed_at) return false;
      
      const createdDate = startOfDay(parseISO(task.created_at));
      const completedDate = startOfDay(parseISO(task.completed_at));
      
      // Task was completed at least 1 day after creation
      return completedDate > createdDate;
    });

    return {
      total: pushedTasks.length,
      percentage: tasks.filter(t => t.completed).length > 0 
        ? Math.round((pushedTasks.length / tasks.filter(t => t.completed).length) * 100)
        : 0,
      tasks: pushedTasks
    };
  };

  const getTasksPushedTrend = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i;
      const { start, end } = getCustomDayBoundaries(daysAgo);
      
      const completedOnDay = tasks.filter(t => {
        if (!t.completed || !t.completed_at) return false;
        const completedDate = parseISO(t.completed_at);
        return isWithinInterval(completedDate, { start, end });
      });

      const pushed = completedOnDay.filter(t => {
        const createdDate = startOfDay(parseISO(t.created_at));
        const completedDate = startOfDay(parseISO(t.completed_at!));
        return completedDate > createdDate;
      }).length;

      const completedSameDay = completedOnDay.length - pushed;
      
      return {
        date: format(start, 'MMM dd'),
        pushed,
        sameDay: completedSameDay,
        total: completedOnDay.length
      };
    });
    return last7Days;
  };

  const getUncompletedFromPreviousDays = () => {
    const today = getCustomDayStart(new Date());
    const yesterday = getCustomDayStart(subDays(new Date(), 1));
    
    return tasks.filter(t => {
      if (t.completed) return false;
      const createdDate = parseISO(t.created_at);
      return createdDate < yesterday;
    }).length;
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
        <div className="grid grid-cols-6 gap-4 mb-6">
          {getOverallStats().map((stat) => (
            <div
              key={stat.metric}
              className={`rounded-xl bg-card border p-4 hover:border-primary/50 transition-all ${
                (stat as any).highlight ? 'border-destructive/50 bg-destructive/5' : 'border-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`w-4 h-4 ${(stat as any).highlight ? 'text-destructive' : 'text-primary'}`} />
                <div className="text-xs text-muted-foreground">{stat.metric}</div>
              </div>
              <div className={`text-2xl font-bold ${(stat as any).highlight ? 'text-destructive' : ''}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Carry Over Stats */}
        {user && (
          <div className="mb-6">
            <CarryOverStats userId={user.id} daysAgo={7} />
          </div>
        )}

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

          {/* Chart: Tasks Pushed to Next Day Trend */}
          <div className="rounded-xl bg-card border border-destructive/50 p-4 bg-destructive/5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-destructive" />
              ⚠️ Tasks Pushed to Next Day (Last 7 Days)
            </h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={getTasksPushedTrend()}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                />
                <Legend />
                <Bar dataKey="sameDay" stackId="a" fill="hsl(var(--primary))" name="Same Day ✓" />
                <Bar dataKey="pushed" stackId="a" fill="hsl(var(--destructive))" name="Pushed ⚠️" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 p-3 rounded-lg bg-background border border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Goal: Minimize red bars</span>
                <span className="font-bold">
                  <span className="text-destructive">{getTasksPushedToNextDay().percentage}%</span>
                  <span className="text-muted-foreground"> of completed tasks were pushed</span>
                </span>
              </div>
            </div>
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

        {/* Time Period Performance Section */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-primary" />
            ⏰ Performance by Time Period
          </h2>
          
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Time Period: Tasks Completed */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Tasks Completed by Time Period
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getCompletionByTimePeriod()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="completed" radius={[8, 8, 0, 0]}>
                    {getCompletionByTimePeriod().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time Period: XP Earned */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                XP Earned by Time Period
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getPointsByTimePeriod()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="points" radius={[8, 8, 0, 0]}>
                    {getPointsByTimePeriod().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time Period: Average Tasks */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Avg Tasks per Day by Period
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getAvgTasksByTimePeriod()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgTasks" radius={[8, 8, 0, 0]}>
                    {getAvgTasksByTimePeriod().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Time Period: Completion Rate Radar */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-primary" />
                Completion Rate by Time Period
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={getCompletionByTimePeriod()}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <PolarRadiusAxis 
                    stroke="hsl(var(--muted-foreground))"
                    domain={[0, 100]}
                  />
                  <Radar 
                    dataKey="rate" 
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.6}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Category-Time Period Analysis */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            📊 Kategorie-Zeitperioden-Analyse
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            Erkenne deine Muster: Welche Kategorien erledigst du wann? Nutze diese Insights für optimale Aufgabenplanung.
          </p>
          
          <div className="grid gap-6">
            {/* Category-Time Matrix Heatmap */}
            <div className="rounded-xl bg-card border border-border p-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Kategorie-Zeitperioden-Matrix
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Kategorie</th>
                      <th className="text-center py-3 px-4 font-semibold">🌅 Morgen</th>
                      <th className="text-center py-3 px-4 font-semibold">☀️ Tag</th>
                      <th className="text-center py-3 px-4 font-semibold">🌆 Abend</th>
                      <th className="text-center py-3 px-4 font-semibold">🌙 Nacht</th>
                      <th className="text-center py-3 px-4 font-semibold">Gesamt</th>
                      <th className="text-left py-3 px-4 font-semibold">Hauptzeit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getCategoryTimePeriodMatrix().map((row) => {
                      const max = Math.max(row.morning, row.day, row.evening, row.night);
                      return (
                        <tr key={row.category} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: row.color }}
                              />
                              <span className="font-medium">{row.category}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div 
                              className="inline-block px-3 py-1 rounded-full font-semibold transition-all"
                              style={{ 
                                backgroundColor: row.morning > 0 
                                  ? `hsl(43, 100%, ${100 - (row.morning / max) * 30}%)` 
                                  : 'transparent',
                                color: row.morning === max && row.morning > 0 ? '#000' : 'hsl(var(--foreground))'
                              }}
                            >
                              {row.morning}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div 
                              className="inline-block px-3 py-1 rounded-full font-semibold transition-all"
                              style={{ 
                                backgroundColor: row.day > 0 
                                  ? `hsl(200, 90%, ${100 - (row.day / max) * 40}%)` 
                                  : 'transparent',
                                color: row.day === max && row.day > 0 ? '#000' : 'hsl(var(--foreground))'
                              }}
                            >
                              {row.day}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div 
                              className="inline-block px-3 py-1 rounded-full font-semibold transition-all"
                              style={{ 
                                backgroundColor: row.evening > 0 
                                  ? `hsl(25, 95%, ${100 - (row.evening / max) * 35}%)` 
                                  : 'transparent',
                                color: row.evening === max && row.evening > 0 ? '#000' : 'hsl(var(--foreground))'
                              }}
                            >
                              {row.evening}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <div 
                              className="inline-block px-3 py-1 rounded-full font-semibold transition-all"
                              style={{ 
                                backgroundColor: row.night > 0 
                                  ? `hsl(240, 60%, ${100 - (row.night / max) * 50}%)` 
                                  : 'transparent',
                                color: row.night === max && row.night > 0 ? '#fff' : 'hsl(var(--foreground))'
                              }}
                            >
                              {row.night}
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 font-bold">{row.total}</td>
                          <td className="py-3 px-4">
                            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ 
                              backgroundColor: row.dominant === 'morning' ? 'hsl(43, 100%, 70%)' :
                                              row.dominant === 'day' ? 'hsl(200, 90%, 60%)' :
                                              row.dominant === 'evening' ? 'hsl(25, 95%, 65%)' : 
                                              'hsl(240, 60%, 50%)',
                              color: row.dominant === 'night' ? '#fff' : '#000'
                            }}>
                              {row.dominant === 'morning' ? '🌅 Morgen' :
                               row.dominant === 'day' ? '☀️ Tag' :
                               row.dominant === 'evening' ? '🌆 Abend' : '🌙 Nacht'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Categories per Time Period */}
            <div className="grid lg:grid-cols-4 gap-4">
              {(() => {
                const topCategories = getTopCategoriesPerPeriod();
                const periods = [
                  { key: 'morning' as const, label: 'Morgen', icon: '🌅', color: 'hsl(43, 100%, 70%)' },
                  { key: 'day' as const, label: 'Tag', icon: '☀️', color: 'hsl(200, 90%, 60%)' },
                  { key: 'evening' as const, label: 'Abend', icon: '🌆', color: 'hsl(25, 95%, 65%)' },
                  { key: 'night' as const, label: 'Nacht', icon: '🌙', color: 'hsl(240, 60%, 50%)' }
                ];

                return periods.map(period => (
                  <div 
                    key={period.key}
                    className="rounded-xl border border-border p-4 transition-all hover:shadow-lg"
                    style={{ 
                      backgroundColor: `${period.color}15`,
                      borderColor: period.color
                    }}
                  >
                    <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                      <span className="text-xl">{period.icon}</span>
                      <span style={{ color: period.color }}>{period.label}</span>
                    </h4>
                    <div className="space-y-2">
                      {topCategories[period.key].length > 0 ? (
                        topCategories[period.key].map((cat, idx) => (
                          <div 
                            key={cat.name}
                            className="flex items-center justify-between p-2 rounded-lg"
                            style={{ backgroundColor: 'hsl(var(--background))' }}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-xs font-bold text-muted-foreground">{idx + 1}.</span>
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0" 
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="text-xs font-medium truncate">{cat.name}</span>
                            </div>
                            <span className="text-xs font-bold ml-2" style={{ color: period.color }}>
                              {cat.count}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Keine Daten</p>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
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