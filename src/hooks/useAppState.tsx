import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { AppState, SessionLog } from "@/lib/app-state";
import { initialAppState } from "@/lib/app-state";

interface AppStateCtx {
  state: AppState;
  markCompleted: (activityId: string, activityTitle: string) => void;
}

const AppStateContext = createContext<AppStateCtx | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(initialAppState);

  const markCompleted = useCallback((activityId: string, activityTitle: string) => {
    setState((prev) => {
      const alreadyDone = prev.completedToday.includes(activityId);
      const log: SessionLog = {
        activityId,
        activityTitle,
        date: new Date().toLocaleDateString("pt-BR"),
        completed: true,
      };
      return {
        completedToday: alreadyDone ? prev.completedToday : [...prev.completedToday, activityId],
        stars: alreadyDone ? prev.stars : prev.stars + 1,
        sessionLogs: [...prev.sessionLogs, log],
      };
    });
  }, []);

  return (
    <AppStateContext.Provider value={{ state, markCompleted }}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
