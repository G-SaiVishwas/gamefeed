import type { AgentProfile, BuilderSelections } from "./types";

const AGENTS: Record<string, AgentProfile> = {
  runner: {
    id: "runner-agent",
    name: "Runner Agent",
    tagline: "Side-scrollers, jump/duck loops, escalating speed",
    description:
      "Builds endless runners and lane dodgers with platformer sprites, tap splits, and distance scoring.",
    accent: "#4ade80",
    exampleGames: ["Coin Dash", "Endless hopper", "Lane switcher"],
    strengths: ["Tap controls", "Platformer pack", "Fast pace", "Score chase"],
  },
  arena: {
    id: "arena-agent",
    name: "Arena Agent",
    tagline: "Top-down movement, auto-fire, spawn pressure",
    description:
      "Builds arena survival games with virtual joystick drag, enemy waves, and kill-based scoring.",
    accent: "#3b82f6",
    exampleGames: ["Tank Arena", "Blob swarm", "Twin-stick lite"],
    strengths: ["Drag controls", "Tanks pack", "Survive loop", "Escalating spawns"],
  },
  strike: {
    id: "strike-agent",
    name: "Strike Agent",
    tagline: "Center-screen defense, tap-to-hit, combo multipliers",
    description:
      "Builds corridor rush games where enemies close in and the player taps to strike before contact.",
    accent: "#a855f7",
    exampleGames: ["Dungeon Strike", "Gate defender", "Combo tapper"],
    strengths: ["Tap timing", "Dungeon pack", "Clear enemies", "Combo scoring"],
  },
  artillery: {
    id: "artillery-agent",
    name: "Artillery Agent",
    tagline: "Ballistic arcs, wind, telegraphed counter-fire",
    description:
      "Builds trajectory duels with drag-or-aim targeting, gravity shells, and precision win conditions.",
    accent: "#eab308",
    exampleGames: ["Artillery Duel", "Castle lobber", "Wind golfer"],
    strengths: ["Drag aim", "Artillery pack", "Precision hits", "Physics preview"],
  },
  zen: {
    id: "zen-agent",
    name: "Zen Agent",
    tagline: "Low pressure, gentle loops, collection over chaos",
    description:
      "Builds relaxing tap experiences with slow spawns, soft timers, and satisfying pickup feedback.",
    accent: "#22d3ee",
    exampleGames: ["Garden gather", "Bubble pop", "Star collector"],
    strengths: ["Relaxed pace", "Tap-only", "Endless chill", "Soft goals"],
  },
  hybrid: {
    id: "hybrid-agent",
    name: "Hybrid Agent",
    tagline: "Mixed signals — blends mechanics from multiple specialists",
    description:
      "When your choices span categories, a hybrid agent stitches together the best matching templates.",
    accent: "#f97316",
    exampleGames: ["Custom mashup", "Experimental loop"],
    strengths: ["Flexible", "Cross-pack", "Prompt-driven"],
  },
};

function scoreAgent(
  selections: BuilderSelections
): { agent: AgentProfile; confidence: number; reasons: string[] } {
  const scores: Record<string, number> = {
    runner: 0,
    arena: 0,
    strike: 0,
    artillery: 0,
    zen: 0,
  };
  const reasons: string[] = [];

  if (selections.pace === "fast") {
    scores.runner += 3;
    scores.arena += 2;
    reasons.push("Fast pace → runner or arena templates");
  } else if (selections.pace === "relaxed") {
    scores.zen += 4;
    scores.strike += 1;
    reasons.push("Relaxed pace → zen or light strike templates");
  } else if (selections.pace === "balanced") {
    scores.strike += 2;
    scores.runner += 1;
    scores.arena += 1;
  }

  if (selections.interaction === "tap") {
    scores.runner += 3;
    scores.strike += 3;
    scores.zen += 2;
    reasons.push("Tap interaction → runner, strike, or zen");
  } else if (selections.interaction === "drag") {
    scores.arena += 3;
    scores.artillery += 3;
    reasons.push("Drag interaction → arena or artillery");
  } else if (selections.interaction === "mixed") {
    scores.arena += 2;
    scores.artillery += 1;
    scores.runner += 1;
  }

  const packMap: Record<string, keyof typeof scores> = {
    platformer: "runner",
    "tanks-td": "arena",
    dungeon: "strike",
    artillery: "artillery",
  };
  if (selections.assetPack) {
    scores[packMap[selections.assetPack]] += 5;
    reasons.push(`${selections.assetPack} pack → matching specialist`);
  }

  if (selections.goal === "survive") {
    scores.arena += 2;
    scores.runner += 1;
  } else if (selections.goal === "score") {
    scores.runner += 2;
    scores.strike += 1;
  } else if (selections.goal === "clear") {
    scores.strike += 3;
    scores.arena += 1;
  } else if (selections.goal === "precision") {
    scores.artillery += 4;
  }

  if (selections.sessionLength === "quick") {
    scores.runner += 1;
    scores.strike += 1;
  } else if (selections.sessionLength === "endless") {
    scores.zen += 2;
    scores.runner += 1;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topKey, topScore] = ranked[0];
  const [, secondScore] = ranked[1];

  const confidence = topScore === 0 ? 0 : Math.min(100, Math.round((topScore / (topScore + secondScore + 1)) * 100));

  if (topScore < 4 || confidence < 45) {
    return { agent: AGENTS.hybrid, confidence: Math.max(confidence, 40), reasons };
  }

  return { agent: AGENTS[topKey], confidence, reasons: reasons.slice(0, 3) };
}

export function matchAgent(selections: BuilderSelections) {
  return scoreAgent(selections);
}

export function buildAgentBrief(selections: BuilderSelections, agent: AgentProfile): string {
  const lines = [
    `Agent: ${agent.name}`,
    `Pace: ${selections.pace ?? "—"}`,
    `Interaction: ${selections.interaction ?? "—"}`,
    `Asset pack: ${selections.assetPack ?? "—"}`,
    `Goal: ${selections.goal ?? "—"}`,
    `Session: ${selections.sessionLength ?? "—"}`,
    "",
    `Prompt: ${selections.prompt.trim() || "(none yet)"}`,
  ];
  return lines.join("\n");
}
