"use client";

import { LocalStorageAnalyticsProvider } from "./localStorageProvider";
import type { AnalyticsProvider } from "./provider";
import type { AnalyticsEventName, EventPayloadMap } from "./types";

let provider: LocalStorageAnalyticsProvider | null = null;

function getProvider(): LocalStorageAnalyticsProvider {
  if (!provider) {
    provider = new LocalStorageAnalyticsProvider();
  }
  return provider;
}

export function setAnalyticsProvider(customProvider: AnalyticsProvider): void {
  provider = customProvider as LocalStorageAnalyticsProvider;
}

export function track<E extends AnalyticsEventName>(
  event: E,
  properties?: EventPayloadMap[E] extends Record<string, never>
    ? undefined
    : EventPayloadMap[E]
): void {
  const p = getProvider();
  p.capture(
    event,
    (properties ?? {}) as Record<string, string | number | boolean>
  );
}

export function startSession() {
  return getProvider().startSession();
}

export function getAnalyticsEvents() {
  return getProvider().getEvents();
}

export function getAnalyticsSessions() {
  return getProvider().getSessions();
}

export function getCurrentSession() {
  return getProvider().getCurrentSession();
}

export function resetAnalytics() {
  getProvider().reset?.();
}

export type { AnalyticsEventName, AggregatedMetrics } from "./types";
export type { AnalyticsProvider } from "./provider";
export { aggregateMetrics } from "./aggregate";
