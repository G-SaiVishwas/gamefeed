"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { AgentProfile, BuilderSelections } from "@/lib/create/types";
import { buildAgentBrief } from "@/lib/create/matchAgent";
import {
  ASSET_PACK_OPTIONS,
  GOAL_OPTIONS,
  INTERACTION_OPTIONS,
  PACE_OPTIONS,
  SESSION_OPTIONS,
} from "@/lib/create/steps";

interface AgentRevealProps {
  agent: AgentProfile;
  confidence: number;
  reasons: string[];
  selections: BuilderSelections;
  onStartOver: () => void;
}

function labelFor<T extends string>(
  options: { id: T; label: string }[],
  id: T | null
) {
  return options.find((o) => o.id === id)?.label ?? "—";
}

export default function AgentReveal({
  agent,
  confidence,
  reasons,
  selections,
  onStartOver,
}: AgentRevealProps) {
  const brief = buildAgentBrief(selections, agent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col px-4 pb-6 pt-2"
    >
      <div className="glass-card mb-4 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#2b2b3a]/45">
          Matched specialist
        </p>
        <h2
          className="mt-1 text-2xl font-bold"
          style={{ fontFamily: "var(--font-space-grotesk)", color: agent.accent }}
        >
          {agent.name}
        </h2>
        <p className="mt-1 text-sm text-[#2b2b3a]/75">{agent.tagline}</p>
        <p className="mt-3 text-xs leading-relaxed text-[#2b2b3a]/65">{agent.description}</p>

        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-[#2b2b3a]/45">
            <span>Match confidence</span>
            <span>{confidence}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#2b2b3a]/10">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${confidence}%`, background: agent.accent }}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
        {[
          ["Pace", labelFor(PACE_OPTIONS, selections.pace)],
          ["Input", labelFor(INTERACTION_OPTIONS, selections.interaction)],
          ["Pack", labelFor(ASSET_PACK_OPTIONS, selections.assetPack)],
          ["Goal", labelFor(GOAL_OPTIONS, selections.goal)],
          ["Session", labelFor(SESSION_OPTIONS, selections.sessionLength)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-lg border-2 border-[#2b2b3a]/15 bg-white/80 px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2b2b3a]/40">{k}</p>
            <p className="font-semibold text-[#2b2b3a]">{v}</p>
          </div>
        ))}
      </div>

      {selections.prompt.trim() && (
        <div className="glass-card mb-4 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2b2b3a]/40">Your prompt</p>
          <p className="mt-1 text-sm italic text-[#2b2b3a]/80">&ldquo;{selections.prompt.trim()}&rdquo;</p>
        </div>
      )}

      {reasons.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#2b2b3a]/40">
            Why this agent
          </p>
          <ul className="space-y-1.5">
            {reasons.map((r) => (
              <li key={r} className="flex items-start gap-2 text-xs text-[#2b2b3a]/70">
                <span style={{ color: agent.accent }}>→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="glass-card mb-4 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#2b2b3a]/40">Example outputs</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {agent.exampleGames.map((g) => (
            <span
              key={g}
              className="rounded-full border border-[#2b2b3a]/20 px-2 py-0.5 text-[11px] font-medium"
              style={{ background: `${agent.accent}18` }}
            >
              {g}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <div className="rounded-xl border-2 border-dashed border-[#2b2b3a]/25 bg-white/50 px-3 py-3 text-center">
          <p className="text-sm font-bold text-[#2b2b3a]">Generation coming soon</p>
          <p className="mt-1 text-xs text-[#2b2b3a]/55">
            This MVP captures your blueprint and routes it to {agent.name}. No game is built yet.
          </p>
        </div>

        <details className="rounded-lg border border-[#2b2b3a]/15 bg-white/60 px-3 py-2 text-xs">
          <summary className="cursor-pointer font-semibold text-[#2b2b3a]/70">View agent brief</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[10px] leading-relaxed text-[#2b2b3a]/60">
            {brief}
          </pre>
        </details>

        <button
          type="button"
          onClick={onStartOver}
          className="w-full rounded-xl border-2 border-[#2b2b3a] bg-white py-3 text-sm font-bold text-[#2b2b3a] shadow-[3px_3px_0_#2b2b3a]"
        >
          Start over
        </button>
        <Link
          href="/"
          className="block w-full rounded-xl border-2 border-[#2b2b3a] py-3 text-center text-sm font-bold text-[#2b2b3a] shadow-[3px_3px_0_#2b2b3a]"
          style={{ background: agent.accent }}
        >
          Back to feed
        </Link>
      </div>
    </motion.div>
  );
}
