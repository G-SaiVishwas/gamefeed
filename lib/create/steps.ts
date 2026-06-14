import type { AssetPack, Goal, Interaction, Pace, SessionLength } from "./types";

export interface StepOption<T extends string = string> {
  id: T;
  label: string;
  description: string;
  emoji: string;
}

export interface AssetPackOption extends StepOption<AssetPack> {
  previewBg: string;
  previews: { src: string; label: string }[];
  includes: string;
}

export interface BuilderStep {
  id: string;
  title: string;
  subtitle: string;
  helper: string;
}

export const BUILDER_STEPS: BuilderStep[] = [
  {
    id: "pace",
    title: "Pace & energy",
    subtitle: "How should the game feel moment to moment?",
    helper: "This sets tick speed, spawn rates, and pressure curves for your specialized builder agent.",
  },
  {
    id: "interaction",
    title: "Core interaction",
    subtitle: "What does the player do with their thumb?",
    helper: "We optimize for phone-first controls that still work inside a vertical swipe feed.",
  },
  {
    id: "assetPack",
    title: "Asset pack",
    subtitle: "Pick a visual world for your game.",
    helper: "Every pack is a ready-made GameFeed library — sprites, tiles, and SFX included. No downloads needed.",
  },
  {
    id: "goal",
    title: "Win condition",
    subtitle: "What is the player trying to achieve?",
    helper: "Drives scoring, lives, timers, and how the game ends.",
  },
  {
    id: "sessionLength",
    title: "Session length",
    subtitle: "How long should one round last?",
    helper: "Quick bursts fit the feed; longer rounds suit deeper loops.",
  },
  {
    id: "prompt",
    title: "Describe your game",
    subtitle: "Tell us the fantasy in your own words.",
    helper: "Your prompt plus the steps above route you to the right specialized build agent.",
  },
];

export const PACE_OPTIONS: StepOption<Pace>[] = [
  {
    id: "fast",
    label: "Fast & arcade",
    description: "Quick reflexes, rising intensity, high score chase.",
    emoji: "⚡",
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Easy to pick up, room to improve over time.",
    emoji: "🎯",
  },
  {
    id: "relaxed",
    label: "Slow & relaxing",
    description: "Low pressure, satisfying loops, no rush.",
    emoji: "🌿",
  },
];

export const INTERACTION_OPTIONS: StepOption<Interaction>[] = [
  {
    id: "tap",
    label: "Tap",
    description: "Jump, strike, or react — one touch, instant feedback.",
    emoji: "👆",
  },
  {
    id: "drag",
    label: "Drag",
    description: "Aim, move, or draw paths — continuous control.",
    emoji: "✋",
  },
  {
    id: "mixed",
    label: "Tap + drag",
    description: "Feed-safe mix — e.g. move with drag, act with tap.",
    emoji: "🎮",
  },
];

export const ASSET_PACK_OPTIONS: AssetPackOption[] = [
  {
    id: "platformer",
    label: "Platformer",
    description: "Characters, coins, ground enemies — runner vibes.",
    emoji: "🏃",
    previewBg: "linear-gradient(180deg, #87ceeb 0%, #8fd694 100%)",
    includes: "21 sprites · 3 SFX",
    previews: [
      { src: "/sprites/platformer/character_green_walk_a.png", label: "Hero" },
      { src: "/sprites/platformer/coin_gold.png", label: "Coin" },
      { src: "/sprites/platformer/slime_normal_walk_a.png", label: "Slime" },
      { src: "/sprites/platformer/bee_a.png", label: "Flyer" },
    ],
  },
  {
    id: "tanks-td",
    label: "Top-down tanks",
    description: "Arena combat, bullets, explosions, sand terrain.",
    emoji: "🔫",
    previewBg: "#d9c08a",
    includes: "15 sprites",
    previews: [
      { src: "/sprites/tanks-td/tank_blue.png", label: "Player" },
      { src: "/sprites/tanks-td/tank_red.png", label: "Enemy" },
      { src: "/sprites/tanks-td/explosion1.png", label: "Blast" },
      { src: "/sprites/tanks-td/crateWood.png", label: "Decor" },
    ],
  },
  {
    id: "dungeon",
    label: "Scribble dungeon",
    description: "Doodle heroes, corridors, hand-drawn charm.",
    emoji: "🗡️",
    previewBg: "#f4ecd8",
    includes: "12+ sprites",
    previews: [
      { src: "/sprites/dungeon/green_character.png", label: "Hero" },
      { src: "/sprites/dungeon/red_character.png", label: "Swarm" },
      { src: "/sprites/dungeon/dragon.png", label: "Boss" },
      { src: "/sprites/dungeon/weapon_sword.png", label: "Sword" },
    ],
  },
  {
    id: "artillery",
    label: "Artillery",
    description: "Side-view tanks, arcing shots, trajectory puzzles.",
    emoji: "💣",
    previewBg: "linear-gradient(180deg, #bfe9ff 0%, #fdf6e3 100%)",
    includes: "17 sprites",
    previews: [
      { src: "/sprites/artillery/tanks_tankGreen1.png", label: "Green" },
      { src: "/sprites/artillery/tanks_tankDesert1.png", label: "Desert" },
      { src: "/sprites/artillery/tank_bulletFly1.png", label: "Shell" },
      { src: "/sprites/artillery/tank_explosion1.png", label: "Boom" },
    ],
  },
];

export const GOAL_OPTIONS: StepOption<Goal>[] = [
  {
    id: "survive",
    label: "Survive",
    description: "Dodge threats and stay alive as long as possible.",
    emoji: "❤️",
  },
  {
    id: "score",
    label: "High score",
    description: "Rack up points — distance, combos, or pickups.",
    emoji: "🏆",
  },
  {
    id: "clear",
    label: "Clear enemies",
    description: "Defeat waves before they reach you.",
    emoji: "👾",
  },
  {
    id: "precision",
    label: "Precision hits",
    description: "Land skill shots or perfect timing windows.",
    emoji: "🎯",
  },
];

export const SESSION_OPTIONS: StepOption<SessionLength>[] = [
  {
    id: "quick",
    label: "Quick burst",
    description: "15–30 seconds — perfect for a feed swipe.",
    emoji: "⏱️",
  },
  {
    id: "standard",
    label: "Standard round",
    description: "45–60 seconds — one full arc of gameplay.",
    emoji: "🕐",
  },
  {
    id: "endless",
    label: "Endless chill",
    description: "No hard cap — play until you slip up.",
    emoji: "♾️",
  },
];
