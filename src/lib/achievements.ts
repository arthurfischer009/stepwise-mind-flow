import { Trophy, Zap, Target, Star, Award, Crown, Flame, Rocket } from "lucide-react";

export interface Achievement {
  key: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  checkUnlock: (data: AchievementCheckData) => boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementCheckData {
  totalCompleted: number;
  currentStreak: number;
  totalPoints: number;
  completedToday: number;
  categories: string[];
}

export const ACHIEVEMENTS: Achievement[] = [
  // Beginner Achievements
  {
    key: 'first_task',
    title: 'First Steps',
    description: 'Complete your first task',
    icon: Target,
    color: '#10b981',
    rarity: 'common',
    checkUnlock: (data) => data.totalCompleted >= 1,
  },
  {
    key: 'task_5',
    title: 'Getting Started',
    description: 'Complete 5 tasks',
    icon: Zap,
    color: '#3b82f6',
    rarity: 'common',
    checkUnlock: (data) => data.totalCompleted >= 5,
  },
  {
    key: 'task_10',
    title: 'On Fire!',
    description: 'Complete 10 tasks',
    icon: Flame,
    color: '#f97316',
    rarity: 'rare',
    checkUnlock: (data) => data.totalCompleted >= 10,
  },
  
  // Milestone Achievements
  {
    key: 'task_25',
    title: 'Quarter Century',
    description: 'Complete 25 tasks',
    icon: Trophy,
    color: '#eab308',
    rarity: 'rare',
    checkUnlock: (data) => data.totalCompleted >= 25,
  },
  {
    key: 'task_50',
    title: 'Half Century',
    description: 'Complete 50 tasks',
    icon: Award,
    color: '#a855f7',
    rarity: 'epic',
    checkUnlock: (data) => data.totalCompleted >= 50,
  },
  {
    key: 'task_100',
    title: 'Centurion',
    description: 'Complete 100 tasks',
    icon: Crown,
    color: '#ec4899',
    rarity: 'legendary',
    checkUnlock: (data) => data.totalCompleted >= 100,
  },
  
  // Streak Achievements
  {
    key: 'streak_3',
    title: '3-Day Streak',
    description: 'Complete tasks for 3 days in a row',
    icon: Flame,
    color: '#f97316',
    rarity: 'common',
    checkUnlock: (data) => data.currentStreak >= 3,
  },
  {
    key: 'streak_7',
    title: 'Week Warrior',
    description: 'Complete tasks for 7 days in a row',
    icon: Flame,
    color: '#dc2626',
    rarity: 'rare',
    checkUnlock: (data) => data.currentStreak >= 7,
  },
  {
    key: 'streak_14',
    title: 'Fortnight Focus',
    description: 'Complete tasks for 14 days in a row',
    icon: Flame,
    color: '#991b1b',
    rarity: 'epic',
    checkUnlock: (data) => data.currentStreak >= 14,
  },
  {
    key: 'streak_30',
    title: 'Monthly Master',
    description: 'Complete tasks for 30 days in a row',
    icon: Flame,
    color: '#7c2d12',
    rarity: 'legendary',
    checkUnlock: (data) => data.currentStreak >= 30,
  },
  
  // Points Achievements
  {
    key: 'points_100',
    title: 'Century Points',
    description: 'Earn 100 total XP',
    icon: Star,
    color: '#eab308',
    rarity: 'common',
    checkUnlock: (data) => data.totalPoints >= 100,
  },
  {
    key: 'points_500',
    title: 'XP Champion',
    description: 'Earn 500 total XP',
    icon: Star,
    color: '#f59e0b',
    rarity: 'rare',
    checkUnlock: (data) => data.totalPoints >= 500,
  },
  {
    key: 'points_1000',
    title: 'Legendary Grinder',
    description: 'Earn 1000 total XP',
    icon: Rocket,
    color: '#8b5cf6',
    rarity: 'legendary',
    checkUnlock: (data) => data.totalPoints >= 1000,
  },
  
  // Daily Achievements
  {
    key: 'daily_5',
    title: 'Daily Dynamo',
    description: 'Complete 5 tasks in one day',
    icon: Zap,
    color: '#06b6d4',
    rarity: 'rare',
    checkUnlock: (data) => data.completedToday >= 5,
  },
  {
    key: 'daily_10',
    title: 'Productivity Beast',
    description: 'Complete 10 tasks in one day',
    icon: Trophy,
    color: '#8b5cf6',
    rarity: 'epic',
    checkUnlock: (data) => data.completedToday >= 10,
  },
];

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'legendary': return '#ec4899';
    case 'epic': return '#8b5cf6';
    case 'rare': return '#3b82f6';
    default: return '#10b981';
  }
};
