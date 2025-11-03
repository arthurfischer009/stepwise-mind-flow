import { Play, Pause, Coffee, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playClick, playTaskAdded } from "@/lib/sounds";
import { Badge } from "@/components/ui/badge";

interface TaskTimerProps {
  task: any;
  userId?: string;
  onTimerComplete?: () => void;
}

export const TaskTimer = ({ task, userId, onTimerComplete }: TaskTimerProps) => {
  const [status, setStatus] = useState<'not_started' | 'running' | 'paused' | 'break' | 'completed'>('not_started');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [isBreakTime, setIsBreakTime] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const WORK_DURATION = 45 * 60; // 45 minutes in seconds
  const BREAK_DURATION = 15 * 60; // 15 minutes in seconds

  // Auto-start timer when task becomes current
  useEffect(() => {
    if (task && !task.completed && status === 'not_started') {
      handleStart();
    }
  }, [task?.id]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Check for work session completion (45 minutes)
  useEffect(() => {
    if (!isBreakTime && elapsedSeconds >= WORK_DURATION && status === 'running') {
      handleWorkSessionComplete();
    }
  }, [elapsedSeconds, isBreakTime, status]);

  // Check for break completion (15 minutes)
  useEffect(() => {
    if (isBreakTime && elapsedSeconds >= BREAK_DURATION && status === 'break') {
      handleBreakComplete();
    }
  }, [elapsedSeconds, isBreakTime, status]);

  const handleStart = async () => {
    if (!userId || !task) return;

    playClick();
    const now = new Date();

    try {
      // Create new timer session
      const { data, error } = await supabase
        .from('task_timers')
        .insert({
          task_id: task.id,
          user_id: userId,
          session_type: 'work',
          started_at: now.toISOString(),
          planned_duration: 45,
        })
        .select()
        .single();

      if (error) throw error;

      setCurrentSessionId(data.id);
      setSessionStartTime(now);
      setStatus('running');
      setElapsedSeconds(0);
      setIsBreakTime(false);

      // Start interval
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Update task status
      await supabase
        .from('tasks')
        .update({
          timer_started_at: now.toISOString(),
          timer_status: 'running'
        })
        .eq('id', task.id);

    } catch (error) {
      console.error('Error starting timer:', error);
      toast({
        title: "Error",
        description: "Failed to start timer",
        variant: "destructive",
      });
    }
  };

  const handlePause = async () => {
    if (!currentSessionId) return;

    playClick();
    clearInterval(intervalRef.current);
    setStatus('paused');

    try {
      await supabase
        .from('tasks')
        .update({
          timer_paused_at: new Date().toISOString(),
          timer_status: 'paused'
        })
        .eq('id', task.id);
    } catch (error) {
      console.error('Error pausing timer:', error);
    }
  };

  const handleResume = () => {
    playClick();
    setStatus(isBreakTime ? 'break' : 'running');

    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  };

  const handleWorkSessionComplete = async () => {
    clearInterval(intervalRef.current);

    try {
      // End current work session
      const actualMinutes = Math.floor(elapsedSeconds / 60);
      const overrun = Math.max(0, actualMinutes - 45);

      if (currentSessionId) {
        await supabase
          .from('task_timers')
          .update({
            ended_at: new Date().toISOString(),
            duration_minutes: actualMinutes,
            overrun_minutes: overrun,
          })
          .eq('id', currentSessionId);
      }

      // Start break
      playTaskAdded();
      toast({
        title: "☕ Time for a break!",
        description: "You've completed 45 minutes. Taking a 15-minute break...",
        duration: 5000,
      });

      // Create break session
      const { data: breakSession } = await supabase
        .from('task_timers')
        .insert({
          task_id: task.id,
          user_id: userId,
          session_type: 'break',
          started_at: new Date().toISOString(),
          planned_duration: 15,
        })
        .select()
        .single();

      setCurrentSessionId(breakSession.id);
      setIsBreakTime(true);
      setStatus('break');
      setElapsedSeconds(0);

      // Restart interval for break
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      await supabase
        .from('tasks')
        .update({ timer_status: 'break' })
        .eq('id', task.id);

    } catch (error) {
      console.error('Error completing work session:', error);
    }
  };

  const handleBreakComplete = async () => {
    clearInterval(intervalRef.current);

    try {
      // End break session
      const actualMinutes = Math.floor(elapsedSeconds / 60);

      if (currentSessionId) {
        await supabase
          .from('task_timers')
          .update({
            ended_at: new Date().toISOString(),
            duration_minutes: actualMinutes,
          })
          .eq('id', currentSessionId);
      }

      playTaskAdded();
      toast({
        title: "💪 Break over!",
        description: "Ready to continue working? Starting next session...",
        duration: 5000,
      });

      // Start new work session automatically
      setIsBreakTime(false);
      handleStart();

    } catch (error) {
      console.error('Error completing break:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const duration = isBreakTime ? BREAK_DURATION : WORK_DURATION;
    return (elapsedSeconds / duration) * 100;
  };

  const getTimeRemaining = () => {
    const duration = isBreakTime ? BREAK_DURATION : WORK_DURATION;
    const remaining = Math.max(0, duration - elapsedSeconds);
    return formatTime(remaining);
  };

  if (!task) return null;

  return (
    <div className="flex items-center gap-3">
      {/* Timer Display */}
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-muted-foreground" />
        <div className="font-mono text-lg font-bold">
          {getTimeRemaining()}
        </div>
      </div>

      {/* Status Badge */}
      {isBreakTime && (
        <Badge variant="secondary" className="gap-1">
          <Coffee className="w-3 h-3" />
          Break
        </Badge>
      )}

      {/* Progress Bar */}
      <div className="flex-1 max-w-[200px]">
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              isBreakTime ? 'bg-green-500' : 'bg-primary'
            }`}
            style={{ width: `${Math.min(getProgress(), 100)}%` }}
          />
        </div>
      </div>

      {/* Controls */}
      {status === 'running' || status === 'break' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handlePause}
          className="gap-2"
        >
          <Pause className="w-4 h-4" />
          <span className="hidden sm:inline">Pause</span>
        </Button>
      ) : status === 'paused' ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResume}
          className="gap-2"
        >
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Resume</span>
        </Button>
      ) : null}
    </div>
  );
};
