import { CheckCircle2, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, addMinutes } from "date-fns";

interface Task {
  id: string;
  title: string;
  category?: string;
  points?: number;
}

interface Category {
  name: string;
  color: string;
}

interface CurrentLevelProps {
  task: Task | null;
  onComplete: () => void;
  level: number;
  categoryColor?: string;
  categories?: Category[];
  onUpdateCategory?: (taskId: string, category: string | undefined) => void;
}

export const CurrentLevel = ({ task, onComplete, level, categoryColor, categories = [], onUpdateCategory }: CurrentLevelProps) => {
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
        {onUpdateCategory && categories.length > 0 && (
          <div className="mt-2">
            <Select
              value={task.category || "none"}
              onValueChange={(value) => onUpdateCategory(task.id, value === "none" ? undefined : value)}
            >
              <SelectTrigger 
                className="w-[200px] h-8 text-xs mx-auto"
                style={{
                  borderColor: categoryColor || 'hsl(var(--border))',
                  backgroundColor: categoryColor ? `${categoryColor}15` : 'hsl(var(--card))'
                }}
              >
                <Tag className="w-3 h-3 mr-1.5" />
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-card border border-border shadow-lg z-[100]">
                <SelectItem value="none" className="text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted" />
                    No category
                  </div>
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.name} value={cat.name} className="text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: cat.color }}
                      />
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {task.category && categoryColor && !onUpdateCategory && (
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
        className="group relative overflow-hidden px-6 py-4 text-base font-semibold transition-all duration-300 hover:scale-105 animate-pulse"
        style={{
          backgroundColor: categoryColor || 'hsl(var(--primary))',
          color: 'white',
          boxShadow: categoryColor ? `0 0 30px ${categoryColor}80` : '0 0 30px hsl(var(--primary) / 0.5)',
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
        }}
      >
        <span className="relative z-10 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 transition-transform group-hover:scale-110" />
          Complete Level {task.points && `+${task.points} XP`}
        </span>
      </Button>
    </div>
  );
};
