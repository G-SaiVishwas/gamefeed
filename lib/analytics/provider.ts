import type { AnalyticsEvent, AnalyticsEventName, Session } from "./types";

export interface AnalyticsProvider {
  capture(
    event: AnalyticsEventName,
    properties?: Record<string, string | number | boolean>
  ): void;
  identify?(traits: Record<string, string | number | boolean>): void;
  getEvents(): AnalyticsEvent[];
  getSessions(): Session[];
  getCurrentSession(): Session | null;
  reset?(): void;
}
