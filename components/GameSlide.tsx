"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameMeta, GameResult } from "@/lib/games/types";
import { track } from "@/lib/analytics";

interface GameSlideProps {
  game: GameMeta;
  gameIndex: number;
  isActive: boolean;
}

export default function GameSlide({ game, gameIndex, isActive }: GameSlideProps) {
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const GameComponent = game.component;
  const viewedRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (isActive && !viewedRef.current) {
      viewedRef.current = true;
      track("game_viewed", { gameId: game.id, gameIndex });
      track("games_reached", { count: gameIndex + 1 });
    }
    if (!isActive) {
      viewedRef.current = false;
      startedRef.current = false;
    }
  }, [isActive, game.id, gameIndex]);

  const handleStart = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("game_started", { gameId: game.id, gameIndex });
  }, [game.id, gameIndex]);

  const handleComplete = useCallback(
    (result: GameResult) => {
      setFinished(true);
      setFinalScore(result.score);
      track("game_completed", {
        gameId: game.id,
        gameIndex,
        score: result.score,
        timeSpentMs: result.timeSpentMs,
        completed: result.completed,
      });
    },
    [game.id, gameIndex]
  );

  if (!isActive && !finished) return null;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#06060a]">
      <GameComponent
        isActive={isActive}
        onStart={handleStart}
        onComplete={handleComplete}
      />

      <AnimatePresence>
        {finished && isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center pb-10"
          >
            {/* Score summary card */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
              className="glass-card mb-4 rounded-2xl px-6 py-3 text-center neon-ring"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/40">
                Score
              </p>
              <p
                className="font-display text-3xl font-bold tabular-nums neon-text"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {finalScore}
              </p>
            </motion.div>

            {/* Swipe hint */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="flex flex-col items-center gap-1.5"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-indigo-400/60">
                <path d="M12 5L12 19M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/25">
                Swipe up
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
