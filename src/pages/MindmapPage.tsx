import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ReactFlow, 
  Node, 
  Edge, 
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/safeSupabase";
import { useToast } from "@/hooks/use-toast";

interface Task {
  id: string;
  title: string;
  category?: string;
  completed: boolean;
}

interface Relationship {
  from_task_id: string;
  to_task_id: string;
  relationship_type: string;
  strength: number;
}

const MindmapPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const supabase = await getSupabase();
      if (!supabase) {
        toast({ title: "Backend not ready", description: "Refresh the page and try again." });
        return;
      }

      // Load tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: true });

      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // Load relationships
      const { data: relationshipsData, error: relError } = await supabase
        .from('task_relationships')
        .select('*');

      if (relError) throw relError;

      generateMindmap(tasksData || [], relationshipsData || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load mindmap data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMindmap = async (tasksData: Task[], relationshipsData: Relationship[]) => {
    if (tasksData.length === 0) {
      toast({
        title: "No Tasks",
        description: "Add some tasks first to generate a mindmap",
        variant: "destructive",
      });
      return;
    }

    // If no relationships, generate them
    if (relationshipsData.length === 0) {
      await generateRelationships(tasksData);
      return;
    }

    // Group tasks by category
    const categories = new Map<string, Task[]>();
    tasksData.forEach(task => {
      const cat = task.category || 'Uncategorized';
      if (!categories.has(cat)) {
        categories.set(cat, []);
      }
      categories.get(cat)?.push(task);
    });

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create category nodes (central hubs)
    const categoryPositions = new Map<string, { x: number; y: number }>();
    const categoryArray = Array.from(categories.keys());
    const radius = 300;
    const centerX = 400;
    const centerY = 300;

    categoryArray.forEach((category, idx) => {
      const angle = (idx / categoryArray.length) * 2 * Math.PI;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      categoryPositions.set(category, { x, y });

      newNodes.push({
        id: `cat-${category}`,
        type: 'default',
        position: { x, y },
        data: { label: category },
        style: {
          background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
          color: 'white',
          border: '2px solid hsl(var(--primary))',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '14px',
          fontWeight: 'bold',
          minWidth: '120px',
          textAlign: 'center',
        },
      });
    });

    // Create task nodes around their categories
    tasksData.forEach((task, idx) => {
      const cat = task.category || 'Uncategorized';
      const catPos = categoryPositions.get(cat) || { x: centerX, y: centerY };
      const catTasks = categories.get(cat) || [];
      const taskIdx = catTasks.indexOf(task);
      const taskCount = catTasks.length;

      // Position tasks in a circle around their category
      const taskRadius = 150;
      const angle = (taskIdx / taskCount) * 2 * Math.PI;
      const x = catPos.x + taskRadius * Math.cos(angle);
      const y = catPos.y + taskRadius * Math.sin(angle);

      newNodes.push({
        id: task.id,
        type: 'default',
        position: { x, y },
        data: { label: task.title },
        style: {
          background: task.completed ? 'hsl(var(--accent))' : 'hsl(var(--card))',
          color: task.completed ? 'white' : 'hsl(var(--foreground))',
          border: `2px solid ${task.completed ? 'hsl(var(--accent))' : 'hsl(var(--border))'}`,
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          maxWidth: '150px',
          opacity: task.completed ? 0.7 : 1,
        },
      });

      // Connect task to category
      newEdges.push({
        id: `${task.id}-to-cat-${cat}`,
        source: task.id,
        target: `cat-${cat}`,
        type: 'straight',
        style: { stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1, opacity: 0.3 },
        animated: false,
      });
    });

    // Add relationship edges
    relationshipsData.forEach(rel => {
      const sourceExists = tasksData.some(t => t.id === rel.from_task_id);
      const targetExists = tasksData.some(t => t.id === rel.to_task_id);

      if (sourceExists && targetExists) {
        const edgeColor = 
          rel.relationship_type === 'sequential' ? 'hsl(var(--primary))' :
          rel.relationship_type === 'related' ? 'hsl(var(--secondary))' :
          'hsl(var(--accent))';

        newEdges.push({
          id: `${rel.from_task_id}-${rel.to_task_id}`,
          source: rel.from_task_id,
          target: rel.to_task_id,
          type: 'smoothstep',
          animated: rel.relationship_type === 'sequential',
          style: { 
            stroke: edgeColor, 
            strokeWidth: Math.max(1, rel.strength * 3),
            opacity: 0.6 
          },
          label: rel.relationship_type,
          labelStyle: { fontSize: 10, fill: edgeColor },
        });
      }
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const generateRelationships = async (tasksData: Task[]) => {
    try {
      const supabase = await getSupabase();
      if (!supabase) return;

      const { data, error } = await supabase.functions.invoke('ai-generate-mindmap', {
        body: { tasks: tasksData }
      });

      if (error) throw error;

      if (data.relationships?.length > 0) {
        const { error: insertError } = await supabase
          .from('task_relationships')
          .upsert(data.relationships, { onConflict: 'from_task_id,to_task_id' });

        if (insertError) console.error('Error storing relationships:', insertError);
        
        // Reload data to get the new relationships
        await loadData();
        
        toast({
          title: "Mindmap Generated!",
          description: `Created ${data.relationships.length} connections`,
        });
      }
    } catch (error: any) {
      console.error('Error generating relationships:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate mindmap",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Quest
              </Button>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                  Knowledge Network
                </h1>
                <p className="text-sm text-muted-foreground">
                  Visual map of your tasks and their relationships
                </p>
              </div>
            </div>
            <Button
              onClick={loadData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Mindmap */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionMode={ConnectionMode.Loose}
            fitView
            minZoom={0.1}
            maxZoom={4}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: false,
            }}
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                return node.style?.background as string || '#fff';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            {tasks.length === 0 && (
              <Panel position="top-center">
                <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
                  <p className="text-sm text-muted-foreground">
                    No tasks yet. Go back and add some tasks to see your knowledge network!
                  </p>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

export default MindmapPage;
