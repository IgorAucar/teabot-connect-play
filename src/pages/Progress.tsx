import Header from "@/components/Header";
import BadgeGrid from "@/components/BadgeGrid";
import { useAppState } from "@/hooks/useAppState";
import { activities } from "@/lib/activities";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const Progress = () => {
  const { state } = useAppState();

  const chartData = activities.map((a) => ({
    name: a.title,
    sessões: state.sessionLogs.filter((s) => s.activityId === a.id).length,
  }));

  const recentLogs = state.sessionLogs.slice(-5).reverse();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="container flex-1 py-8">
        <h1 className="mb-6 font-heading text-3xl font-bold text-foreground">
          Meu Progresso
        </h1>

        <div className="mb-6">
          <BadgeGrid count={state.stars} />
        </div>

        <div className="mb-6 rounded-2xl border-2 border-border bg-card p-5">
          <h3 className="mb-4 font-heading text-lg font-bold text-foreground">
            Sessões por Atividade
          </h3>
          {state.sessionLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma sessão registrada ainda. Complete atividades para ver seu progresso!
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "Lexend" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fontFamily: "Lexend" }} />
                <Tooltip />
                <Bar dataKey="sessões" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={i % 2 === 0 ? "hsl(208, 72%, 42%)" : "hsl(27, 100%, 50%)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <h3 className="mb-4 font-heading text-lg font-bold text-foreground">
            Atividades Recentes
          </h3>
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
          ) : (
            <ul className="space-y-3">
              {recentLogs.map((log, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3"
                >
                  <div>
                    <p className="font-heading text-sm font-semibold text-foreground">
                      {log.activityTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">{log.date}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 font-heading text-xs font-semibold ${log.completed ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                    {log.completed ? "Concluído" : "Em progresso"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default Progress;
