import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const authClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authClient.auth.getUser(token);
    const therapistId = userData.user?.id;
    if (!therapistId) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { childId, observations } = await req.json();
    if (!childId) throw new Error("childId obrigatório");

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify therapist role
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", therapistId);
    const isTherapist = (roles || []).some((r) => r.role === "therapist");
    if (!isTherapist) {
      return new Response(JSON.stringify({ error: "Apenas terapeutas" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Gather child data
    const [profileRes, childRes, progressRes, sessionsRes, messagesRes] = await Promise.all([
      admin.from("profiles").select("name, email").eq("user_id", childId).maybeSingle(),
      admin.from("children_profiles").select("age, guardian_name").eq("user_id", childId).maybeSingle(),
      admin.from("activity_progress").select("activity_title, completed_at").eq("user_id", childId),
      admin.from("session_logs").select("activity_title, completed, started_at, duration_seconds").eq("user_id", childId),
      admin.from("chat_messages").select("role, content, activity_id, created_at").eq("user_id", childId).order("created_at", { ascending: true }).limit(200),
    ]);

    const childName = profileRes.data?.name || "Criança";
    const age = childRes.data?.age;
    const activities = progressRes.data || [];
    const sessions = sessionsRes.data || [];
    const messages = messagesRes.data || [];

    const activitiesSummary = activities.map((a) => `- ${a.activity_title} (${new Date(a.completed_at).toLocaleDateString("pt-BR")})`).join("\n") || "Nenhuma atividade concluída.";
    const sessionsSummary = `Total de sessões: ${sessions.length}, Concluídas: ${sessions.filter((s) => s.completed).length}`;
    const chatSummary = messages
      .slice(-60)
      .map((m) => `[${m.activity_id}] ${m.role === "user" ? "Criança" : "TEAbot"}: ${m.content}`)
      .join("\n") || "Sem conversas registradas.";

    const systemPrompt = `Você é um especialista em desenvolvimento de crianças com Transtorno do Espectro Autista (TEA). 
Escreva um RELATÓRIO PROFISSIONAL, claro, objetivo e empático, em português brasileiro, sobre a evolução da criança com base nos dados fornecidos.

O relatório DEVE conter, com títulos em negrito (markdown), exatamente estas seções nesta ordem:
**Nome da Criança**
**Data de Geração**
**Quantidade de Atividades Realizadas**
**Quantidade de Conversas Realizadas**
**Habilidades Trabalhadas**
**Emoções Identificadas**
**Evolução Observada**
**Pontos Fortes**
**Pontos que Precisam de Reforço**
**Recomendações de Acompanhamento**

Use linguagem profissional mas acessível. Não invente dados — baseie-se apenas no que foi fornecido. Se algo for insuficiente, diga claramente.`;

    const userPrompt = `Dados da criança:
Nome: ${childName}
${age ? `Idade: ${age} anos` : ""}
Data de geração: ${new Date().toLocaleDateString("pt-BR")}

ATIVIDADES CONCLUÍDAS (${activities.length}):
${activitiesSummary}

SESSÕES:
${sessionsSummary}

HISTÓRICO DE CONVERSAS COM TEABOT (${messages.length} mensagens):
${chatSummary}

OBSERVAÇÕES DO TERAPEUTA:
${observations || "Nenhuma observação adicional."}

Gere o relatório completo seguindo a estrutura solicitada.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições. Tente novamente em instantes." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos da IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      throw new Error("Falha ao gerar relatório");
    }

    const aiData = await aiResp.json();
    const reportContent = aiData.choices?.[0]?.message?.content || "Não foi possível gerar o relatório.";
    const title = `Relatório de ${childName} - ${new Date().toLocaleDateString("pt-BR")}`;

    // Insert as therapist (use authClient to respect RLS / therapist_id = auth.uid())
    const { data: inserted, error: insertErr } = await authClient
      .from("reports")
      .insert({
        child_id: childId,
        therapist_id: therapistId,
        title,
        report_content: reportContent,
        source: "ai",
        observations: observations || null,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert error", insertErr);
      throw new Error(insertErr.message);
    }

    return new Response(JSON.stringify({ report: inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
