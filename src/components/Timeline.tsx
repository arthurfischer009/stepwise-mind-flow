import { format, parseISO, isToday, isYesterday, isThisWeek } from "date-fns";
import { CheckCircle2, Trophy, Star, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  completed_at?: string;
  points?: number;
}

interface TimelineProps {
  tasks: Task[];
  categoryColors: { [key: string]: string };
  achievements?: Array<{
    key: string;
    unlocked_at: string;
    title: string;
    description: string;
  }>;
}

export const Timeline = ({ tasks, categoryColors, achievements = [] }: TimelineProps) => {
  // Combine tasks and achievements into timeline events
  const timelineEvents = [
    ...tasks
      .filter(t => t.completed && t.completed_at)
      .map(task => ({
        type: 'task' as const,
        id: task.id,
        timestamp: task.completed_at!,
        data: task,
      })),
    ...achievements.map(achievement => ({
      type: 'achievement' as const,
      id: achievement.key,
      timestamp: achievement.unlocked_at,
      data: achievement,
    })),
  ].sort((a, b) => {
    const dateA = parseISO(a.timestamp);
    const dateB = parseISO(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  const formatTimelineDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return `Today at ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Yesterday at ${format(date, 'HH:mm')}`;
    if (isThisWeek(date)) return format(date, 'EEEE \'at\' HH:mm');
    return format(date, 'MMM d \'at\' HH:mm');
  };

  if (timelineEvents.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-border p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Activity Timeline
        </h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Complete your first task to start your timeline!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        Activity Timeline
      </h3>
      
      <ScrollArea className="h-[500px] pr-4">
        <div className="relative">
          {/* Timeline vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />
          
          <div className="space-y-6">
            {timelineEvents.map((event, index) => {
              if (event.type === 'task') {
                const task = event.data as Task;
                const categoryColor = task.category ? categoryColors[task.category] : undefined;
                
                return (
                  <div key={event.id} className="relative pl-16 group">
                    {/* Timeline node */}
                    <div className="absolute left-4 w-4 h-4 rounded-full bg-background border-2 border-primary group-hover:scale-125 transition-transform" />
                    
                    {/* Content card */}
                    <div className="bg-muted/50 rounded-lg p-4 hover:bg-muted transition-colors border border-border/50">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-medium">Task Completed</span>
                            {task.points && task.points > 1 && (
                              <Badge variant="outline" className="text-xs">
                                +{task.points} XP
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatTimelineDate(event.timestamp)}
                          </p>
                          <p className="font-medium text-base mb-2">{task.title}</p>
                          {task.category && categoryColor && (
                            <Badge 
                              variant="outline"
                              style={{ 
                                borderColor: categoryColor,
                                color: categoryColor 
                              }}
                            >
                              {task.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const achievement = event.data as any;
                
                return (
                  <div key={event.id} className="relative pl-16 group">
                    {/* Timeline node - special for achievements */}
                    <div className="absolute left-3 w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center group-hover:scale-125 transition-transform shadow-lg">
                      <Star className="w-3 h-3 text-white" />
                    </div>
                    
                    {/* Content card - special styling for achievements */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-lg p-4 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
                      <div className="flex items-start gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Trophy className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-yellow-600 dark:text-yellow-400">Achievement Unlocked!</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {formatTimelineDate(event.timestamp)}
                          </p>
                          <p className="font-bold text-base mb-1">{achievement.title}</p>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};
