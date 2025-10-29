import { startOfDay, endOfDay, subDays, addHours } from "date-fns";

// Custom day starts at 5 AM instead of midnight
export const CUSTOM_DAY_START_HOUR = 5;

/**
 * Get the start of the "custom day" (5 AM) for a given date
 */
export const getCustomDayStart = (date: Date): Date => {
  const dayStart = startOfDay(date);
  const customStart = addHours(dayStart, CUSTOM_DAY_START_HOUR);
  
  // If current time is before 5 AM, the custom day started yesterday at 5 AM
  if (date < customStart) {
    return addHours(startOfDay(subDays(date, 1)), CUSTOM_DAY_START_HOUR);
  }
  
  return customStart;
};

/**
 * Get the end of the "custom day" (4:59:59 AM next day)
 */
export const getCustomDayEnd = (date: Date): Date => {
  const customStart = getCustomDayStart(date);
  // End is 24 hours after start (just before next 5 AM)
  return addHours(customStart, 24);
};

/**
 * Get custom day boundaries for X days ago
 */
export const getCustomDayBoundaries = (daysAgo: number = 0): { start: Date; end: Date } => {
  const referenceDate = subDays(new Date(), daysAgo);
  return {
    start: getCustomDayStart(referenceDate),
    end: getCustomDayEnd(referenceDate)
  };
};

/**
 * Format date for display (considers custom day)
 */
export const formatCustomDay = (date: Date): string => {
  const customStart = getCustomDayStart(date);
  return customStart.toLocaleDateString();
};
