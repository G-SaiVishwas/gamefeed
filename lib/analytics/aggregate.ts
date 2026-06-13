import type { AggregatedMetrics, AnalyticsEvent, Session } from "./types";

export function aggregateMetrics(
  events: AnalyticsEvent[],
  sessions: Session[]
): AggregatedMetrics {
  const totalSessions = sessions.length;

  const avgGamesReached =
    totalSessions === 0
      ? 0
      : sessions.reduce((sum, s) => sum + s.gamesReached, 0) / totalSessions;

  const sessionsWithDuration = sessions.filter((s) => s.endedAt);
  const avgSessionDurationMs =
    sessionsWithDuration.length === 0
      ? sessions.reduce((sum, s) => {
          const lastEvent = events
            .filter((e) => e.sessionId === s.id)
            .sort((a, b) => b.timestamp - a.timestamp)[0];
          const end = lastEvent?.timestamp ?? Date.now();
          return sum + (end - s.startedAt);
        }, 0) / Math.max(totalSessions, 1)
      : sessionsWithDuration.reduce(
          (sum, s) => sum + (s.endedAt! - s.startedAt),
          0
        ) / sessionsWithDuration.length;

  const waitlistReachedCount = sessions.filter((s) => s.waitlistReached).length;
  const waitlistSubmittedCount = sessions.filter(
    (s) => s.waitlistSubmitted
  ).length;
  const waitlistConversionRate =
    waitlistReachedCount === 0
      ? 0
      : (waitlistSubmittedCount / waitlistReachedCount) * 100;

  const gameStarted = events.filter((e) => e.name === "game_started");
  const gameCompleted = events.filter((e) => e.name === "game_completed");

  const completionRates: AggregatedMetrics["completionRates"] = {};

  for (const event of gameStarted) {
    const gameId = event.properties.gameId as string;
    if (!completionRates[gameId]) {
      completionRates[gameId] = { started: 0, completed: 0, rate: 0 };
    }
    completionRates[gameId].started += 1;
  }

  for (const event of gameCompleted) {
    const gameId = event.properties.gameId as string;
    const completed = event.properties.completed as boolean;
    if (!completionRates[gameId]) {
      completionRates[gameId] = { started: 0, completed: 0, rate: 0 };
    }
    if (completed) {
      completionRates[gameId].completed += 1;
    }
  }

  for (const gameId of Object.keys(completionRates)) {
    const stats = completionRates[gameId];
    stats.rate =
      stats.started === 0 ? 0 : (stats.completed / stats.started) * 100;
  }

  return {
    totalSessions,
    avgGamesReached: Math.round(avgGamesReached * 100) / 100,
    avgSessionDurationMs: Math.round(avgSessionDurationMs),
    waitlistConversionRate: Math.round(waitlistConversionRate * 100) / 100,
    completionRates,
    totalWaitlistSubmissions: waitlistSubmittedCount,
    totalSwipes: events.filter((e) => e.name === "swipe").length,
  };
}
