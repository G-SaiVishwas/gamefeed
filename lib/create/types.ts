export type Pace = "fast" | "balanced" | "relaxed";
export type Interaction = "tap" | "drag" | "mixed";
export type AssetPack = "platformer" | "tanks-td" | "dungeon" | "artillery";
export type Goal = "survive" | "score" | "clear" | "precision";
export type SessionLength = "quick" | "standard" | "endless";

export interface BuilderSelections {
  pace: Pace | null;
  interaction: Interaction | null;
  assetPack: AssetPack | null;
  goal: Goal | null;
  sessionLength: SessionLength | null;
  prompt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  tagline: string;
  description: string;
  accent: string;
  exampleGames: string[];
  strengths: string[];
}

export const INITIAL_SELECTIONS: BuilderSelections = {
  pace: null,
  interaction: null,
  assetPack: null,
  goal: null,
  sessionLength: null,
  prompt: "",
};
