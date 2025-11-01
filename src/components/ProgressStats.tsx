import { Trophy, Target, Zap, Star, Flame } from "lucide-react";

interface ProgressStatsProps {
  level: number;
  completedToday: number;
  totalTasks: number;
  totalPoints: number;
  currentStreak: number;
}

export const ProgressStats = ({ level, completedToday, totalTasks, totalPoints, currentStreak }: ProgressStatsProps) => {
  const stats = [
    {
      icon: Trophy,
      label: "Level",
      value: level,
      color: "text-primary",
    },
    {
      icon: Star,
      label: "Total XP",
      value: totalPoints,
      color: "text-yellow-500",
    },
    {
      icon: Flame,
      label: "Day Streak",
      value: currentStreak,
      color: "text-orange-500",
      highlight: currentStreak > 0,
    },
    {
      icon: Zap,
      label: "Completed Today",
      value: completedToday,
      color: "text-accent",
    },
    {
      icon: Target,
      label: "Remaining",
      value: totalTasks - completedToday,
      color: "text-secondary",
    },
  ];

  return (
    <div className="grid grid-cols-5 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex flex-col items-center p-3 rounded-xl bg-card border transition-all ${
            stat.highlight ? 'border-orange-500 bg-orange-500/5' : 'border-border hover:border-primary/50'
          }`}
        >
          <stat.icon className={`w-5 h-5 mb-1 ${stat.color} ${stat.highlight ? 'animate-pulse' : ''}`} />
          <div className="text-xl font-bold mb-0.5">{stat.value}</div>
          <div className="text-[10px] text-muted-foreground text-center">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};
