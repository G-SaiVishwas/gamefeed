import DodgeGame from "@/components/games/DodgeGame";
import TapRushGame from "@/components/games/TapRushGame";
import StackGame from "@/components/games/StackGame";
import ReactionGame from "@/components/games/ReactionGame";
import type { GameMeta } from "./types";

export const GAMES: GameMeta[] = [
  {
    id: "dodge",
    title: "Dodge",
    component: DodgeGame,
  },
  {
    id: "tap-rush",
    title: "Tap Rush",
    component: TapRushGame,
  },
  {
    id: "stack",
    title: "Stack",
    component: StackGame,
  },
  {
    id: "reaction",
    title: "Reaction",
    component: ReactionGame,
  },
];

export const TOTAL_SLIDES = GAMES.length + 1; // +1 for waitlist
