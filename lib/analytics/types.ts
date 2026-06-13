export type AnalyticsEventName =
  | "feed_opened"
  | "game_viewed"
  | "game_started"
  | "game_completed"
  | "swipe"
  | "games_reached"
  | "waitlist_reached"
  | "waitlist_submitted";

export interface AnalyticsEvent {
  id: string;
  sessionId: string;
  name: AnalyticsEventName;
  timestamp: number;
  properties: Record<string, string | number | boolean>;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt?: number;
  gamesReached: number;
  waitlistReached: boolean;
  waitlistSubmitted: boolean;
}

export interface GameCompletedPayload {
  gameId: string;
  gameIndex: number;
  score: number;
  timeSpentMs: number;
  completed: boolean;
}

export interface SwipePayload {
  direction: "up" | "down";
  fromIndex: number;
  toIndex: number;
}

export interface WaitlistSubmittedPayload {
  name: string;
  email: string;
}

export type EventPayloadMap = {
  feed_opened: Record<string, never>;
  game_viewed: { gameId: string; gameIndex: number };
  game_started: { gameId: string; gameIndex: number };
  game_completed: GameCompletedPayload;
  swipe: SwipePayload;
  games_reached: { count: number };
  waitlist_reached: Record<string, never>;
  waitlist_submitted: WaitlistSubmittedPayload;
};

export interface AggregatedMetrics {
  totalSessions: number;
  avgGamesReached: number;
  avgSessionDurationMs: number;
  waitlistConversionRate: number;
  completionRates: Record<string, { started: number; completed: number; rate: number }>;
  totalWaitlistSubmissions: number;
  totalSwipes: number;
}
