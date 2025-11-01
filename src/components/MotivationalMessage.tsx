import { useEffect, useState } from "react";
import { Sparkles, TrendingUp, Target, Zap } from "lucide-react";

interface MotivationalMessageProps {
  completedToday: number;
  currentStreak: number;
  level: number;
}

const MESSAGES = {
  morning: [
    "Good morning! Let's make today count! ☀️",
    "Rise and shine! Your tasks are waiting! 🌅",
    "New day, new victories! Let's go! 🚀",
    "Morning warrior! Time to conquer! ⚡",
  ],
  streak_high: [
    "🔥 STREAK_DAYS-day streak! You're absolutely crushing it!",
    "Unstoppable! Your consistency is inspiring! 💪",
    "Legend status achieved! Keep going! 👑",
    "You're on fire! This momentum is incredible! 🌟",
  ],
  completed_low: [
    "Every journey starts with a single task! 🎯",
    "You've got this! Take it one task at a time! 💪",
    "Small steps lead to big wins! Start now! ✨",
    "Your future self will thank you! Let's begin! 🚀",
  ],
  completed_medium: [
    "Great progress! You're building momentum! 🎉",
    "Nicely done! Keep that energy going! ⚡",
    "You're in the zone! Stay focused! 🎯",
    "Excellent work! You're making it happen! 🌟",
  ],
  completed_high: [
    "Phenomenal! You're a productivity machine! 🚀",
    "Incredible work today! You're crushing it! 💥",
    "Wow! This is what excellence looks like! 👑",
    "Absolutely amazing! You're unstoppable! 🔥",
  ],
  level_milestone: [
    "Level LEVEL_NUM! Your growth is remarkable! 🎉",
    "New level unlocked! You're evolving! 🌟",
    "Level up! Your dedication is paying off! 💪",
    "Achievement unlocked! You're leveling up! 🏆",
  ],
};

export const MotivationalMessage = ({ completedToday, currentStreak, level }: MotivationalMessageProps) => {
  const [message, setMessage] = useState("");
  const [icon, setIcon] = useState<"sparkles" | "trending" | "target" | "zap">("sparkles");

  useEffect(() => {
    generateMessage();
  }, [completedToday, currentStreak, level]);

  const generateMessage = () => {
    const hour = new Date().getHours();
    
    // Morning message (5 AM - 10 AM)
    if (hour >= 5 && hour < 10) {
      const msg = MESSAGES.morning[Math.floor(Math.random() * MESSAGES.morning.length)];
      setMessage(msg);
      setIcon("sparkles");
      return;
    }

    // High streak (7+ days)
    if (currentStreak >= 7) {
      const msg = MESSAGES.streak_high[Math.floor(Math.random() * MESSAGES.streak_high.length)]
        .replace('STREAK_DAYS', currentStreak.toString());
      setMessage(msg);
      setIcon("zap");
      return;
    }

    // Level milestone (every 10 levels)
    if (level % 10 === 0 && level > 0) {
      const msg = MESSAGES.level_milestone[Math.floor(Math.random() * MESSAGES.level_milestone.length)]
        .replace('LEVEL_NUM', level.toString());
      setMessage(msg);
      setIcon("trending");
      return;
    }

    // Based on completed today
    if (completedToday === 0) {
      const msg = MESSAGES.completed_low[Math.floor(Math.random() * MESSAGES.completed_low.length)];
      setMessage(msg);
      setIcon("target");
    } else if (completedToday < 5) {
      const msg = MESSAGES.completed_medium[Math.floor(Math.random() * MESSAGES.completed_medium.length)];
      setMessage(msg);
      setIcon("trending");
    } else {
      const msg = MESSAGES.completed_high[Math.floor(Math.random() * MESSAGES.completed_high.length)];
      setMessage(msg);
      setIcon("zap");
    }
  };

  const IconComponent = {
    sparkles: Sparkles,
    trending: TrendingUp,
    target: Target,
    zap: Zap,
  }[icon];

  return (
    <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 p-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-6 h-6 text-primary-foreground" />
        </div>
        <p className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
          {message}
        </p>
      </div>
    </div>
  );
};
