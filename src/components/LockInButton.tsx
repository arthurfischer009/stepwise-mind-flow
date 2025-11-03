import { Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playClick } from "@/lib/sounds";

interface LockInButtonProps {
  tasks: any[];
  userId?: string;
  onLockIn?: (sessionId: string) => void;
}

export const LockInButton = ({ tasks, userId, onLockIn }: LockInButtonProps) => {
  const [isLockedIn, setIsLockedIn] = useState(false);
  const [lockInTime, setLockInTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Check if already locked in today
  useEffect(() => {
    checkLockInStatus();
  }, [userId]);

  const checkLockInStatus = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('lock_in_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('lock_date', today)
        .maybeSingle(); // Use maybeSingle instead of single to avoid error when no rows

      if (error) {
        console.error('Error checking lock-in status:', error);
        // If table doesn't exist, fall back to localStorage
        const localLockIn = localStorage.getItem(`lock_in_${today}`);
        if (localLockIn) {
          setIsLockedIn(true);
          setLockInTime(localLockIn);
        }
        return;
      }

      if (data) {
        setIsLockedIn(true);
        const time = new Date(data.locked_at).toLocaleTimeString('de-DE', {
          hour: '2-digit',
          minute: '2-digit'
        });
        setLockInTime(time);
        localStorage.setItem(`lock_in_${today}`, time);
      }
    } catch (error) {
      console.error('Error checking lock-in status:', error);
      // Fallback to localStorage
      const today = new Date().toISOString().split('T')[0];
      const localLockIn = localStorage.getItem(`lock_in_${today}`);
      if (localLockIn) {
        setIsLockedIn(true);
        setLockInTime(localLockIn);
      }
    }
  };

  const handleLockIn = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (isLockedIn) {
      toast({
        title: "Already Locked In",
        description: `You locked in today at ${lockInTime}`,
      });
      return;
    }

    setLoading(true);
    playClick();

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Create tasks snapshot
      const tasksSnapshot = tasks.filter(t => !t.completed).map(t => ({
        id: t.id,
        title: t.title,
        category: t.category,
        points: t.points || 1,
        time_period: t.time_period,
      }));

      const lockTime = now.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Try to insert lock-in session
      const { data, error } = await supabase
        .from('lock_in_sessions')
        .insert({
          user_id: userId,
          locked_at: now.toISOString(),
          lock_date: today,
          tasks_count: tasksSnapshot.length,
          tasks_snapshot: tasksSnapshot,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error, using localStorage fallback:', error);
        // Fallback to localStorage if database fails
        localStorage.setItem(`lock_in_${today}`, lockTime);
        localStorage.setItem(`lock_in_snapshot_${today}`, JSON.stringify(tasksSnapshot));

        setIsLockedIn(true);
        setLockInTime(lockTime);

        toast({
          title: "🔒 Locked In!",
          description: `Your ${tasksSnapshot.length} tasks are now committed. (Using local storage)`,
          duration: 5000,
        });

        if (onLockIn) {
          onLockIn(today); // Use date as fallback ID
        }
        return;
      }

      setIsLockedIn(true);
      setLockInTime(lockTime);
      localStorage.setItem(`lock_in_${today}`, lockTime);

      toast({
        title: "🔒 Locked In!",
        description: `Your ${tasksSnapshot.length} tasks are now committed. Deleting tasks will now count as negative points.`,
        duration: 5000,
      });

      if (onLockIn && data) {
        onLockIn(data.id);
      }
    } catch (error: any) {
      console.error('Error locking in:', error);

      // Even if everything fails, use localStorage
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const lockTime = now.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
      });

      localStorage.setItem(`lock_in_${today}`, lockTime);
      setIsLockedIn(true);
      setLockInTime(lockTime);

      toast({
        title: "🔒 Locked In!",
        description: `Your ${tasks.filter(t => !t.completed).length} tasks are committed (offline mode).`,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={isLockedIn ? "secondary" : "default"}
      size="sm"
      onClick={handleLockIn}
      disabled={loading || isLockedIn}
      className="gap-2"
    >
      {isLockedIn ? (
        <>
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">
            Locked {lockInTime}
          </span>
          <span className="sm:hidden">🔒</span>
        </>
      ) : (
        <>
          <Unlock className="w-4 h-4" />
          <span className="hidden sm:inline">
            Lock In Tasks
          </span>
          <span className="sm:hidden">Lock In</span>
        </>
      )}
    </Button>
  );
};
