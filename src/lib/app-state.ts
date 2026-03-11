export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface SessionLog {
  activityId: string;
  activityTitle: string;
  date: string;
  completed: boolean;
}

export interface AppState {
  completedToday: string[];
  stars: number;
  sessionLogs: SessionLog[];
}

export const initialAppState: AppState = {
  completedToday: [],
  stars: 0,
  sessionLogs: [],
};
