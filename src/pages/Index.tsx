import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CurrentLevel } from "@/components/CurrentLevel";
import { TaskPlanner } from "@/components/TaskPlanner";
import { ProgressStats } from "@/components/ProgressStats";
import { AISuggestions } from "@/components/AISuggestions";
import { AchievementsPanel } from "@/components/AchievementsPanel";
import { AchievementNotification } from "@/components/AchievementNotification";
import { SoundToggle } from "@/components/SoundToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DailyPlanningDialog } from "@/components/DailyPlanningDialog";
import { MorningRitual } from "@/components/MorningRitual";
import { TodayPointsBreakdown } from "@/components/TodayPointsBreakdown";
import { TodayCompletionTimeline } from "@/components/TodayCompletionTimeline";
import { DashboardGrid } from "@/components/DashboardGrid";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { BarChart3, LogOut, Trophy, Target, Clock, CheckCircle2, Star, TrendingUp, Calendar, Award, Zap, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { isWithinInterval, parseISO, format } from "date-fns";
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
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
import { getCustomDayBoundaries } from "@/lib/dateUtils";
import { ACHIEVEMENTS, Achievement, AchievementCheckData } from "@/lib/achievements";
import { triggerLevelUpConfetti, triggerAchievementConfetti } from "@/lib/confetti";
import { 
  playLevelComplete, 
  playAchievementUnlock, 
  playTaskAdded, 
  playTaskDeleted,
  playStreakMilestone,
  playXPGain,
  playError 
} from "@/lib/sounds";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  created_at?: string;
  sort_order?: number;
  points?: number;
  is_priority?: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [level, setLevel] = useState(1);
  const [loading, setLoading] = useState(true);
  const [backendReady, setBackendReady] = useState<boolean | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [showMorningRitual, setShowMorningRitual] = useState(false);
  const [showPlanningDialog, setShowPlanningDialog] = useState(false);
  const [dailyLoginBonus, setDailyLoginBonus] = useState(10);
  const [yesterdayCompleted, setYesterdayCompleted] = useState(0);
  const [planningUnlocked, setPlanningUnlocked] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();

  // Check if "Plan your day" feature should be unlocked
  useEffect(() => {
    const completedCount = tasks.filter(t => t.completed).length;
    const wasUnlocked = localStorage.getItem('planningUnlocked') === 'true';
    
    if (completedCount >= 10 && !wasUnlocked) {
      localStorage.setItem('planningUnlocked', 'true');
      setPlanningUnlocked(true);
      
      // Show unlock notification
      setTimeout(() => {
        toast({
          title: "🎉 Feature freigeschaltet!",
          description: "Du hast 'Plan your day' freigeschaltet! Klicke auf den Kalender-Button.",
          duration: 5000,
        });
        playAchievementUnlock();
        triggerAchievementConfetti('#10b981');
      }, 1000);
    } else if (wasUnlocked) {
      setPlanningUnlocked(true);
    }
  }, [tasks]);

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

  // Save suggestions to localStorage whenever they change
  useEffect(() => {
    if (suggestions.length > 0) {
      localStorage.setItem('aiSuggestions', JSON.stringify(suggestions));
    } else {
      localStorage.removeItem('aiSuggestions');
    }
  }, [suggestions]);

  // Create category to color mapping from database
  const categoryColors = categories.reduce((acc, cat) => {
    acc[cat.name] = cat.color;
    return acc;
  }, {} as { [key: string]: string });

  // Load tasks from database
  useEffect(() => {
    if (user) {
      loadTasks();
      loadAchievements();
      checkDailyLogin();
    }
  }, [user]);

  const checkDailyLogin = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get or create user stats
      let { data: stats, error: fetchError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      // Calculate yesterday's completed tasks
      const { start: yesterdayStart, end: yesterdayEnd } = getCustomDayBoundaries(1);
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('completed', true);
      
      const yesterdayCount = (tasksData || []).filter((t) => {
        if (!t.completed_at) return false;
        const completedDate = parseISO(t.completed_at);
        return isWithinInterval(completedDate, { start: yesterdayStart, end: yesterdayEnd });
      }).length;
      
      setYesterdayCompleted(yesterdayCount);

      if (!stats) {
        // Create new user stats with daily login
        await supabase
          .from('user_stats')
          .insert({
            user_id: user?.id,
            last_login_date: today,
            login_streak: 1,
            longest_streak: 1,
            total_logins: 1,
          });
        
        setShowMorningRitual(true);
        return;
      }

      // Check if it's a new day
      if (stats.last_login_date !== today) {
        // Update login stats
        await supabase
          .from('user_stats')
          .update({
            last_login_date: today,
            total_logins: (stats.total_logins || 0) + 1,
          })
          .eq('user_id', user?.id);

        setShowMorningRitual(true);
      }
    } catch (error) {
      console.error('Error checking daily login:', error);
    }
  };

  const loadAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('achievement_key')
        .order('unlocked_at', { ascending: false });

      if (error) throw error;

      setUnlockedAchievements(data?.map(a => a.achievement_key) || []);
    } catch (error: any) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadTasks = async () => {
    try {
      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;

      // If no tasks returned, try to claim orphaned tasks (mobile safety)
      if (!tasksData || tasksData.length === 0) {
        try {
          await supabase.rpc('claim_orphaned_tasks');
          const { data: retryTasks } = await supabase
            .from('tasks')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: true });
          if (retryTasks) {
            console.log('Loaded tasks after claim:', retryTasks.length);
            setTasks(retryTasks);
            setLevel(1 + (retryTasks.filter(t => t.completed).length || 0));
          }
        } catch (e) {
          console.warn('Auto-claim failed:', e);
        }
      } else {
        console.log('Loaded tasks:', tasksData.length);
        setTasks(tasksData);
        setLevel(1 + (tasksData.filter(t => t.completed).length || 0));
      }

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;
      console.log('Loaded categories:', categoriesData?.length || 0);
      setCategories(categoriesData || []);
    } catch (error: any) {
      console.error('Error loading tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncing(true);
    try {
      await supabase.rpc('reassign_all_tasks_to_current_user');
      await loadTasks();
      toast({
        title: 'Daten synchronisiert! ✅',
        description: 'Alle Tasks und Kategorien wurden deinem Account zugeordnet.',
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        title: 'Fehler',
        description: 'Synchronisierung fehlgeschlagen',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const currentTask = tasks.find((t) => !t.completed) || null;
  
  // Calculate completed today based on custom day (5 AM start)
  const { start: todayStart, end: todayEnd } = getCustomDayBoundaries(0);
  const completedToday = tasks.filter((t) => {
    if (!t.completed || !t.completed_at) return false;
    const completedDate = parseISO(t.completed_at);
    return isWithinInterval(completedDate, { start: todayStart, end: todayEnd });
  }).length;
  
  const totalPoints = tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + (t.points || 1), 0);
  const currentTaskColor = currentTask?.category ? categoryColors[currentTask.category] : undefined;

  // Calculate streak (consecutive days with completed tasks)
  const calculateStreak = () => {
    const completedTasks = tasks
      .filter((t) => t.completed && t.completed_at)
      .sort((a, b) => {
        const dateA = parseISO(a.completed_at!);
        const dateB = parseISO(b.completed_at!);
        return dateB.getTime() - dateA.getTime();
      });

    if (completedTasks.length === 0) return 0;

    let streak = 0;
    let currentDate = new Date();
    
    // Check each previous day
    for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
      const { start: dayStart, end: dayEnd } = getCustomDayBoundaries(-dayOffset);
      
      const hasCompletedTaskOnDay = completedTasks.some((t) => {
        const completedDate = parseISO(t.completed_at!);
        return isWithinInterval(completedDate, { start: dayStart, end: dayEnd });
      });

      if (hasCompletedTaskOnDay) {
        streak++;
      } else {
        // If today (dayOffset === 0) has no completed tasks, we might still be within today
        // so we don't break the streak yet
        if (dayOffset > 0) {
          break;
        }
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();

  const handleAddTask = async (title: string, category?: string, points: number = 1) => {
    try {
      if (!user) {
        toast({ title: "Error", description: "User not authenticated", variant: "destructive" });
        return;
      }

      const maxSortOrder = tasks.length > 0 ? Math.max(...tasks.map(t => t.sort_order || 0)) : 0;

      // Auto-create category in parallel if needed
      const needsNewCategory = category && !categories.find(c => c.name === category);
      
      const categoryColorPalette = [
        'hsl(221, 83%, 53%)',   // Blue
        'hsl(142, 76%, 36%)',   // Green
        'hsl(262, 83%, 58%)',   // Purple
        'hsl(346, 77%, 50%)',   // Red
        'hsl(48, 96%, 53%)',    // Yellow
        'hsl(198, 93%, 60%)',   // Cyan
        'hsl(31, 97%, 52%)',    // Orange
        'hsl(328, 86%, 70%)',   // Pink
      ];

      // Run task and category creation in parallel
      const promises = [
        supabase
          .from('tasks')
          .insert({ title, category, completed: false, sort_order: maxSortOrder + 1, points, user_id: user.id })
          .select()
          .single()
      ];

      if (needsNewCategory) {
        const usedColors = new Set(categories.map(c => c.color));
        const availableColors = categoryColorPalette.filter(color => !usedColors.has(color));
        const defaultColor = availableColors.length > 0 
          ? availableColors[0] 
          : categoryColorPalette[categories.length % categoryColorPalette.length];
        
        promises.push(
          supabase
            .from('categories')
            .insert({ name: category, color: defaultColor, user_id: user.id })
            .select()
            .single()
        );
      }

      const results = await Promise.all(promises);
      const taskResult = results[0];

      if (taskResult.error) throw taskResult.error;

      // Update local state
      setTasks((prev) => [...prev, taskResult.data]);
      
      // Update categories if a new one was created
      if (needsNewCategory && results[1]?.data) {
        setCategories((prev) => [...prev, results[1].data]);
      }

      toast({
        title: "Task Added",
        description: "New challenge accepted!",
      });
      
      // Play sound effect
      playTaskAdded();
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({
        title: "Fehler beim Hinzufügen",
        description: (error && (error as any).message) ? (error as any).message : "Failed to add task",
        variant: "destructive",
      });
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask) return;

    try {
      const completedTaskRef = { ...currentTask };
      
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, completed_at: new Date().toISOString() })
        .eq('id', currentTask.id);

      if (error) throw error;

      const updatedTasks = tasks.map((t) => 
        t.id === currentTask.id ? { ...t, completed: true, completed_at: new Date().toISOString() } : t
      );
      
      setTasks(updatedTasks);
      setLevel((prev) => prev + 1);
      
      // Trigger level-up effects
      triggerLevelUpConfetti();
      playLevelComplete();
      playXPGain();
      
      // Check for new achievements
      await checkAndUnlockAchievements(updatedTasks);
      
      toast({
        title: "Level Complete! 🎉",
        description: `You've reached Level ${level + 1}`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUndoComplete(completedTaskRef.id)}
          >
            Undo
          </Button>
        ),
      });
    } catch (error: any) {
      console.error('Error completing task:', error);
      toast({
        title: "Error",
        description: "Failed to complete task",
        variant: "destructive",
      });
    }
  };

  const checkAndUnlockAchievements = async (updatedTasks: Task[]) => {
    const totalCompleted = updatedTasks.filter(t => t.completed).length;
    const totalPoints = updatedTasks
      .filter((t) => t.completed)
      .reduce((sum, t) => sum + (t.points || 1), 0);
    
    const { start: todayStart, end: todayEnd } = getCustomDayBoundaries(0);
    const completedToday = updatedTasks.filter((t) => {
      if (!t.completed || !t.completed_at) return false;
      const completedDate = parseISO(t.completed_at);
      return isWithinInterval(completedDate, { start: todayStart, end: todayEnd });
    }).length;

    const checkData: AchievementCheckData = {
      totalCompleted,
      currentStreak,
      totalPoints,
      completedToday,
      categories: [...new Set(updatedTasks.map(t => t.category).filter(Boolean) as string[])],
    };

    const newlyUnlocked: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      if (!unlockedAchievements.includes(achievement.key) && achievement.checkUnlock(checkData)) {
        try {
          const { error } = await supabase
            .from('achievements')
            .insert({
              achievement_key: achievement.key,
              user_id: user?.id,
            });

          if (!error) {
            newlyUnlocked.push(achievement);
            setUnlockedAchievements(prev => [...prev, achievement.key]);
          }
        } catch (error) {
          console.error('Error unlocking achievement:', error);
        }
      }
    }

    // Show achievement notifications with delay between each
    newlyUnlocked.forEach((achievement, index) => {
      setTimeout(() => {
        setNewAchievement(achievement);
        triggerAchievementConfetti(achievement.color);
        playAchievementUnlock(achievement.rarity);
      }, index * 3000);
    });

    // Play streak milestone sound if applicable
    if (currentStreak > 0 && (currentStreak % 7 === 0 || currentStreak % 3 === 0)) {
      setTimeout(() => playStreakMilestone(currentStreak), newlyUnlocked.length * 3000 + 500);
    }
  };

  const handleUndoComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: false, completed_at: null })
        .eq('id', taskId);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: false, completed_at: undefined } : t))
      );
      setLevel((prev) => prev - 1);
      
      toast({
        title: "Task restored",
        description: "Task marked as incomplete",
      });
      
      playError();
    } catch (error: any) {
      console.error('Error undoing complete:', error);
      toast({
        title: "Error",
        description: "Failed to undo",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      
      playTaskDeleted();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleReorderTasks = async (reorderedTasks: Task[]) => {
    try {
      setTasks(reorderedTasks);

      // Update sort_order for all reordered tasks
      const updates = reorderedTasks.map((task, index) => ({
        id: task.id,
        sort_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (error: any) {
      console.error('Error reordering tasks:', error);
      toast({
        title: "Error",
        description: "Failed to reorder tasks",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePoints = async (id: string, points: number) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ points })
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, points } : t))
      );
    } catch (error: any) {
      console.error('Error updating points:', error);
      toast({
        title: "Error",
        description: "Failed to update points",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTask = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ title })
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title } : t))
      );
      
      toast({
        title: "Task updated",
        description: "Task title has been updated",
      });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (id: string, category: string | undefined) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ category })
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, category } : t))
      );
      
      toast({
        title: "Category Updated",
        description: category ? `Task assigned to ${category}` : "Category removed",
      });
    } catch (error: any) {
      console.error('Error updating category:', error);
      toast({
        title: "Error",
        description: "Failed to update category",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePriority = async (id: string, isPriority: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_priority: isPriority })
        .eq('id', id);

      if (error) throw error;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_priority: isPriority } : t))
      );
    } catch (error: any) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your quest...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MorningRitual
        open={showMorningRitual}
        onOpenChange={setShowMorningRitual}
        onStartDay={() => setShowPlanningDialog(true)}
        currentStreak={currentStreak}
        todayTasksCount={tasks.filter(t => !t.completed).length}
        yesterdayCompleted={yesterdayCompleted}
        level={level}
        dailyLoginBonus={dailyLoginBonus}
      />
      
      <div className="container max-w-6xl mx-auto px-4 py-4">
        <header className="text-center mb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
              Focus Quest
            </h1>
            <DailyPlanningDialog
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdatePriority={handleUpdatePriority}
              categoryColors={categoryColors}
              categories={categories}
              externalOpen={showPlanningDialog}
              onExternalOpenChange={setShowPlanningDialog}
              completedCount={tasks.filter(t => t.completed).length}
            />
            <AchievementsPanel unlockedAchievements={unlockedAchievements} />
            <SoundToggle />
            <ThemeToggle />
            <Button
              onClick={handleSyncData}
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={syncing}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
            <Button
              onClick={() => setShowMorningRitual(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Star className="w-4 h-4" />
              Morning
            </Button>
            <Button
              onClick={() => navigate('/categories')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Target className="w-4 h-4" />
              Categories
            </Button>
            <Button
              onClick={() => navigate('/analytics')}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </Button>
            <Button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/auth');
              }}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">One task. One level. Total focus. • Day resets at 5 AM</p>
        </header>

        <DashboardGrid
          storageKey="dashboard-layout"
          cards={[
            {
              id: 'progress-stats',
              column: 'left',
              component: (
                <ProgressStats
                  level={level}
                  completedToday={completedToday}
                  totalTasks={tasks.length}
                  totalPoints={totalPoints}
                  currentStreak={currentStreak}
                />
              ),
            },
            {
              id: 'current-level',
              column: 'left',
              component: (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <CurrentLevel
                    task={currentTask}
                    onComplete={handleCompleteTask}
                    level={level}
                    categoryColor={currentTaskColor}
                    categories={categories}
                    onUpdateCategory={handleUpdateCategory}
                  />
                </div>
              ),
            },
            {
              id: 'today-points',
              column: 'left',
              component: (
                <TodayPointsBreakdown
                  tasks={tasks}
                  categoryColors={categoryColors}
                  categories={categories}
                />
              ),
            },
            {
              id: 'today-timeline',
              column: 'left',
              component: (
                <TodayCompletionTimeline
                  tasks={tasks}
                  categoryColors={categoryColors}
                />
              ),
            },
            {
              id: 'task-planner',
              column: 'right',
              component: (
                <div className="rounded-2xl bg-card border border-border p-4">
                  <TaskPlanner
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onDeleteTask={handleDeleteTask}
                    onReorderTasks={handleReorderTasks}
                    onUpdatePoints={handleUpdatePoints}
                    onUpdateTask={handleUpdateTask}
                    categoryColors={categoryColors}
                    categories={categories}
                  />
                </div>
              ),
            },
            {
              id: 'ai-suggestions',
              column: 'right',
              component: (
                <AISuggestions
                  tasks={tasks}
                  suggestions={suggestions}
                  onSuggestionsChange={setSuggestions}
                  onAddTask={handleAddTask}
                  categoryColors={categoryColors}
                />
              ),
            },
          ]}
        />

        {/* Analytics Section */}
        <div className="mt-8 space-y-4">
          <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
            Your Progress Analytics
          </h2>
          
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Completion Rate Card */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Completion Rate
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall</span>
                    <span className="text-sm font-bold">
                      {tasks.length > 0 
                        ? `${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%`
                        : '0%'
                      }
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
                      style={{ 
                        width: tasks.length > 0 
                          ? `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {tasks.filter(t => t.completed).length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-muted-foreground">
                      {tasks.filter(t => !t.completed).length}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Pending</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Level Progress */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Level Progress
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-2">
                    {level}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Level</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {totalPoints}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Total XP</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-500">
                      {currentStreak}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Day Streak</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Progress */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Today's Progress
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary mb-2">
                    {completedToday}
                  </div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
                
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Daily Goal</span>
                    <span className="text-sm font-bold">{completedToday}/5</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((completedToday / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-2xl bg-card border border-border p-6 xl:col-span-2">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Category Breakdown
              </h3>
              <div className="space-y-3">
                {categories.length > 0 ? (
                  categories.map(category => {
                    const categoryTasks = tasks.filter(t => t.category === category.name);
                    const completedInCategory = categoryTasks.filter(t => t.completed).length;
                    const percentage = categoryTasks.length > 0 
                      ? Math.round((completedInCategory / categoryTasks.length) * 100)
                      : 0;

                    return (
                      <div key={category.name}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-sm font-medium">{category.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {completedInCategory}/{categoryTasks.length} ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: category.color
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No categories yet. Add categories to see breakdown.
                  </p>
                )}
              </div>
            </div>

            {/* Weekly Overview */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                Weekly Overview
              </h3>
              <div className="space-y-3">
                {[0, 1, 2, 3, 4, 5, 6].map(dayOffset => {
                  const { start, end } = getCustomDayBoundaries(dayOffset);
                  const completedOnDay = tasks.filter((t) => {
                    if (!t.completed || !t.completed_at) return false;
                    const completedDate = parseISO(t.completed_at);
                    return isWithinInterval(completedDate, { start, end });
                  }).length;

                  return (
                    <div key={dayOffset} className="flex items-center gap-3">
                      <div className="w-16 text-sm text-muted-foreground">
                        {dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Yesterday' : format(start, 'EEE')}
                      </div>
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min((completedOnDay / 10) * 100, 100)}%` }}
                        />
                      </div>
                      <div className="w-8 text-sm font-bold text-right">{completedOnDay}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Priority Tasks */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Priority Focus
              </h3>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-500 mb-2">
                    {tasks.filter(t => t.is_priority && !t.completed).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Priorities</div>
                </div>
                
                <div className="pt-4 border-t border-border space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Completed Today</span>
                    <span className="font-bold">
                      {tasks.filter(t => t.is_priority && t.completed && t.completed_at && 
                        isWithinInterval(parseISO(t.completed_at), { start: todayStart, end: todayEnd })
                      ).length}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Completed</span>
                    <span className="font-bold">
                      {tasks.filter(t => t.is_priority && t.completed).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Best Category */}
            <div className="rounded-2xl bg-card border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                Top Category
              </h3>
              {(() => {
                const categoryStats = categories.map(cat => ({
                  name: cat.name,
                  color: cat.color,
                  completed: tasks.filter(t => t.category === cat.name && t.completed).length
                })).sort((a, b) => b.completed - a.completed);
                
                const topCategory = categoryStats[0];
                
                return topCategory ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div 
                        className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{ backgroundColor: topCategory.color + '20' }}
                      >
                        <div 
                          className="w-12 h-12 rounded-full"
                          style={{ backgroundColor: topCategory.color }}
                        />
                      </div>
                      <div className="text-xl font-bold mb-1">{topCategory.name}</div>
                      <div className="text-3xl font-bold text-primary">{topCategory.completed}</div>
                      <div className="text-sm text-muted-foreground mt-1">Tasks Completed</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Complete tasks to see your top category
                  </div>
                );
              })()}
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="mt-8 space-y-4">
            <h2 className="text-2xl font-bold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
              Progress Charts
            </h2>
            
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Chart: Last 7 Days Progress */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Last 7 Days Progress
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={(() => {
                    return Array.from({ length: 7 }, (_, i) => {
                      const daysAgo = 6 - i;
                      const { start, end } = getCustomDayBoundaries(daysAgo);
                      return {
                        date: format(start, 'MMM dd'),
                        completed: tasks.filter(t => {
                          if (!t.completed || !t.completed_at) return false;
                          const completedDate = parseISO(t.completed_at);
                          return isWithinInterval(completedDate, { start, end });
                        }).length,
                      };
                    });
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Chart: Tasks by Category */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Tasks by Category
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={(() => {
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
                      })()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {(() => {
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
                      })().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Chart: Completion Rate by Category */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Completion Rate by Category
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsBarChart data={(() => {
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
                      completed: data.completed,
                      pending: data.total - data.completed,
                      color: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))'
                    }));
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Bar dataKey="completed">
                      {(() => {
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
                          color: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))'
                        }));
                      })().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    <Bar dataKey="pending" fill="hsl(var(--muted))" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart: XP by Category */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  XP Earned by Category
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RechartsBarChart data={(() => {
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
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Bar dataKey="points">
                      {(() => {
                        const categoryMap = new Map<string, number>();
                        tasks.filter(t => t.completed).forEach(task => {
                          const cat = task.category || 'Uncategorized';
                          categoryMap.set(cat, (categoryMap.get(cat) || 0) + (task.points || 1));
                        });
                        return Array.from(categoryMap.entries()).map(([name, points]) => ({
                          name,
                          color: categories.find(c => c.name === name)?.color || 'hsl(var(--primary))'
                        }));
                      })().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>

              {/* Chart: Cumulative Progress */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Cumulative Progress
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={(() => {
                    const completedTasks = tasks
                      .filter(t => t.completed && t.completed_at)
                      .sort((a, b) => new Date(a.completed_at!).getTime() - new Date(b.completed_at!).getTime());
                    let cumulative = 0;
                    let cumulativePoints = 0;
                    const data = completedTasks.map(task => {
                      cumulative++;
                      cumulativePoints += task.points || 1;
                      return {
                        date: format(parseISO(task.completed_at!), 'MMM dd'),
                        tasks: cumulative,
                        points: cumulativePoints
                      };
                    });
                    return data.filter((_, index, arr) => index === 0 || index === arr.length - 1 || index % Math.ceil(arr.length / 10) === 0);
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="tasks" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="points" stroke="hsl(var(--secondary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart: Task Velocity */}
              <div className="rounded-xl bg-card border border-border p-4">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Task Velocity (14 Days)
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={(() => {
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
                    return last14Days.map((day, index) => {
                      const windowSize = Math.min(3, index + 1);
                      const avg = last14Days
                        .slice(Math.max(0, index - windowSize + 1), index + 1)
                        .reduce((sum, d) => sum + d.completed, 0) / windowSize;
                      return { ...day, avg: Math.round(avg * 10) / 10 };
                    });
                  })()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Legend />
                    <Line type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="avg" stroke="hsl(var(--secondary))" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {newAchievement && (
        <AchievementNotification
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
    </div>
  );
};

export default Index;
