import type { AnalyticsProvider } from "./provider";
import type { AnalyticsEvent, AnalyticsEventName, Session } from "./types";

const EVENTS_KEY = "gamefeed_analytics_events";
const SESSIONS_KEY = "gamefeed_analytics_sessions";
const CURRENT_SESSION_KEY = "gamefeed_current_session";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export class LocalStorageAnalyticsProvider implements AnalyticsProvider {
  private events: AnalyticsEvent[] = [];
  private sessions: Session[] = [];
  private currentSession: Session | null = null;

  constructor() {
    this.hydrate();
  }

  private hydrate(): void {
    this.events = readJson<AnalyticsEvent[]>(EVENTS_KEY, []);
    this.sessions = readJson<Session[]>(SESSIONS_KEY, []);
    this.currentSession = readJson<Session | null>(CURRENT_SESSION_KEY, null);
  }

  private persist(): void {
    writeJson(EVENTS_KEY, this.events);
    writeJson(SESSIONS_KEY, this.sessions);
    writeJson(CURRENT_SESSION_KEY, this.currentSession);
  }

  startSession(): Session {
    const session: Session = {
      id: generateId(),
      startedAt: Date.now(),
      gamesReached: 0,
      waitlistReached: false,
      waitlistSubmitted: false,
    };
    this.currentSession = session;
    this.sessions.push(session);
    this.persist();
    return session;
  }

  getCurrentSession(): Session | null {
    return this.currentSession;
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getSessions(): Session[] {
    return [...this.sessions];
  }

  capture(
    event: AnalyticsEventName,
    properties: Record<string, string | number | boolean> = {}
  ): void {
    if (!this.currentSession) {
      this.startSession();
    }

    const session = this.currentSession!;
    const analyticsEvent: AnalyticsEvent = {
      id: generateId(),
      sessionId: session.id,
      name: event,
      timestamp: Date.now(),
      properties,
    };

    this.events.push(analyticsEvent);

    switch (event) {
      case "games_reached": {
        const count = properties.count as number;
        if (count > session.gamesReached) {
          session.gamesReached = count;
        }
        break;
      }
      case "waitlist_reached":
        session.waitlistReached = true;
        break;
      case "waitlist_submitted":
        session.waitlistSubmitted = true;
        session.endedAt = Date.now();
        break;
      case "feed_opened":
        break;
    }

    this.persist();
  }

  reset(): void {
    this.events = [];
    this.sessions = [];
    this.currentSession = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(EVENTS_KEY);
      localStorage.removeItem(SESSIONS_KEY);
      localStorage.removeItem(CURRENT_SESSION_KEY);
    }
  }
}
