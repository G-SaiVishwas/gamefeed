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
    <div className="relative h-full w-full overflow-hidden bg-[#fdf6e3]">
      <GameComponent
        isActive={isActive && gameReady}
        onStart={handleStart}
        onComplete={handleComplete}
      />

      {isActive && <FeedSocialRail slideId={game.id} />}

      {/* Top caption — kept away from bottom touch zone */}
      <div className="pointer-events-none absolute inset-x-0 top-16 z-30 px-4 pr-16">
        <div className="inline-block max-w-[85%] rounded-xl bg-white/90 px-3 py-1.5 shadow-sm">
          <p className="text-xs font-bold text-[#2b2b3a]">@gamefeed</p>
          <p className="text-xs leading-snug text-[#2b2b3a]/90">
            <span className="font-semibold">{game.title}</span>
            {" · "}
            {game.hint}
          </p>
          {gameIndex === 0 && (
            <p className="mt-0.5 text-[10px] text-[#2b2b3a]/50">Swipe up from the bottom for the next game</p>
          )}
        </div>
      </div>

      {/* Hint overlay before game starts */}
      <AnimatePresence>
        {isActive && hintVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[1px]"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card mx-6 px-6 py-5 text-center"
            >
              <p
                className="mb-1 text-lg font-bold text-[#2b2b3a]"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {game.title}
              </p>
              <p className="text-sm text-[#2b2b3a]/70">{game.hint}</p>
              {!gameReady && (
                <motion.p
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="mt-3 text-xs font-medium uppercase tracking-widest text-[#3b82f6]"
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
            className="pointer-events-none absolute inset-x-0 top-1/3 z-30 flex flex-col items-center"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.5 }}
              className="glass-card mb-4 rounded-2xl px-6 py-3 text-center neon-ring"
            >
              <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-[#2b2b3a]/50">
                Score
              </p>
              <p
                className="font-display text-3xl font-bold tabular-nums text-[#2b2b3a]"
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#3b82f6]/70">
                <path d="M12 5L12 19M12 5L6 11M12 5L18 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#2b2b3a]/35">
                Swipe up
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
