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
  points?: number;
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
    const newSuggestions = suggestions.filter(s => s.title !== suggestion.title);
    onSuggestionsChange(newSuggestions);
    toast({
      title: "Task Added",
      description: suggestion.title,
    });
  };

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <h2 className="text-base font-bold">AI Suggestions</h2>
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

      {suggestions.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {Object.entries(
            suggestions.reduce((acc, suggestion) => {
              const cat = suggestion.category || 'Other';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(suggestion);
              return acc;
            }, {} as Record<string, Suggestion[]>)
  ).map(([category, items]) => {
            // Generate consistent color based on category name if no color exists
            const getCategoryColor = (cat: string): string => {
              if (categoryColors[cat]) return categoryColors[cat];
              
              const palette = [
                'hsl(221, 83%, 53%)',   // Blue
                'hsl(142, 76%, 36%)',   // Green
                'hsl(262, 83%, 58%)',   // Purple
                'hsl(346, 77%, 50%)',   // Red
                'hsl(48, 96%, 53%)',    // Yellow
                'hsl(198, 93%, 60%)',   // Cyan
                'hsl(31, 97%, 52%)',    // Orange
                'hsl(328, 86%, 70%)',   // Pink
              ];
              
              // Use category name to generate consistent index
              const hash = cat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
              return palette[hash % palette.length];
            };
            
            const categoryColor = getCategoryColor(category);
            
            return (
              <div key={category} className="flex-shrink-0 space-y-1.5">
                <div 
                  className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full inline-block"
                  style={{ backgroundColor: categoryColor }}
                >
                  {category}
                </div>
                <div className="space-y-1">
                  {items.map((suggestion, index) => (
                    <div
                      key={index}
                      className="w-40 p-1.5 rounded-md border transition-all cursor-pointer hover:shadow-md"
                      style={{
                        borderColor: categoryColor,
                        background: `linear-gradient(135deg, ${categoryColor}10, ${categoryColor}05)`
                      }}
                      onClick={() => applySuggestion(suggestion)}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-[11px] font-medium leading-tight flex-1">{suggestion.title}</div>
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
        <div className="text-center text-xs text-muted-foreground py-6 border border-dashed rounded-lg">
          {tasks.filter(t => t.completed).length === 0 
            ? "Complete some tasks to unlock AI suggestions"
            : "Click 'Get Ideas' to generate personalized task suggestions"}
        </div>
      )}
    </div>
  );
};
