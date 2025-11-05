import { supabase } from "@/integrations/supabase/client";
import { getCustomDayBoundaries } from "./dateUtils";

/**
 * Check and carry over incomplete tasks from previous day
 * This runs at app start to handle tasks that weren't completed by 5 AM
 */
export const processCarryOverTasks = async (userId: string) => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Only process if we're in a new day (after 5 AM)
    if (currentHour < 5) {
      return;
    }

    // Get yesterday's boundaries
    const { start: yesterdayStart, end: yesterdayEnd } = getCustomDayBoundaries(1);
    const yesterdayDate = yesterdayStart.toISOString().split('T')[0];

    // Check if we already processed carry-over for yesterday
    const { data: existingCarryOver } = await supabase
      .from('carried_over_tasks')
      .select('id')
      .eq('user_id', userId)
      .eq('original_date', yesterdayDate)
      .limit(1);

    if (existingCarryOver && existingCarryOver.length > 0) {
      // Already processed
      return;
    }

    // Get yesterday's lock-in session (if any)
    const { data: lockInSession } = await supabase
      .from('lock_in_sessions')
      .select('id, lock_date')
      .eq('user_id', userId)
      .eq('lock_date', yesterdayDate)
      .single();

    // Get all incomplete tasks from yesterday
    const { data: incompleteTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('completed', false)
      .gte('created_at', yesterdayStart.toISOString())
      .lt('created_at', yesterdayEnd.toISOString());

    if (tasksError) throw tasksError;

    if (!incompleteTasks || incompleteTasks.length === 0) {
      return;
    }

    // Process each incomplete task
    for (const task of incompleteTasks) {
      // Log as carried over
      await supabase
        .from('carried_over_tasks')
        .insert({
          user_id: userId,
          task_id: task.id,
          task_title: task.title,
          task_category: task.category,
          task_points: task.points || 1,
          original_time_period: task.time_period || 'night',
          lock_in_session_id: lockInSession?.id,
          original_date: yesterdayDate,
        });

      // Move task to morning of new day
      await supabase
        .from('tasks')
        .update({
          time_period: 'morning',
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id);
    }

    console.log(`Carried over ${incompleteTasks.length} tasks from ${yesterdayDate}`);
  } catch (error) {
    console.error('Error processing carry-over tasks:', error);
  }
};

/**
 * Get carry-over statistics for analytics
 */
export const getCarryOverStats = async (userId: string, daysAgo: number = 7) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('carried_over_tasks')
      .select('*')
      .eq('user_id', userId)
      .gte('original_date', startDateStr)
      .order('original_date', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching carry-over stats:', error);
    return [];
  }
};
