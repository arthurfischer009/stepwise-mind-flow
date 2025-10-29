import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
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
  suggestions: Suggestion[];
  onSuggestionsChange: (suggestions: Suggestion[]) => void;
  onAddTask: (title: string, category?: string) => void;
  categoryColors: { [key: string]: string };
}

export const AISuggestions = ({ 
  tasks, 
  suggestions, 
  onSuggestionsChange, 
  onAddTask,
  categoryColors 
}: AISuggestionsProps) => {
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

      onSuggestionsChange(data.suggestions || []);
      
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
    onSuggestionsChange(suggestions.filter(s => s.title !== suggestion.title));
    toast({
      title: "Task Added",
      description: suggestion.title,
    });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">AI Suggestions</h2>
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
              Get Ideas
            </>
          )}
        </Button>
      </div>

      {suggestions.length > 0 ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {Object.entries(
            suggestions.reduce((acc, suggestion) => {
              const cat = suggestion.category || 'Other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(suggestion);
              return acc;
            }, {} as Record<string, Suggestion[]>)
          ).map(([category, items]) => {
            const categoryColor = categoryColors[category] || 'hsl(var(--primary))';
            
            return (
              <div key={category} className="flex-shrink-0 space-y-2">
                <div 
                  className="text-xs font-bold text-white px-3 py-1 rounded-full inline-block"
                  style={{ backgroundColor: categoryColor }}
                >
                  {category}
                </div>
                <div className="space-y-1.5">
                  {items.map((suggestion, index) => (
                    <div
                      key={index}
                      className="w-48 p-2 rounded-md border transition-all cursor-pointer hover:shadow-md"
                      style={{
                        borderColor: categoryColor,
                        background: `linear-gradient(135deg, ${categoryColor}10, ${categoryColor}05)`
                      }}
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-medium leading-tight flex-1">{suggestion.title}</div>
                        <Plus className="w-3 h-3 flex-shrink-0" style={{ color: categoryColor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-lg">
          {tasks.filter(t => t.completed).length === 0 
            ? "Complete some tasks to unlock AI suggestions"
            : "Click 'Get Ideas' to generate personalized task suggestions"}
        </div>
      )}
    </div>
  );
};
