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
    const { completedTasks, currentCategories, specificCategory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    let systemPrompt: string;
    let userPrompt: string;
    let targetCategories: string[];

    if (specificCategory) {
      // Generate suggestions for a specific category only
      targetCategories = [specificCategory];
      
      systemPrompt = `Du bist ein Produktivitäts-KI-Assistent für Focus Quest. 
      Analysiere NUR die abgeschlossenen Tasks des Users in der Kategorie "${specificCategory}".
      
      ABSOLUTE REGEL: Schlage AUSSCHLIESSLICH Tasks vor, die DIREKTE Fortsetzungen oder minimale Variationen der bereits erledigten Arbeit sind.
      
      VERBOTEN:
      - Neue Themen, Projekte oder Bereiche vorschlagen
      - Den Umfang erweitern
      - Kreativ werden oder neue Ideen einbringen
      
      ERLAUBT:
      - Nächste logische Schritte im selben Projekt
      - Ähnliche Tasks mit leichten Variationen
      - Vertiefung bestehender Aufgaben`;

      userPrompt = `Abgeschlossene Tasks in "${specificCategory}": ${JSON.stringify(completedTasks)}
      
      Schlage 3-5 Tasks vor, die EXAKT in die Richtung der bereits erledigten Tasks gehen.
      Bleibe strikt im Rahmen dessen, was der User bereits gemacht hat.
      Alle Vorschläge müssen für "${specificCategory}" sein.`;
    } else {
      // Generate suggestions for all top categories
      const categoryCounts = completedTasks.reduce((acc: Record<string, number>, task: any) => {
        const cat = task.category || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      targetCategories = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([cat]) => cat);

      systemPrompt = `Du bist ein Produktivitäts-KI-Assistent für Focus Quest.
      Analysiere NUR die abgeschlossenen Tasks des Users.
      
      ABSOLUTE REGEL: Schlage für JEDE Top-Kategorie 2-3 Tasks vor, die DIREKTE Fortsetzungen der erledigten Arbeit sind.
      
      STRIKT VERBOTEN:
      - Neue Themen, Projekte oder Bereiche einführen
      - Kreativ sein oder den Scope erweitern
      - Ideen vorschlagen, die nicht direkt auf erledigten Tasks basieren
      
      ERLAUBT:
      - Nächste logische Schritte im selben Projekt
      - Minimale Variationen bestehender Tasks
      - Vertiefung bereits angefangener Arbeit
      
      Maximum 10-15 Vorschläge insgesamt.`;

      userPrompt = `Abgeschlossene Tasks: ${JSON.stringify(completedTasks)}
      Top aktive Kategorien: ${JSON.stringify(targetCategories)}
      
      Für JEDE dieser Kategorien: Schlage 2-3 Follow-up-Tasks vor, die STRIKT den bereits erledigten Tasks ähneln.
      NUR logische nächste Schritte im SELBEN Projekt/Thema.
      KEIN Scope-Creep. Bleib bei dem, was bereits gemacht wurde.
      Max. 10-15 Vorschläge gesamt.`;
    }

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
              name: 'suggest_tasks',
              description: 'Return 2-3 task suggestions per top category, max 10-15 total',
              parameters: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        title: { type: 'string' },
                        category: { type: 'string' },
                        reasoning: { type: 'string' }
                      },
                      required: ['title', 'category', 'reasoning'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['suggestions'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'suggest_tasks' } }
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
    const suggestions = toolCall ? JSON.parse(toolCall.function.arguments).suggestions : [];

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