import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import { Download, Loader2, Sparkles, FileText, Save } from "lucide-react";

interface Child {
  user_id: string;
  name: string;
  email: string;
  age: number | null;
}

interface ReportRow {
  id: string;
  child_id: string;
  therapist_id: string;
  title: string;
  report_content: string;
  source: string;
  observations: string | null;
  created_at: string;
}

interface ActivityRow {
  activity_title: string;
  completed_at: string;
}

interface ChatRow {
  role: string;
  content: string;
  activity_id: string;
  created_at: string;
}

const Reports = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [chats, setChats] = useState<ChatRow[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [observations, setObservations] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualContent, setManualContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  const selected = useMemo(
    () => children.find((c) => c.user_id === selectedId) || null,
    [children, selectedId]
  );

  useEffect(() => {
    (async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "child");
      const ids = (roles || []).map((r) => r.user_id);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }
      const [profilesRes, childRes] = await Promise.all([
        supabase.from("profiles").select("user_id, name, email").in("user_id", ids),
        supabase.from("children_profiles").select("user_id, age").in("user_id", ids),
      ]);
      const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
      const childMap = new Map((childRes.data || []).map((c) => [c.user_id, c]));
      setChildren(
        ids.map((id) => ({
          user_id: id,
          name: profileMap.get(id)?.name || "Sem nome",
          email: profileMap.get(id)?.email || "",
          age: childMap.get(id)?.age ?? null,
        }))
      );
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    (async () => {
      const [actRes, chatRes, repRes] = await Promise.all([
        supabase
          .from("activity_progress")
          .select("activity_title, completed_at")
          .eq("user_id", selectedId)
          .order("completed_at", { ascending: false }),
        supabase
          .from("chat_messages")
          .select("role, content, activity_id, created_at")
          .eq("user_id", selectedId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("reports")
          .select("*")
          .eq("child_id", selectedId)
          .order("created_at", { ascending: false }),
      ]);
      setActivities((actRes.data as ActivityRow[]) || []);
      setChats((chatRes.data as ChatRow[]) || []);
      setReports((repRes.data as ReportRow[]) || []);
    })();
  }, [selectedId]);

  const refreshReports = async () => {
    if (!selectedId) return;
    const { data } = await supabase
      .from("reports")
      .select("*")
      .eq("child_id", selectedId)
      .order("created_at", { ascending: false });
    setReports((data as ReportRow[]) || []);
  };

  const generateAI = async () => {
    if (!selectedId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-report", {
        body: { childId: selectedId, observations },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Relatório gerado pela IA!");
      setObservations("");
      await refreshReports();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar relatório");
    } finally {
      setGenerating(false);
    }
  };

  const saveManual = async () => {
    if (!selectedId || !manualTitle.trim() || !manualContent.trim()) {
      toast.error("Preencha título e conteúdo");
      return;
    }
    setSavingManual(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSavingManual(false);
      return;
    }
    const { error } = await supabase.from("reports").insert({
      child_id: selectedId,
      therapist_id: user.id,
      title: manualTitle.trim(),
      report_content: manualContent.trim(),
      source: "manual",
      observations: observations || null,
    });
    setSavingManual(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Relatório manual salvo!");
    setManualTitle("");
    setManualContent("");
    await refreshReports();
  };

  const exportPDF = (r: ReportRow) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const pageWidth = doc.internal.pageSize.getWidth();
    const usableWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("InovaTEA - Relatório", margin, y);
    y += 22;
    doc.setFontSize(13);
    doc.text(doc.splitTextToSize(r.title, usableWidth), margin, y);
    y += 24;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      `Gerado em ${new Date(r.created_at).toLocaleString("pt-BR")} | Fonte: ${
        r.source === "ai" ? "IA" : "Manual"
      }`,
      margin,
      y
    );
    y += 18;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 16;

    doc.setFontSize(11);
    const lines = doc.splitTextToSize(r.report_content, usableWidth);
    const pageHeight = doc.internal.pageSize.getHeight();
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 14;
    }

    if (r.observations) {
      if (y > pageHeight - margin - 60) {
        doc.addPage();
        y = margin;
      }
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.text("Observações do terapeuta:", margin, y);
      y += 14;
      doc.setFont("helvetica", "normal");
      const obs = doc.splitTextToSize(r.observations, usableWidth);
      for (const line of obs) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += 14;
      }
    }

    doc.save(`${r.title.replace(/[^\w\-]+/g, "_")}.pdf`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">Relatórios</h1>
        <p className="mb-6 text-muted-foreground">
          Gere relatórios automáticos com IA ou manualmente para acompanhar a evolução das crianças.
        </p>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : children.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-heading text-lg">Nenhuma criança cadastrada ainda.</p>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
            {/* Sidebar: children */}
            <Card className="h-fit p-3">
              <h2 className="mb-2 px-2 font-heading text-sm font-bold uppercase text-muted-foreground">
                Crianças
              </h2>
              <div className="space-y-1">
                {children.map((c) => (
                  <button
                    key={c.user_id}
                    onClick={() => setSelectedId(c.user_id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      selectedId === c.user_id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <p className="font-heading font-semibold">{c.name}</p>
                    <p className="text-xs opacity-80">{c.email}</p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Main: details */}
            <div className="space-y-6">
              {!selected ? (
                <Card className="p-8 text-center text-muted-foreground">
                  Selecione uma criança para começar.
                </Card>
              ) : (
                <>
                  <Card className="p-5">
                    <h2 className="font-heading text-xl font-bold">{selected.name}</h2>
                    <p className="text-sm text-muted-foreground">{selected.email}</p>
                    {selected.age != null && (
                      <p className="text-sm text-muted-foreground">Idade: {selected.age} anos</p>
                    )}
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="p-5">
                      <h3 className="mb-3 font-heading font-bold">Atividades realizadas ({activities.length})</h3>
                      <div className="max-h-48 space-y-1 overflow-y-auto text-sm">
                        {activities.length === 0 ? (
                          <p className="text-muted-foreground">Nenhuma atividade.</p>
                        ) : (
                          activities.map((a, i) => (
                            <p key={i} className="text-muted-foreground">
                              • {a.activity_title} —{" "}
                              <span className="text-xs">
                                {new Date(a.completed_at).toLocaleDateString("pt-BR")}
                              </span>
                            </p>
                          ))
                        )}
                      </div>
                    </Card>

                    <Card className="p-5">
                      <h3 className="mb-3 font-heading font-bold">Conversas recentes ({chats.length})</h3>
                      <div className="max-h-48 space-y-2 overflow-y-auto text-sm">
                        {chats.length === 0 ? (
                          <p className="text-muted-foreground">Sem conversas.</p>
                        ) : (
                          chats.slice(0, 20).map((m, i) => (
                            <p key={i} className="text-muted-foreground">
                              <span className="font-semibold text-foreground">
                                {m.role === "user" ? "Criança" : "TEAbot"}:
                              </span>{" "}
                              {m.content}
                            </p>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>

                  <Card className="p-5">
                    <h3 className="mb-3 font-heading font-bold">Observações do terapeuta</h3>
                    <Textarea
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      placeholder="Adicione observações que entrarão no contexto do relatório..."
                      className="min-h-[100px]"
                    />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button onClick={generateAI} disabled={generating}>
                        {generating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Gerar Relatório com IA
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h3 className="mb-3 font-heading font-bold">Criar relatório manual</h3>
                    <div className="space-y-3">
                      <Input
                        placeholder="Título do relatório"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                      />
                      <Textarea
                        placeholder="Escreva o relatório..."
                        value={manualContent}
                        onChange={(e) => setManualContent(e.target.value)}
                        className="min-h-[140px]"
                      />
                      <Button onClick={saveManual} disabled={savingManual} variant="secondary">
                        {savingManual ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Salvar relatório
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-5">
                    <h3 className="mb-3 font-heading font-bold">
                      Relatórios anteriores ({reports.length})
                    </h3>
                    {reports.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Nenhum relatório gerado ainda.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {reports.map((r) => (
                          <div
                            key={r.id}
                            className="rounded-lg border border-border p-4"
                          >
                            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="font-heading font-bold">{r.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(r.created_at).toLocaleString("pt-BR")} ·{" "}
                                  <span className="inline-flex items-center gap-1">
                                    <FileText className="h-3 w-3" />
                                    {r.source === "ai" ? "Gerado por IA" : "Manual"}
                                  </span>
                                </p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => exportPDF(r)}>
                                <Download className="mr-1 h-4 w-4" /> PDF
                              </Button>
                            </div>
                            <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                              {r.report_content}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Reports;
