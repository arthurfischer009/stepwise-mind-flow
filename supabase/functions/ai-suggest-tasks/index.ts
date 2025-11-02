import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { completedTasks } = await req.json();
    
    console.log('Analyzing completed tasks:', completedTasks?.length || 0);

    // Analyze task frequency
    const taskFrequency = new Map<string, { count: number; category: string }>();
    
    (completedTasks || []).forEach((task: any) => {
      const normalized = task.title.toLowerCase().trim();
      const existing = taskFrequency.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        taskFrequency.set(normalized, { 
          count: 1, 
          category: task.category || 'General' 
        });
      }
    });

    // Sort by frequency (most repeated first) and take top 8-10
    const suggestions = Array.from(taskFrequency.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([title, data]) => ({
        title: completedTasks.find((t: any) => 
          t.title.toLowerCase().trim() === title
        )?.title || title,
        category: data.category,
        repeatCount: data.count
      }));

    console.log('Generated suggestions:', suggestions.length);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-suggest-tasks:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
