import CoinDashGame from "@/components/games/CoinDashGame";
import TankArenaGame from "@/components/games/TankArenaGame";
import DungeonStrikeGame from "@/components/games/DungeonStrikeGame";
import ArtilleryDuelGame from "@/components/games/ArtilleryDuelGame";
import type { GameMeta } from "./types";

export const GAMES: GameMeta[] = [
  {
    id: "coin-dash",
    title: "Coin Dash",
    hint: "Tap top to jump, bottom to duck — one life only",
    component: CoinDashGame,
  },
  {
    id: "tank-arena",
    title: "Tank Arena",
    hint: "Drag to move — auto-aim blasts enemy tanks",
    component: TankArenaGame,
  },
  {
    id: "dungeon-strike",
    title: "Dungeon Strike",
    hint: "Tap enemies before they reach you",
    component: DungeonStrikeGame,
  },
  {
    id: "artillery",
    title: "Artillery Duel",
    hint: "Tap the sky where you want the shell to land",
    component: ArtilleryDuelGame,
  },
];

export const TOTAL_SLIDES = GAMES.length + 1;
