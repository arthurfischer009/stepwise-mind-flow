import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/safeSupabase";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
}

interface Suggestion {
  title: string;
  category: string;
  reasoning: string;
}

interface AISuggestionsProps {
  tasks: Task[];
  onAddTask: (title: string, category?: string) => void;
}

export const AISuggestions = ({ tasks, onAddTask }: AISuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
          description: `Generated ${data.suggestions.length} task ideas for you`,
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

  const addSuggestion = (suggestion: Suggestion) => {
    onAddTask(suggestion.title, suggestion.category);
    setSuggestions(prev => prev.filter(s => s.title !== suggestion.title));
    toast({
      title: "Task Added",
      description: "Suggestion added to your quest list",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">AI Suggestions</h3>
        </div>
        <Button
          onClick={generateSuggestions}
          disabled={loading || tasks.filter(t => t.completed).length === 0}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Get Suggestions
            </>
          )}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 hover:border-primary/40 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium mb-1">{suggestion.title}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {suggestion.category}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {suggestion.reasoning}
                  </div>
                </div>
                <Button
                  onClick={() => addSuggestion(suggestion)}
                  size="sm"
                  className="flex-shrink-0"
                >
                  Add
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tasks.filter(t => t.completed).length === 0 && (
        <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg">
          Complete some tasks first to get personalized AI suggestions
        </div>
      )}
    </div>
  );
};