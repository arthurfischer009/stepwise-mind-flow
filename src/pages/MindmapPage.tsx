import { useState, useEffect, useMemo } from "react";
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
  Panel,
  NodeTypes
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw, Loader2 } from "lucide-react";
import { getSupabase } from "@/lib/safeSupabase";
import { useToast } from "@/hooks/use-toast";
import { CategoryNode, CategoryNodeData } from "@/components/CategoryNode";
import { TaskNode, TaskNodeData } from "@/components/TaskNode";
import { CentralNode, CentralNodeData } from "@/components/CentralNode";

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
  const [categories, setCategories] = useState<any[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const nodeTypes: NodeTypes = useMemo(() => ({
    central: CentralNode,
    category: CategoryNode,
    task: TaskNode,
  }), []);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (tasks.length > 0) {
      const supabase = getSupabase();
      supabase.then(client => {
        if (client) {
          client.from('task_relationships')
            .select('*')
            .then(({ data }) => {
              if (data) {
                generateMindmap(tasks, data);
              }
            });
        }
      });
    }
  }, [expandedCategories, tasks.length]);

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

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*');

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
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
    const categoriesMap = new Map<string, Task[]>();
    tasksData.forEach(task => {
      const cat = task.category || 'Uncategorized';
      if (!categoriesMap.has(cat)) {
        categoriesMap.set(cat, []);
      }
      categoriesMap.get(cat)?.push(task);
    });

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Level 1: Central node at the top
    const centerX = 600;
    const level1Y = 50;
    
    newNodes.push({
      id: 'central',
      type: 'central',
      position: { x: centerX, y: level1Y },
      data: { 
        label: 'My Quest'
      } as CentralNodeData,
    });

    // Level 2: Categories arranged horizontally below central node
    const categoryArray = Array.from(categoriesMap.keys());
    const level2Y = 200;
    const categorySpacing = 250;
    const totalCategoryWidth = (categoryArray.length - 1) * categorySpacing;
    const categoryStartX = centerX - totalCategoryWidth / 2;

    // Get colors from database categories
    const categoryColorsMap: { [key: string]: string } = {};
    categories.forEach((cat: any) => {
      categoryColorsMap[cat.name] = cat.color;
    });

    categoryArray.forEach((category) => {
      const categoryX = categoryStartX + categoryArray.indexOf(category) * categorySpacing;
      const categoryTasks = categoriesMap.get(category) || [];
      const isExpanded = expandedCategories.has(category);
      const categoryColor = categoryColorsMap[category] || 'hsl(var(--primary))';

      // Create category node
      newNodes.push({
        id: `cat-${category}`,
        type: 'category',
        position: { x: categoryX, y: level2Y },
        data: { 
          label: category,
          taskCount: categoryTasks.length,
          isExpanded,
          onToggle: () => toggleCategory(category),
          color: categoryColor
        } as CategoryNodeData,
      });

      // Connect category to central node
      newEdges.push({
        id: `central-to-cat-${category}`,
        source: 'central',
        target: `cat-${category}`,
        type: 'smoothstep',
        style: { 
          stroke: categoryColor, 
          strokeWidth: 2,
          opacity: 0.6 
        },
        animated: false,
      });

      // Level 3: Tasks arranged vertically below each category (if expanded)
      if (isExpanded) {
        const level3StartY = 370;
        const taskVerticalSpacing = 70;

        categoryTasks.forEach((task, taskIdx) => {
          const taskY = level3StartY + taskIdx * taskVerticalSpacing;

          newNodes.push({
            id: task.id,
            type: 'task',
            position: { x: categoryX, y: taskY },
            data: { 
              label: task.title,
              completed: task.completed
            } as TaskNodeData,
          });

          // Connect task to category
          newEdges.push({
            id: `${task.id}-to-cat-${category}`,
            source: `cat-${category}`,
            target: task.id,
            type: 'smoothstep',
            style: { 
              stroke: 'hsl(var(--border))', 
              strokeWidth: 1.5,
              opacity: 0.4 
            },
            animated: false,
          });
        });

        // Add relationship edges only for visible (expanded) tasks
        relationshipsData.forEach(rel => {
          const sourceTask = categoryTasks.find(t => t.id === rel.from_task_id);
          const targetTask = tasksData.find(t => t.id === rel.to_task_id);
          const targetCategory = targetTask?.category || 'Uncategorized';

          // Only show edge if both tasks are visible (their categories are expanded)
          if (sourceTask && targetTask && expandedCategories.has(targetCategory)) {
            const edgeColor = 
              rel.relationship_type === 'sequential' ? 'hsl(var(--primary))' :
              rel.relationship_type === 'related' ? 'hsl(var(--secondary))' :
              'hsl(var(--accent))';

            newEdges.push({
              id: `rel-${rel.from_task_id}-${rel.to_task_id}`,
              source: rel.from_task_id,
              target: rel.to_task_id,
              type: 'smoothstep',
              animated: rel.relationship_type === 'sequential',
              style: { 
                stroke: edgeColor, 
                strokeWidth: Math.max(1.5, rel.strength * 2.5),
                opacity: 0.5
              },
            });
          }
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
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={2}
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
