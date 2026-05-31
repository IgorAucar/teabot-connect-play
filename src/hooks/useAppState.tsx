import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import type { AppState, SessionLog } from "@/lib/app-state";
import { initialAppState } from "@/lib/app-state";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { getActivityById } from "@/lib/activities";

interface AppStateCtx {
  state: AppState;
  markCompleted: (activityId: string, activityTitle: string) => void;
  loading: boolean;
}

const AppStateContext = createContext<AppStateCtx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(initialAppState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setState(initialAppState);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const [progressRes, logsRes] = await Promise.all([
          supabase
            .from("activity_progress")
            .select("activity_id, completed_at")
            .eq("user_id", user.id),
          supabase
            .from("session_logs")
            .select("activity_id, activity_title, completed, started_at")
            .eq("user_id", user.id)
            .order("started_at", { ascending: true }),
        ]);

        const progressRows = progressRes.data || [];
        const logsRows = logsRes.data || [];

        const today = new Date().toLocaleDateString("pt-BR");
        const completedToday = Array.from(
          new Set(
            progressRows
              .filter((r) => new Date(r.completed_at).toLocaleDateString("pt-BR") === today)
              .map((r) => r.activity_id)
          )
        );

        const sessionLogs: SessionLog[] = logsRows.map((l) => ({
          activityId: l.activity_id,
          activityTitle: l.activity_title,
          date: new Date(l.started_at).toLocaleDateString("pt-BR"),
          completed: l.completed,
        }));

        setState({
          completedToday,
          stars: progressRows.length,
          sessionLogs,
        });
      } catch (err) {
        console.error("Failed to load app state:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const markCompleted = useCallback(
    (activityId: string, activityTitle: string) => {
      if (!user) return;
      const today = new Date().toLocaleDateString("pt-BR");

      setState((prev) => {
        const alreadyDone = prev.completedToday.includes(activityId);
        const log: SessionLog = { activityId, activityTitle, date: today, completed: true };
        return {
          completedToday: alreadyDone ? prev.completedToday : [...prev.completedToday, activityId],
          stars: alreadyDone ? prev.stars : prev.stars + 1,
          sessionLogs: [...prev.sessionLogs, log],
        };
      });

      (async () => {
        try {
          await supabase.from("session_logs").insert({
            user_id: user.id,
            device_id: user.id,
            activity_id: activityId,
            activity_title: activityTitle,
            completed: true,
            ended_at: new Date().toISOString(),
          });

          const { data: existing } = await supabase
            .from("activity_progress")
            .select("id, completed_at")
            .eq("user_id", user.id)
            .eq("activity_id", activityId);

          const doneToday = (existing || []).some(
            (r) => new Date(r.completed_at).toLocaleDateString("pt-BR") === today
          );

          if (!doneToday) {
            await supabase.from("activity_progress").insert({
              user_id: user.id,
              device_id: user.id,
              activity_id: activityId,
              activity_title: activityTitle,
              stars: 1,
            });
          }
        } catch (err) {
          console.error("Failed to persist completion:", err);
        }
      })();
    },
    [user]
  );

  return (
    <AppStateContext.Provider value={{ state, markCompleted, loading }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
