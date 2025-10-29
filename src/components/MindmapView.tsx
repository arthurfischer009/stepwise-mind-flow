import { useState } from "react";
import { Network, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getSupabase } from "@/lib/safeSupabase";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Task {
  id: string;
  title: string;
  category?: string;
}

interface MindmapViewProps {
  tasks: Task[];
}

interface Hierarchy {
  themes: Array<{
    id: string;
    name: string;
    subthemes: Array<{
      id: string;
      name: string;
      clusters: Array<{
        id: string;
        name: string;
        task_ids: string[];
      }>;
    }>;
  }>;
}

export const MindmapView = ({ tasks }: MindmapViewProps) => {
  const [loading, setLoading] = useState(false);
  const [hierarchy, setHierarchy] = useState<Hierarchy | null>(null);
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
    setHierarchy(null); // Clear old data
    setInsights(null);
    
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

      console.log('Mindmap response:', data);

      // Store relationships in database
      if (data.relationships?.length > 0) {
        const { error: insertError } = await supabase
          .from('task_relationships')
          .upsert(data.relationships, { onConflict: 'from_task_id,to_task_id' });

        if (insertError) console.error('Error storing relationships:', insertError);
      }

      if (data.hierarchy?.themes?.length > 0) {
        setHierarchy(data.hierarchy);
        setInsights(data.insights);
        
        toast({
          title: "Network Generated!",
          description: `Created ${data.hierarchy.themes.length} themes`,
        });
      } else {
        toast({
          title: "No Structure Found",
          description: "Try adding more tasks with different categories",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error generating mindmap:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Network error - try again",
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

      {loading && (
        <div className="flex items-center justify-center p-8 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Analyzing your tasks...</span>
        </div>
      )}

      {!loading && hierarchy && hierarchy.themes.length > 0 && (
        <div className="space-y-3">
          {hierarchy.themes.map((theme) => (
            <Collapsible key={theme.id} defaultOpen className="rounded-lg border border-primary/30 bg-primary/5">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-primary/10 transition-colors">
                <div className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4 text-primary" />
                  <span className="font-semibold text-primary">{theme.name}</span>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-3 pb-3">
                <div className="space-y-2 ml-6">
                  {theme.subthemes.map((subtheme) => (
                    <Collapsible key={subtheme.id} className="rounded-lg border border-secondary/30 bg-secondary/5">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-secondary/10 transition-colors">
                        <div className="flex items-center gap-2">
                          <ChevronRight className="w-3 h-3 text-secondary" />
                          <span className="text-sm font-medium text-secondary">{subtheme.name}</span>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-2 pb-2">
                        <div className="space-y-1 ml-5">
                          {subtheme.clusters.map((cluster) => (
                            <div key={cluster.id} className="p-2 rounded bg-accent/10 border border-accent/20">
                              <div className="text-xs font-medium text-accent mb-1">{cluster.name}</div>
                              <div className="space-y-0.5">
                                {cluster.task_ids.map((taskId) => {
                                  const task = tasks.find(t => t.id === taskId);
                                  return task ? (
                                    <div key={taskId} className="text-xs text-muted-foreground pl-2 py-0.5">
                                      • {task.title}
                                    </div>
                                  ) : null;
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      )}

      {insights && (
        <div className="space-y-3 p-3 rounded-lg bg-card border border-border text-sm">
          {insights.workflow_patterns && insights.workflow_patterns.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold mb-1 text-secondary">Workflow Patterns</h4>
              <ul className="space-y-0.5 text-xs text-muted-foreground">
                {insights.workflow_patterns.map((pattern: string, i: number) => (
                  <li key={i}>• {pattern}</li>
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