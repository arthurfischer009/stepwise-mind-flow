import { useState, useEffect } from "react";
import { Network, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/safeSupabase";

interface Task {
  id: string;
  title: string;
  category?: string;
}

interface MindmapViewProps {
  tasks: Task[];
}

export const MindmapView = ({ tasks }: MindmapViewProps) => {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const { toast } = useToast();

  const generateMindmap = async () => {
    if (tasks.length < 3) {
      toast({
        title: "Need More Data",
        description: "Add at least 3 tasks to generate a mindmap",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-generate-mindmap', {
        body: { tasks }
      });

      if (error) throw error;

      // Store relationships in database
      if (data.relationships?.length > 0) {
        const { error: insertError } = await supabase
          .from('task_relationships')
          .upsert(data.relationships, { onConflict: 'from_task_id,to_task_id' });

        if (insertError) console.error('Error storing relationships:', insertError);
      }

      setInsights(data.insights);
      
      toast({
        title: "Mindmap Generated!",
        description: `Found ${data.relationships?.length || 0} connections between your tasks`,
      });
    } catch (error: any) {
      console.error('Error generating mindmap:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate mindmap",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-semibold">Knowledge Network</h3>
        </div>
        <Button
          onClick={generateMindmap}
          disabled={loading || tasks.length < 3}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Network className="w-4 h-4" />
              Generate Map
            </>
          )}
        </Button>
      </div>

      {insights && (
        <div className="space-y-4 p-4 rounded-lg bg-card border border-border">
          {insights.main_themes && insights.main_themes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-primary">Main Themes</h4>
              <div className="flex flex-wrap gap-2">
                {insights.main_themes.map((theme: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {insights.workflow_patterns && insights.workflow_patterns.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-secondary">Workflow Patterns</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {insights.workflow_patterns.map((pattern: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-secondary mt-1">•</span>
                    <span>{pattern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.focus_areas && insights.focus_areas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-accent">Focus Areas</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {insights.focus_areas.map((area: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {tasks.length < 3 && (
        <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg">
          Add at least 3 tasks to generate your knowledge network
        </div>
      )}
    </div>
  );
};