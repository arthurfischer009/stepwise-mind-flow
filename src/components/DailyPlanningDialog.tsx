import { useState, useEffect } from "react";
import { Calendar, Loader2, Sparkles, RefreshCw, Sun, CloudSun, Moon, X } from "lucide-react";
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
  repeatCount: number;
  points: number;
}

interface DailyPlanningDialogProps {
  tasks: Task[];
  onAddTask: (title: string, category?: string, points?: number) => void;
  onUpdatePriority: (taskId: string, isPriority: boolean) => void;
  categoryColors: { [key: string]: string };
  categories: Category[];
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  completedCount: number;
}

export const DailyPlanningDialog = ({
  tasks,
  onAddTask,
  categoryColors,
  categories,
  externalOpen,
  onExternalOpenChange,
  completedCount,
}: DailyPlanningDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string | null>(null);
  const [addedTasks, setAddedTasks] = useState<Array<{ title: string; time: string }>>([]);
  const [selectedPoints, setSelectedPoints] = useState(1);
  const { toast } = useToast();

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onExternalOpenChange || setInternalOpen;

  const isUnlocked = true; // Always unlocked - removed 10 task requirement
  const tasksRemaining = 0; // No longer needed

  useEffect(() => {
    if (open && suggestions.length === 0) {
      loadSuggestions();
    }
  }, [open]);

  // Reset points when suggestion changes
  useEffect(() => {
    if (currentSuggestion) {
      setSelectedPoints(currentSuggestion.points || 1);
    }
  }, [currentIndex, suggestions]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const completedTasks = tasks.filter(t => t.completed);
      
      if (completedTasks.length === 0) {
        toast({
          title: "Keine Historie",
          description: "Erledige erst ein paar Tasks, damit ich lernen kann!",
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-suggest-tasks', {
        body: {
          completedTasks: completedTasks.map(t => ({ 
            title: t.title, 
            category: t.category,
            points: t.points || 1
          })),
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
        title: "Fehler",
        description: "Konnte keine Vorschläge laden",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTimeChoice = (time: "morning" | "noon" | "evening" | "skip") => {
    setSwipeDirection(time);
    playClick();

    setTimeout(() => {
      const current = suggestions[currentIndex];
      
      if (time !== "skip" && current) {
        // Task mit Tageszeit-Kategorie hinzufügen
        const timeLabels = {
          morning: "🌅 Morgens",
          noon: "☀️ Mittags", 
          evening: "🌙 Abends"
        };
        
        const timeLabel = timeLabels[time];
        onAddTask(current.title, current.category, selectedPoints);
        setAddedTasks(prev => [...prev, { title: current.title, time: timeLabel }]);
      }

      // Zum nächsten Vorschlag
      if (currentIndex < suggestions.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // Alle durch - Dialog schließen
        playPowerUp();
        toast({
          title: "Tag geplant!",
          description: `${addedTasks.length + (time !== "skip" ? 1 : 0)} Tasks eingeplant`,
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

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isUnlocked) {
      toast({
        title: "🔒 Feature gesperrt",
        description: `Erledige noch ${tasksRemaining} Task${tasksRemaining !== 1 ? 's' : ''}, um "Plan your day" freizuschalten!`,
      });
      return;
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <div className="relative">
          <Button 
            variant="outline" 
            size="icon" 
            className={`rounded-full ${!isUnlocked ? 'opacity-50' : ''}`}
          >
            <Calendar className="w-5 h-5" />
          </Button>
          {!isUnlocked && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="secondary"
            >
              {tasksRemaining}
            </Badge>
          )}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Plan your day
            {isUnlocked && (
              <Badge variant="secondary" className="ml-2">
                Freigeschaltet!
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isUnlocked 
              ? "Aufgaben, die du oft machst - wann möchtest du sie heute erledigen?"
              : `Erledige noch ${tasksRemaining} Task${tasksRemaining !== 1 ? 's' : ''}, um diese Funktion freizuschalten`
            }
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
              <p className="text-sm text-muted-foreground">Analysiere deine Tasks...</p>
            </div>
          ) : !currentSuggestion ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <Calendar className="w-16 h-16 text-muted-foreground" />
              <p className="text-muted-foreground">Keine wiederkehrenden Tasks gefunden</p>
              <Button onClick={loadSuggestions} variant="outline" className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Neu laden
              </Button>
            </div>
          ) : (
            <>
              {/* Task Card */}
              <div 
                className={`relative bg-gradient-to-br from-card to-card/50 border-2 rounded-2xl p-8 transition-all duration-300 ${
                  swipeDirection === "skip" ? "translate-x-[-200%] opacity-0 rotate-[-20deg]" :
                  swipeDirection ? "translate-y-[-200%] opacity-0 scale-95" :
                  "translate-x-0 translate-y-0 opacity-100 scale-100"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-bold flex-1">{currentSuggestion.title}</h3>
                    {currentSuggestion.repeatCount > 1 && (
                      <Badge variant="secondary">
                        {currentSuggestion.repeatCount}x gemacht
                      </Badge>
                    )}
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

                  {/* Points Selector */}
                  <div className="pt-4 space-y-2">
                    <label className="text-sm font-medium">Punkte für diese Aufgabe:</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 5, 8].map((points) => (
                        <Button
                          key={points}
                          variant={selectedPoints === points ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedPoints(points)}
                          disabled={swipeDirection !== null}
                          className="w-12 h-12 rounded-full"
                        >
                          {points}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground pt-4">
                    {currentIndex + 1} / {suggestions.length}
                  </div>
                </div>
              </div>

              {/* Time Choice Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => handleTimeChoice("morning")}
                  variant="outline"
                  size="lg"
                  className="h-16 flex-col gap-1"
                  disabled={swipeDirection !== null}
                >
                  <Sun className="w-5 h-5" />
                  <span className="text-xs">Morgens</span>
                </Button>

                <Button
                  onClick={() => handleTimeChoice("noon")}
                  variant="outline"
                  size="lg"
                  className="h-16 flex-col gap-1"
                  disabled={swipeDirection !== null}
                >
                  <CloudSun className="w-5 h-5" />
                  <span className="text-xs">Mittags</span>
                </Button>

                <Button
                  onClick={() => handleTimeChoice("evening")}
                  variant="outline"
                  size="lg"
                  className="h-16 flex-col gap-1"
                  disabled={swipeDirection !== null}
                >
                  <Moon className="w-5 h-5" />
                  <span className="text-xs">Abends</span>
                </Button>

                <Button
                  onClick={() => handleTimeChoice("skip")}
                  variant="outline"
                  size="lg"
                  className="h-16 flex-col gap-1 border-red-500/50 hover:bg-red-500/10"
                  disabled={swipeDirection !== null}
                >
                  <X className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-red-500">Weg damit</span>
                </Button>
              </div>

              {addedTasks.length > 0 && (
                <div className="text-center text-sm text-muted-foreground space-y-1">
                  <div className="font-semibold">{addedTasks.length} Tasks eingeplant</div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {addedTasks.slice(-3).map((task, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {task.time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
