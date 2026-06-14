"use client";

import { useMemo, useState } from "react";
import {
  aggregateMetrics,
  getAnalyticsEvents,
  getAnalyticsSessions,
  resetAnalytics,
  type AggregatedMetrics,
} from "@/lib/analytics";
import { GAMES } from "@/lib/games/registry";

const GAME_COLORS: Record<string, string> = {
  "coin-dash": "#4ade80",
  "tank-arena": "#3b82f6",
  "dungeon-strike": "#a855f7",
  artillery: "#eab308",
};

function MetricCard({
  label,
  value,
  suffix = "",
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
        {label}
      </p>
      <p
        className="font-mono text-2xl font-light tabular-nums text-white"
        style={{ textShadow: "0 0 20px rgba(99,102,241,0.2)" }}
      >
        {value}
        {suffix && <span className="ml-1 text-base text-white/35">{suffix}</span>}
      </p>
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes === 0) return `${remainingSeconds}s`;
  return `${minutes}m ${remainingSeconds}s`;
}

export default function AnalyticsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const metrics = useMemo<AggregatedMetrics | null>(() => {
    if (typeof window === "undefined") return null;
    void refreshKey;
    return aggregateMetrics(getAnalyticsEvents(), getAnalyticsSessions());
  }, [refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  const handleReset = () => {
    if (confirm("Reset all analytics data?")) {
      resetAnalytics();
      refresh();
    }
  };

  if (!metrics) {
    return (
      <div className="aurora-bg flex min-h-screen items-center justify-center text-white/40">
        Loading...
      </div>
    );
  }

  return (
    <div className="aurora-bg min-h-screen px-6 py-12 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400">
              Developer Panel
            </p>
            <h1
              className="text-2xl font-bold tracking-tight neon-text"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              GameFeed Analytics
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={refresh}
              className="glass-card rounded-lg px-4 py-2 text-sm text-white/50 transition-all hover:text-white"
            >
              Refresh
            </button>
            <button
              onClick={handleReset}
              className="rounded-lg border border-red-500/20 px-4 py-2 text-sm text-red-400/60 transition-all hover:border-red-500/40 hover:text-red-400"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3">
          <MetricCard label="Total Sessions" value={metrics.totalSessions} />
          <MetricCard label="Avg Games Reached" value={metrics.avgGamesReached} />
          <MetricCard label="Avg Session Duration" value={formatDuration(metrics.avgSessionDurationMs)} />
          <MetricCard label="Waitlist Conversion" value={metrics.waitlistConversionRate} suffix="%" />
          <MetricCard label="Waitlist Submissions" value={metrics.totalWaitlistSubmissions} />
          <MetricCard label="Total Swipes" value={metrics.totalSwipes} />
        </div>

        <div className="glass-card neon-ring rounded-2xl p-6">
          <h2 className="mb-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/35">
            Completion Rates by Game
          </h2>
          <div className="space-y-5">
            {GAMES.map((game) => {
              const stats = metrics.completionRates[game.id] ?? { started: 0, completed: 0, rate: 0 };
              const color = GAME_COLORS[game.id] ?? "#6366f1";
              return (
                <div key={game.id}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-white/70">{game.title}</span>
                    <span className="font-mono text-xs tabular-nums text-white/40">
                      {stats.rate.toFixed(1)}% ({stats.completed}/{stats.started})
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${stats.rate}%`,
                        background: color,
                        boxShadow: `0 0 8px ${color}60`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-8 text-center text-[10px] text-white/15">
          Data stored locally. Swap provider for PostHog/Mixpanel.
        </p>
      </div>
    </div>
  );
}
