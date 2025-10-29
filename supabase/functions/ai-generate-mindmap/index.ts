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
    const { tasks } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI that creates hierarchical knowledge structures from tasks.
    
    Your job:
    1. IDENTIFY core themes/domains from tasks (3-4 main themes max)
    2. GROUP tasks under these themes hierarchically (Level 0: theme → Level 1: subtheme → Level 2: task groups → Level 3: individual tasks)
    3. CREATE connections showing how tasks relate within and across themes
    4. DETECT workflow patterns and dependencies
    
    Create a clear 3-4 level hierarchy where themes naturally emerge from the data.`;

    const userPrompt = `Analyze and organize these tasks into a hierarchical structure:
    ${JSON.stringify(tasks, null, 2)}
    
    Build a 3-4 level hierarchy:
    - Level 0: Main themes/domains (3-4 max)
    - Level 1: Sub-themes or project areas  
    - Level 2: Task clusters
    - Level 3: Individual tasks
    
    Show connections between related items across and within levels.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'create_mindmap',
              description: 'Create hierarchical knowledge structure with 3-4 levels',
              parameters: {
                type: 'object',
                properties: {
                  hierarchy: {
                    type: 'object',
                    properties: {
                      themes: {
                        type: 'array',
                        description: 'Level 0: Main themes (3-4 max)',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            subthemes: {
                              type: 'array',
                              description: 'Level 1: Sub-themes',
                              items: {
                                type: 'object',
                                properties: {
                                  id: { type: 'string' },
                                  name: { type: 'string' },
                                  clusters: {
                                    type: 'array',
                                    description: 'Level 2: Task clusters',
                                    items: {
                                      type: 'object',
                                      properties: {
                                        id: { type: 'string' },
                                        name: { type: 'string' },
                                        task_ids: { 
                                          type: 'array',
                                          description: 'Level 3: Individual task IDs',
                                          items: { type: 'string' }
                                        }
                                      },
                                      required: ['id', 'name', 'task_ids']
                                    }
                                  }
                                },
                                required: ['id', 'name', 'clusters']
                              }
                            }
                          },
                          required: ['id', 'name', 'subthemes']
                        }
                      }
                    },
                    required: ['themes']
                  },
                  relationships: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from_task_id: { type: 'string' },
                        to_task_id: { type: 'string' },
                        relationship_type: { 
                          type: 'string',
                          enum: ['sequential', 'related', 'category', 'prerequisite', 'parallel']
                        },
                        strength: { type: 'number', minimum: 0, maximum: 1 }
                      },
                      required: ['from_task_id', 'to_task_id', 'relationship_type', 'strength']
                    }
                  },
                  insights: {
                    type: 'object',
                    properties: {
                      main_themes: { type: 'array', items: { type: 'string' } },
                      workflow_patterns: { type: 'array', items: { type: 'string' } },
                      focus_areas: { type: 'array', items: { type: 'string' } }
                    }
                  }
                },
                required: ['hierarchy', 'relationships', 'insights'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'create_mindmap' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits depleted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const result = toolCall ? JSON.parse(toolCall.function.arguments) : { relationships: [], insights: {} };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-generate-mindmap:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});