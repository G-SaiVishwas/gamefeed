"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameMeta, GameResult } from "@/lib/games/types";
import { track } from "@/lib/analytics";
import FeedSocialRail from "@/components/FeedSocialRail";

interface GameSlideProps {
  game: GameMeta;
  gameIndex: number;
  isActive: boolean;
}

const HINT_DURATION_MS = 1600;

export default function GameSlide({ game, gameIndex, isActive }: GameSlideProps) {
  const [finished, setFinished] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [hintVisible, setHintVisible] = useState(true);
  const [gameReady, setGameReady] = useState(false);
  const GameComponent = game.component;
  const viewedRef = useRef(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      viewedRef.current = false;
      startedRef.current = false;
      return;
    }

    const startTimer = setTimeout(() => setGameReady(true), HINT_DURATION_MS);
    const hideTimer = setTimeout(() => setHintVisible(false), HINT_DURATION_MS + 400);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(hideTimer);
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive && !viewedRef.current) {
      viewedRef.current = true;
      track("game_viewed", { gameId: game.id, gameIndex });
      track("games_reached", { count: gameIndex + 1 });
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
        isActive={isActive && gameReady}
        onStart={handleStart}
        onComplete={handleComplete}
      />

      {isActive && <FeedSocialRail slideId={game.id} />}

      {/* Bottom caption — Instagram style */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-30 px-4 pr-16">
        <p className="mb-1 text-sm font-bold text-white drop-shadow-md">@gamefeed</p>
        <p className="text-sm text-white/90 drop-shadow-md">
          <span className="font-semibold">{game.title}</span>
          {" · "}
          {game.hint}
        </p>
        {gameIndex === 0 && (
          <p className="mt-1.5 text-xs text-white/50">Swipe ↑ for the next game</p>
        )}
      </div>

      {/* Hint overlay before game starts */}
      <AnimatePresence>
        {isActive && hintVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-[2px]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="mx-6 rounded-2xl border border-white/10 bg-black/60 px-6 py-5 text-center backdrop-blur-md"
            >
              <p
                className="mb-1 text-lg font-bold text-white"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {game.title}
              </p>
              <p className="text-sm text-white/70">{game.hint}</p>
              {!gameReady && (
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="mt-3 text-xs font-medium uppercase tracking-widest text-indigo-400"
                >
                  Starting...
                </motion.p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {finished && isActive && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex flex-col items-center pb-24"
          >
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
