import { Trophy, Target, Zap } from "lucide-react";

interface ProgressStatsProps {
  level: number;
  completedToday: number;
  totalTasks: number;
}

export const ProgressStats = ({ level, completedToday, totalTasks }: ProgressStatsProps) => {
  const stats = [
    {
      icon: Trophy,
      label: "Level",
      value: level,
      color: "text-primary",
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
    <div className="grid grid-cols-3 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex flex-col items-center p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
        >
          <stat.icon className={`w-6 h-6 mb-2 ${stat.color}`} />
          <div className="text-2xl font-bold mb-1">{stat.value}</div>
          <div className="text-xs text-muted-foreground text-center">{stat.label}</div>
        </div>
      ))}
    </div>
  );
};
