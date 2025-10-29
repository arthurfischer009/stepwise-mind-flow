import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMinutes } from "date-fns";

interface Task {
  id: string;
  title: string;
  category?: string;
}

interface CurrentLevelProps {
  task: Task | null;
  onComplete: () => void;
  level: number;
  categoryColor?: string;
}

export const CurrentLevel = ({ task, onComplete, level, categoryColor }: CurrentLevelProps) => {
  const now = new Date();
  const endTime = addMinutes(now, 45);
  
  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <CheckCircle2 className="w-16 h-16 text-primary animate-pulse" />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-2">All Clear!</h2>
          <p className="text-muted-foreground">Add tasks to begin your focus journey</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-1">
        <div className="text-xs font-medium text-primary uppercase tracking-wider">
          Level {level}
        </div>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{format(now, 'HH:mm')} - {format(endTime, 'HH:mm')}</span>
          <span className="text-[10px]">(45 min)</span>
        </div>
        {task.category && categoryColor && (
          <div 
            className="inline-block text-[10px] text-white font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
            style={{ 
              backgroundColor: categoryColor,
              boxShadow: `0 0 15px ${categoryColor}40`
            }}
          >
            {task.category}
          </div>
        )}
      </div>

      <div className="relative">
        <div 
          className="absolute inset-0 blur-2xl opacity-40 animate-pulse"
          style={{
            background: categoryColor 
              ? `radial-gradient(circle, ${categoryColor}40, transparent 70%)`
              : 'linear-gradient(to right, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.2), hsl(var(--accent) / 0.2))'
          }}
        />
        <h1 className="relative text-2xl md:text-3xl font-bold leading-tight max-w-2xl px-4">
          {task.title}
        </h1>
      </div>

      <Button
        onClick={onComplete}
        size="sm"
        className="group relative overflow-hidden px-6 py-4 text-base font-semibold transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: categoryColor || 'hsl(var(--primary))',
          color: 'white',
          boxShadow: categoryColor ? `0 0 30px ${categoryColor}80` : '0 0 30px hsl(var(--primary) / 0.5)'
        }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" />
          Complete Level
        </span>
      </Button>
    </div>
  );
};
