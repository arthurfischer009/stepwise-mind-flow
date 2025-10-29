import { useState } from "react";
import { Plus, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TaskList } from "./TaskList";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/safeSupabase";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
}

interface TaskPlannerProps {
  tasks: Task[];
  onAddTask: (title: string, category?: string) => void;
  onDeleteTask: (id: string) => void;
}

interface Suggestion {
  title: string;
  category: string;
  reasoning: string;
}

export const TaskPlanner = ({ tasks, onAddTask, onDeleteTask }: TaskPlannerProps) => {
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAddTask(newTask.trim(), category.trim() || undefined);
      setNewTask("");
      // Keep category so it's remembered for next task
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const completedTasks = tasks
        .filter(t => t.completed)
        .map(t => ({ title: t.title, category: t.category }));
      
      const currentCategories = [...new Set(tasks.map(t => t.category).filter(Boolean))];

      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-suggest-tasks', {
        body: { completedTasks, currentCategories }
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      
      if (data.suggestions?.length > 0) {
        toast({
          title: "AI Suggestions Ready!",
          description: `Generated ${data.suggestions.length} task ideas`,
        });
      }
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate suggestions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applySuggestion = (suggestion: Suggestion) => {
    onAddTask(suggestion.title, suggestion.category);
    setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
    toast({
      title: "Task hinzugefügt",
      description: suggestion.title,
    });
  };

  const quickSuggestions = [
    "Review emails",
    "Deep work session",
    "Team meeting prep",
    "Learning time",
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-0.5 flex-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full" />
        <h2 className="text-lg font-bold whitespace-nowrap">Today's Quest</h2>
        <div className="h-0.5 flex-1 bg-gradient-to-r from-accent via-secondary to-primary rounded-full" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What's your next challenge?"
            className="flex-1 bg-card border-border focus:border-primary transition-colors h-9 text-sm"
          />
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="w-28 bg-card border-border focus:border-primary transition-colors h-9 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            className="bg-primary hover:bg-primary/90 transition-all h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </form>

      {/* AI Suggestions Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Suggestions</span>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={loading || tasks.filter(t => t.completed).length === 0}
            variant="outline"
            size="sm"
            className="gap-1.5 h-7 text-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                Get Ideas
              </>
            )}
          </Button>
        </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {Object.entries(
            suggestions.reduce((acc, suggestion) => {
              const cat = suggestion.category || 'Other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(suggestion);
              return acc;
            }, {} as Record<string, Suggestion[]>)
          ).map(([category, items]) => (
            <div key={category} className="space-y-1">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {category}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.slice(0, 4).map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-1.5 rounded bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="font-medium text-xs truncate leading-tight">{suggestion.title}</div>
                      <Plus className="w-3 h-3 flex-shrink-0 text-primary" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

        {tasks.filter(t => t.completed).length === 0 && suggestions.length === 0 && (
          <div className="text-center text-[10px] text-muted-foreground p-2 border border-dashed rounded">
            Complete tasks to unlock AI suggestions
          </div>
        )}
      </div>

      {/* Quick Start Suggestions */}
      {tasks.length === 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick start ideas:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {quickSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setNewTask(suggestion)}
                className="text-left p-2 rounded bg-card border border-border hover:border-primary transition-all text-xs"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <TaskList tasks={tasks} onDeleteTask={onDeleteTask} />
    </div>
  );
};
