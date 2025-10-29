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

    const systemPrompt = `You are an AI that analyzes task relationships to create knowledge graphs.
    Identify connections between tasks based on:
    - Shared categories or themes
    - Sequential dependencies (one task leads to another)
    - Related subject matter or skills
    - Workflow patterns
    
    Return relationships with strength (0-1) indicating connection intensity.`;

    const userPrompt = `Analyze these tasks and identify meaningful relationships:
    ${JSON.stringify(tasks, null, 2)}
    
    Create a network of connections showing how these tasks relate to each other.`;

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
              description: 'Create task relationship network for mindmap visualization',
              parameters: {
                type: 'object',
                properties: {
                  relationships: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        from_task_id: { type: 'string' },
                        to_task_id: { type: 'string' },
                        relationship_type: { 
                          type: 'string',
                          enum: ['sequential', 'related', 'category', 'skill', 'prerequisite']
                        },
                        strength: { type: 'number', minimum: 0, maximum: 1 }
                      },
                      required: ['from_task_id', 'to_task_id', 'relationship_type', 'strength'],
                      additionalProperties: false
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
                required: ['relationships', 'insights'],
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