import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const baseInstruction = `REGRAS IMPORTANTES:
- Responda SEMPRE com frases MUITO curtas (máximo 1-2 linhas).
- Use emojis para tornar a mensagem visual.
- NUNCA escreva parágrafos longos.
- Fale como se estivesse conversando com uma criança de 6-12 anos.
- Seja carinhoso, paciente e encorajador.
- SEMPRE forneça opções de resposta para a criança escolher.
- Cada opção deve ter um emoji e um texto curto (2-4 palavras).
- Forneça entre 2 e 4 opções.
- Responda sempre em português brasileiro.`;

const activityPrompts: Record<string, string> = {
  "cumprimentar": `Você é TEAbot, um amigo que ensina crianças com autismo a cumprimentar pessoas. ${baseInstruction}\nSimule situações simples de cumprimentos do dia a dia.`,
  "pedir-ajuda": `Você é TEAbot, um amigo que ensina crianças com autismo a pedir ajuda. ${baseInstruction}\nCrie situações simples onde a criança precisa pedir ajuda.`,
  "fazer-amigos": `Você é TEAbot, um amigo que ensina crianças com autismo a fazer amigos. ${baseInstruction}\nSimule situações de conhecer alguém novo.`,
  "reconhecer-emocoes": `Você é TEAbot, um amigo que ensina crianças com autismo a reconhecer emoções. ${baseInstruction}\nDescreva situações e pergunte como a pessoa se sente. Use emojis de emoções.`,
  "compartilhar": `Você é TEAbot, um amigo que ensina crianças com autismo a compartilhar e esperar a vez. ${baseInstruction}\nSimule situações de brincadeiras em grupo.`,
  "desafio-do-dia": `Você é TEAbot dando um Desafio do Dia divertido para uma criança com autismo. ${baseInstruction}\nEscolha uma habilidade social e crie um mini desafio.`,
};

const defaultPrompt = `Você é TEAbot, um amigo que ajuda crianças com autismo. ${baseInstruction}`;

const responseToolDef = {
  type: "function",
  function: {
    name: "send_message",
    description: "Send a message to the child with clickable response options",
    parameters: {
      type: "object",
      properties: {
        message: {
          type: "string",
          description: "Short message to the child (max 2 sentences, with emojis)",
        },
        options: {
          type: "array",
          description: "2-4 clickable response options for the child",
          items: {
            type: "object",
            properties: {
              emoji: { type: "string", description: "A single emoji representing the option" },
              label: { type: "string", description: "Short label (2-4 words)" },
            },
            required: ["emoji", "label"],
            additionalProperties: false,
          },
        },
      },
      required: ["message", "options"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, activityId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = activityPrompts[activityId] || defaultPrompt;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        stream: false,
        tools: [responseToolDef],
        tool_choice: { type: "function", function: { name: "send_message" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens! Espere um pouquinho." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    
    // Parse tool call response
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        return new Response(JSON.stringify({
          content: parsed.message || "Olá! 😊",
          options: parsed.options || [],
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch {
        // Fall through to content fallback
      }
    }

    // Fallback to regular content
    const content = data.choices?.[0]?.message?.content || "Olá! Como posso te ajudar? 😊";
    return new Response(JSON.stringify({ content, options: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
