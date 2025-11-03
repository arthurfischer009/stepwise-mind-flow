export type TimePeriod = 'morning' | 'day' | 'evening' | 'night';

export interface TimePeriodInfo {
  id: TimePeriod;
  label: string;
  icon: string;
  timeRange: string;
  startHour: number;
  endHour: number;
  color: string;
  urgencyColor: string;
}

export const TIME_PERIODS: TimePeriodInfo[] = [
  {
    id: 'morning',
    label: 'Morning',
    icon: '🌅',
    timeRange: '5:00 - 10:00',
    startHour: 5,
    endHour: 10,
    color: 'hsl(43, 100%, 70%)',
    urgencyColor: 'hsl(43, 100%, 50%)',
  },
  {
    id: 'day',
    label: 'Day',
    icon: '☀️',
    timeRange: '10:00 - 16:00',
    startHour: 10,
    endHour: 16,
    color: 'hsl(200, 90%, 60%)',
    urgencyColor: 'hsl(200, 90%, 45%)',
  },
  {
    id: 'evening',
    label: 'Evening',
    icon: '🌆',
    timeRange: '16:00 - 21:00',
    startHour: 16,
    endHour: 21,
    color: 'hsl(25, 95%, 65%)',
    urgencyColor: 'hsl(25, 95%, 50%)',
  },
  {
    id: 'night',
    label: 'Night',
    icon: '🌙',
    timeRange: '21:00 - 5:00',
    startHour: 21,
    endHour: 5,
    color: 'hsl(240, 60%, 50%)',
    urgencyColor: 'hsl(240, 60%, 35%)',
  },
];

/**
 * Get the current time period based on the hour of day
 */
export const getCurrentTimePeriod = (): TimePeriod => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 16) return 'day';
  if (hour >= 16 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Get time period info by ID
 */
export const getTimePeriodInfo = (period: TimePeriod): TimePeriodInfo => {
  return TIME_PERIODS.find(p => p.id === period) || TIME_PERIODS[0];
};

/**
 * Check if a time period is currently active (we're in that time range)
 */
export const isTimePeriodActive = (period: TimePeriod): boolean => {
  return getCurrentTimePeriod() === period;
};

/**
 * Get time remaining in current period (in minutes)
 */
export const getTimeRemainingInPeriod = (): number => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentPeriod = getCurrentTimePeriod();
  const periodInfo = getTimePeriodInfo(currentPeriod);
  
  let endHour = periodInfo.endHour;
  
  // Handle night period that crosses midnight
  if (currentPeriod === 'night' && currentHour >= 21) {
    endHour = 24 + 5; // Next day at 5 AM
  }
  
  const minutesRemaining = (endHour * 60) - (currentHour * 60 + currentMinute);
  return minutesRemaining;
};

/**
 * Get time period for a specific date/time
 */
export const getTimePeriodForDate = (date: Date): TimePeriod => {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 16) return 'day';
  if (hour >= 16 && hour < 21) return 'evening';
  return 'night';
};

/**
 * Format time remaining as a human-readable string
 */
export const formatTimeRemaining = (): string => {
  const minutes = getTimeRemainingInPeriod();
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m left`;
  }
  return `${mins}m left`;
};
