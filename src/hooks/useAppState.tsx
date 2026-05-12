import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import type { AppState, SessionLog } from "@/lib/app-state";
import { initialAppState } from "@/lib/app-state";
import { supabase } from "@/integrations/supabase/client";
import { ensureChildProfile, getDeviceId } from "@/lib/device-id";

interface AppStateCtx {
  state: AppState;
  markCompleted: (activityId: string, activityTitle: string) => void;
  loading: boolean;
}

const AppStateContext = createContext<AppStateCtx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);
  const [loading, setLoading] = useState(true);

  // Load persisted data from Supabase on mount
  useEffect(() => {
    (async () => {
      try {
        const deviceId = await ensureChildProfile();

        const [progressRes, logsRes] = await Promise.all([
          supabase
            .from("activity_progress")
            .select("activity_id, completed_at")
            .eq("device_id", deviceId),
          supabase
            .from("session_logs")
            .select("activity_id, activity_title, completed, started_at")
            .eq("device_id", deviceId)
            .order("started_at", { ascending: true }),
        ]);

        const progressRows = progressRes.data || [];
        const logsRows = logsRes.data || [];

        // completed today (by date string)
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
  }, []);

  const markCompleted = useCallback((activityId: string, activityTitle: string) => {
    const deviceId = getDeviceId();
    const today = new Date().toLocaleDateString("pt-BR");

    setState((prev) => {
      const alreadyDone = prev.completedToday.includes(activityId);
      const log: SessionLog = {
        activityId,
        activityTitle,
        date: today,
        completed: true,
      };
      return {
        completedToday: alreadyDone ? prev.completedToday : [...prev.completedToday, activityId],
        stars: alreadyDone ? prev.stars : prev.stars + 1,
        sessionLogs: [...prev.sessionLogs, log],
      };
    });

    // Persist asynchronously (fire and forget)
    (async () => {
      try {
        await supabase.from("session_logs").insert({
          device_id: deviceId,
          activity_id: activityId,
          activity_title: activityTitle,
          completed: true,
          ended_at: new Date().toISOString(),
        });

        // Only count as a new "star" if not already completed today
        const { data: existing } = await supabase
          .from("activity_progress")
          .select("id, completed_at")
          .eq("device_id", deviceId)
          .eq("activity_id", activityId);

        const doneToday = (existing || []).some(
          (r) => new Date(r.completed_at).toLocaleDateString("pt-BR") === today
        );

        if (!doneToday) {
          await supabase.from("activity_progress").insert({
            device_id: deviceId,
            activity_id: activityId,
            activity_title: activityTitle,
            stars: 1,
          });

          // increment total_stars on profile
          const { data: profile } = await supabase
            .from("child_profiles")
            .select("total_stars")
            .eq("device_id", deviceId)
            .maybeSingle();
          if (profile) {
            await supabase
              .from("child_profiles")
              .update({ total_stars: (profile.total_stars || 0) + 1 })
              .eq("device_id", deviceId);
          }
        }
      } catch (err) {
        console.error("Failed to persist completion:", err);
      }
    })();
  }, []);

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
