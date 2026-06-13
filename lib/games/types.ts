import type { ComponentType } from "react";

export interface GameResult {
  score: number;
  completed: boolean;
  timeSpentMs: number;
}

export interface GameComponentProps {
  isActive: boolean;
  onStart: () => void;
  onComplete: (result: GameResult) => void;
}

export interface GameMeta {
  id: string;
  title: string;
  hint: string;
  component: ComponentType<GameComponentProps>;
}
