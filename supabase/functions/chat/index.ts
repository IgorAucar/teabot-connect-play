import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const activityPrompts: Record<string, string> = {
  "cumprimentar":
    "Você é um assistente amigável chamado TEAbot que ajuda crianças com autismo a praticar cumprimentos. Responda de forma simples, encorajadora. Simule situações cotidianas de cumprimentos. Elogie sempre o esforço da criança. Use linguagem simples adequada para crianças de 6-12 anos. Responda sempre em português.",
  "pedir-ajuda":
    "Você é TEAbot, um assistente que ajuda crianças com autismo a aprender como pedir ajuda. Crie situações onde a criança precisa pedir ajuda (ex: não entendeu uma tarefa, perdeu um objeto). Responda com encorajamento, linguagem simples. Responda sempre em português.",
  "fazer-amigos":
    "Você é TEAbot ajudando crianças com autismo a aprender como fazer amigos. Simule situações de conhecer alguém novo, iniciar conversa, perguntar o nome. Seja encorajador e use linguagem simples. Responda sempre em português.",
  "reconhecer-emocoes":
    "Você é TEAbot e está ensinando crianças com autismo a reconhecer emoções. Descreva situações ou expressões e pergunte como a pessoa se sente. Dê feedback positivo. Linguagem simples para crianças. Responda sempre em português.",
  "compartilhar":
    "Você é TEAbot ensinando crianças com autismo sobre compartilhar e esperar a vez. Simule situações de brincadeiras em grupo. Explique de forma simples e positiva quando a criança compartilha ou espera. Linguagem adequada para crianças. Responda sempre em português.",
  "desafio-do-dia":
    "Você é TEAbot e está dando o Desafio do Dia para uma criança com autismo. Escolha aleatoriamente uma das habilidades sociais (cumprimentar, pedir ajuda, compartilhar, fazer amigos, reconhecer emoções) e crie um mini desafio divertido. Seja entusiasmado. Responda sempre em português.",
};

const defaultPrompt = "Você é TEAbot, um assistente amigável que ajuda crianças com autismo. Responda em português de forma simples e encorajadora.";

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
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens enviadas. Espere um pouco e tente novamente." }), {
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
    const content = data.choices?.[0]?.message?.content || "Não consegui gerar uma resposta.";

    return new Response(JSON.stringify({ content }), {
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
