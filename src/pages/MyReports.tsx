import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Sparkles, FileText } from "lucide-react";

interface ReportRow {
  id: string;
  title: string;
  report_content: string;
  source: string;
  created_at: string;
}

const MyReports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, title, report_content, source, created_at")
        .eq("child_id", user.id)
        .order("created_at", { ascending: true });
      setReports((data as ReportRow[]) || []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">
          📚 Meus Relatórios
        </h1>
        <p className="mb-6 text-base text-muted-foreground">
          Veja a sua evolução nas atividades ao longo do tempo!
        </p>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : reports.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-heading text-lg">
              Você ainda não tem relatórios. 🌟
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Continue se divertindo nas atividades!
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="relative border-l-4 border-primary/30 pl-6">
              {reports.map((r, i) => (
                <div key={r.id} className="relative mb-6">
                  <div className="absolute -left-[34px] top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <Card
                    className="cursor-pointer p-5 transition-shadow hover:shadow-md"
                    onClick={() => setOpenId(openId === r.id ? null : r.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-lg font-bold text-foreground">
                          {r.title}
                        </p>
                        <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                          📅 {new Date(r.created_at).toLocaleDateString("pt-BR")}
                          {r.source === "ai" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                              <Sparkles className="h-3 w-3" /> IA
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs">
                              <FileText className="h-3 w-3" /> Terapeuta
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-2xl">{openId === r.id ? "▾" : "▸"}</span>
                    </div>
                    {openId === r.id && (
                      <pre className="mt-4 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-sans text-sm text-foreground">
                        {r.report_content}
                      </pre>
                    )}
                  </Card>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyReports;
