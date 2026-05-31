import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface Patient {
  user_id: string;
  name: string;
  email: string;
  age: number | null;
  guardian_name: string | null;
  total_stars: number;
  sessions: number;
}

const TherapistDashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // Fetch all child user_ids
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "child");
      const ids = (roles || []).map((r) => r.user_id);
      if (ids.length === 0) {
        setLoading(false);
        return;
      }

      const [profilesRes, childRes, progressRes, sessionsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, name, email").in("user_id", ids),
        supabase
          .from("children_profiles")
          .select("user_id, age, guardian_name")
          .in("user_id", ids),
        supabase.from("activity_progress").select("user_id").in("user_id", ids),
        supabase.from("session_logs").select("user_id").in("user_id", ids),
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.user_id, p]));
      const childMap = new Map((childRes.data || []).map((c) => [c.user_id, c]));
      const starsMap = new Map<string, number>();
      (progressRes.data || []).forEach((r) =>
        starsMap.set(r.user_id, (starsMap.get(r.user_id) || 0) + 1)
      );
      const sessionMap = new Map<string, number>();
      (sessionsRes.data || []).forEach((r) =>
        sessionMap.set(r.user_id, (sessionMap.get(r.user_id) || 0) + 1)
      );

      const list: Patient[] = ids.map((id) => ({
        user_id: id,
        name: profileMap.get(id)?.name || "Sem nome",
        email: profileMap.get(id)?.email || "",
        age: childMap.get(id)?.age ?? null,
        guardian_name: childMap.get(id)?.guardian_name ?? null,
        total_stars: starsMap.get(id) || 0,
        sessions: sessionMap.get(id) || 0,
      }));
      setPatients(list);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-2 font-heading text-3xl font-bold text-foreground">
          Painel do Terapeuta
        </h1>
        <p className="mb-6 text-base text-muted-foreground">
          Acompanhe o progresso das crianças cadastradas na plataforma.
        </p>

        {loading ? (
          <p className="text-muted-foreground">Carregando pacientes...</p>
        ) : patients.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="font-heading text-lg text-foreground">
              Nenhuma criança cadastrada ainda.
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Quando crianças criarem contas, elas aparecerão aqui.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {patients.map((p) => (
              <Card key={p.user_id} className="p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-foreground">
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1">
                    <span className="text-lg">⭐</span>
                    <span className="font-heading font-bold text-accent">
                      {p.total_stars}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  {p.age != null && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Idade:</span> {p.age} anos
                    </p>
                  )}
                  {p.guardian_name && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold text-foreground">Responsável:</span>{" "}
                      {p.guardian_name}
                    </p>
                  )}
                  <p className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Sessões:</span> {p.sessions}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TherapistDashboard;
