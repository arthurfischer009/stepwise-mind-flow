import { useState, useEffect } from "react";
import { Calendar, ThumbsUp, ThumbsDown, Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { playClick, playPowerUp, playError } from "@/lib/sounds";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
  points?: number;
  is_priority?: boolean;
}

interface Category {
  name: string;
  color: string;
}

interface AISuggestion {
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
}

interface DailyPlanningDialogProps {
  tasks: Task[];
  onAddTask: (title: string, category?: string) => void;
  onUpdatePriority: (taskId: string, isPriority: boolean) => void;
  categoryColors: { [key: string]: string };
  categories: Category[];
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export const DailyPlanningDialog = ({
  tasks,
  onAddTask,
  categoryColors,
  categories,
  externalOpen,
  onExternalOpenChange,
}: DailyPlanningDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null);
  const [addedTasks, setAddedTasks] = useState<string[]>([]);
  const { toast } = useToast();

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;

  useEffect(() => {
    if (open && suggestions.length === 0) {
      loadSuggestions();
    }
  }, [open]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const pendingTasks = tasks.filter(t => !t.completed);
      
      const { data, error } = await supabase.functions.invoke('ai-suggest-tasks', {
        body: {
          type: 'suggest',
          existingTasks: pendingTasks.map(t => ({ title: t.title, category: t.category })),
          categories: categories.map(c => c.name),
        }
      });

      if (error) throw error;

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
        setCurrentIndex(0);
        setAddedTasks([]);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error: any) {
      console.error('Error loading suggestions:', error);
      playError();
      toast({
        title: "AI Fehler",
        description: "Konnte keine Task-Vorschläge laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = (direction: "left" | "right") => {
    setSwipeDirection(direction);
    playClick();

    setTimeout(() => {
      const current = suggestions[currentIndex];
      
      if (direction === "right" && current) {
        // Task hinzufügen
        onAddTask(current.title, current.category);
        setAddedTasks(prev => [...prev, current.title]);
      }

      // Zum nächsten Vorschlag
      if (currentIndex < suggestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Alle durch - Dialog schließen
        playPowerUp();
        toast({
          title: "Tag geplant!",
          description: `${addedTasks.length + (direction === "right" ? 1 : 0)} Tasks hinzugefügt`,
        });
        setOpen(false);
        setSuggestions([]);
        setCurrentIndex(0);
      }

      setSwipeDirection(null);
    }, 300);
  };

  const currentSuggestion = suggestions[currentIndex];
  const progress = suggestions.length > 0 ? ((currentIndex + 1) / suggestions.length) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "text-red-500";
      case "medium": return "text-yellow-500";
      case "low": return "text-green-500";
      default: return "text-muted-foreground";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full">
          <Calendar className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Plan your day
          </DialogTitle>
          <DialogDescription>
            Swipe nach rechts um Tasks hinzuzufügen, nach links um zu überspringen
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">AI denkt nach...</p>
            </div>
          ) : !currentSuggestion ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Calendar className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground">Keine Vorschläge mehr</p>
              <Button onClick={loadSuggestions} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Neue laden
              </Button>
            </div>
          ) : (
            <>
              {/* Task Card */}
              <div 
                className={`relative bg-gradient-to-br from-card to-card/50 border-2 rounded-2xl p-8 transition-all duration-300 ${
                  swipeDirection === "left" ? "translate-x-[-200%] opacity-0 rotate-[-20deg]" :
                  swipeDirection === "right" ? "translate-x-[200%] opacity-0 rotate-[20deg]" :
                  "translate-x-0 opacity-100 rotate-0"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-bold flex-1">{currentSuggestion.title}</h3>
                    <Badge 
                      variant="outline" 
                      className={getPriorityColor(currentSuggestion.priority)}
                    >
                      {currentSuggestion.priority}
                    </Badge>
                  </div>

                  {currentSuggestion.category && (
                    <Badge 
                      style={{ 
                        backgroundColor: categoryColors[currentSuggestion.category] + '20',
                        borderColor: categoryColors[currentSuggestion.category],
                        color: categoryColors[currentSuggestion.category]
                      }}
                    >
                      {currentSuggestion.category}
                    </Badge>
                  )}

                  <div className="text-sm text-muted-foreground pt-4">
                    {currentIndex + 1} / {suggestions.length}
                  </div>
                </div>
              </div>

              {/* Swipe Buttons */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <Button
                  onClick={() => handleSwipe("left")}
                  variant="outline"
                  size="lg"
                  className="rounded-full w-16 h-16 border-2 border-red-500/50 hover:bg-red-500/10 hover:border-red-500"
                  disabled={swipeDirection !== null}
                >
                  <ThumbsDown className="w-6 h-6 text-red-500" />
                </Button>

                <Button
                  onClick={() => handleSwipe("right")}
                  size="lg"
                  className="rounded-full w-20 h-20 text-lg font-semibold"
                  disabled={swipeDirection !== null}
                >
                  <ThumbsUp className="w-8 h-8" />
                </Button>
              </div>

              {addedTasks.length > 0 && (
                <div className="text-center text-sm text-muted-foreground">
                  {addedTasks.length} Tasks hinzugefügt
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
