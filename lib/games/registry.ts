import DodgeGame from "@/components/games/DodgeGame";
import TapRushGame from "@/components/games/TapRushGame";
import StackGame from "@/components/games/StackGame";
import ReactionGame from "@/components/games/ReactionGame";
import type { GameMeta } from "./types";

export const GAMES: GameMeta[] = [
  {
    id: "dodge",
    title: "Dodge",
    hint: "Drag to dodge the falling shards",
    component: DodgeGame,
  },
  {
    id: "tap-rush",
    title: "Tap Rush",
    hint: "Tap orbs before they vanish",
    component: TapRushGame,
  },
  {
    id: "stack",
    title: "Stack",
    hint: "Tap to drop and stack blocks",
    component: StackGame,
  },
  {
    id: "reaction",
    title: "Reaction",
    hint: "Wait for white — then tap fast",
    component: ReactionGame,
  },
];

export const TOTAL_SLIDES = GAMES.length + 1; // +1 for waitlist
