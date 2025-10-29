import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-2">
        <div className="text-sm font-medium text-primary uppercase tracking-wider">
          Level {level}
        </div>
        {task.category && categoryColor && (
          <div 
            className="inline-block text-xs text-white font-semibold uppercase tracking-wide px-3 py-1 rounded-full"
            style={{ 
              backgroundColor: categoryColor,
              boxShadow: `0 0 20px ${categoryColor}40`
            }}
          >
            {task.category}
          </div>
        )}
      </div>

      <div className="relative">
        <div 
          className="absolute inset-0 blur-3xl opacity-50 animate-pulse"
          style={{
            background: categoryColor 
              ? `radial-gradient(circle, ${categoryColor}40, transparent 70%)`
              : 'linear-gradient(to right, hsl(var(--primary) / 0.2), hsl(var(--secondary) / 0.2), hsl(var(--accent) / 0.2))'
          }}
        />
        <h1 className="relative text-4xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl px-4">
          {task.title}
        </h1>
      </div>

      <Button
        onClick={onComplete}
        size="lg"
        className="group relative overflow-hidden px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105"
        style={{
          backgroundColor: categoryColor || 'hsl(var(--primary))',
          color: 'white',
          boxShadow: categoryColor ? `0 0 40px ${categoryColor}80` : '0 0 40px hsl(var(--primary) / 0.5)'
        }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 transition-transform group-hover:scale-110" />
          Complete Level
        </span>
      </Button>
    </div>
  );
};
