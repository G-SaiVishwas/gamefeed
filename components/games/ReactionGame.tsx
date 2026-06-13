"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameComponentProps } from "@/lib/games/types";
import { useGameLifecycle } from "@/lib/games/hooks";
import { GAME_ACCENTS } from "@/lib/games/effects";

const NEON_COLORS = [
  { bg: "linear-gradient(135deg, #fb7185, #e11d48)", glow: "#fb7185" },
  { bg: "linear-gradient(135deg, #4ade80, #16a34a)", glow: "#4ade80" },
  { bg: "linear-gradient(135deg, #60a5fa, #2563eb)", glow: "#60a5fa" },
  { bg: "linear-gradient(135deg, #facc15, #ca8a04)", glow: "#facc15" },
  { bg: "linear-gradient(135deg, #c084fc, #9333ea)", glow: "#c084fc" },
  { bg: "linear-gradient(135deg, #fb923c, #ea580c)", glow: "#fb923c" },
];

const ROUNDS = 5;
const MIN_DELAY = 1200;
const MAX_DELAY = 2800;

interface Ripple { x: number; y: number; id: number; }

export default function ReactionGame(props: GameComponentProps) {
  const { isActive, onStart, onComplete } = props;
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });

  const [phase, setPhase] = useState<"waiting" | "go" | "result" | "done">("waiting");
  const [bgStyle, setBgStyle] = useState(NEON_COLORS[0].bg);
  const [glowColor, setGlowColor] = useState(NEON_COLORS[0].glow);
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const [round, setRound] = useState(0);
  const [reactions, setReactions] = useState<number[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const goTimeRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);
  const rippleId = useRef(0);

  const finishGame = useCallback(
    (times: number[]) => {
      if (!runningRef.current) return;
      runningRef.current = false;
      const avg = times.length === 0 ? 0 : Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      complete(avg, true);
    },
    [complete]
  );

  const startRound = useCallback((roundNum: number) => {
    if (!runningRef.current) return;
    setPhase("waiting");
    setReactionMs(null);
    setRound(roundNum);

    const color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)];
    setBgStyle(color.bg);
    setGlowColor(color.glow);

    const delay = MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
    timeoutRef.current = setTimeout(() => {
      if (!runningRef.current) return;
      goTimeRef.current = performance.now();
      setPhase("go");
      setBgStyle("linear-gradient(135deg, #ffffff, #e2e8f0)");
      setGlowColor("#ffffff");
    }, delay);
  }, []);

  useEffect(() => {
    if (!isActive) return;
    runningRef.current = true;
    queueMicrotask(() => {
      setReactions([]);
      setPhase("waiting");
      setReactionMs(null);
      setRound(0);
      setRipples([]);
      startRound(1);
    });
    return () => {
      runningRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isActive, startRound]);

  const handleTap = (e: React.PointerEvent) => {
    if (!runningRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rx = e.clientX - rect.left;
    const ry = e.clientY - rect.top;
    setRipples((prev) => [...prev, { x: rx, y: ry, id: rippleId.current++ }]);

    if (phase === "waiting") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runningRef.current = false;
      setPhase("done");
      complete(0, false);
      return;
    }

    if (phase === "go") {
      const ms = Math.round(performance.now() - goTimeRef.current);
      setReactionMs(ms);
      setPhase("result");
      setBgStyle(`linear-gradient(135deg, ${GAME_ACCENTS.reaction.primary}, ${GAME_ACCENTS.reaction.secondary})`);
      setGlowColor(GAME_ACCENTS.reaction.primary);

      setReactions((prev) => {
        const next = [...prev, ms];
        if (round >= ROUNDS) {
          setTimeout(() => finishGame(next), 1400);
        } else {
          setTimeout(() => startRound(round + 1), 1400);
        }
        return next;
      });
    }
  };

  const avg = reactions.length > 0 ? Math.round(reactions.reduce((a, b) => a + b, 0) / reactions.length) : null;
  const best = reactions.length > 0 ? Math.min(...reactions) : null;

  return (
    <button
      type="button"
      className="relative h-full w-full touch-none overflow-hidden transition-all duration-300"
      style={{ background: bgStyle }}
      onPointerDown={(e) => { e.preventDefault(); handleTap(e); }}
    >
      {/* Round indicator */}
      <div className="pointer-events-none absolute left-5 top-14 z-10">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.15em]"
          style={{
            background: "rgba(0,0,0,0.3)",
            color: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(8px)",
          }}
        >
          {round > 0 && round <= ROUNDS ? `${round}/${ROUNDS}` : ""}
        </span>
      </div>

      {/* Waiting pulse ring */}
      {phase === "waiting" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="h-32 w-32 rounded-full border-2"
            style={{ borderColor: `${glowColor}40`, boxShadow: `0 0 40px ${glowColor}20` }}
          />
        </div>
      )}

      {/* Tap ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute rounded-full border-2 border-white/40"
            style={{ left: r.x - 25, top: r.y - 25, width: 50, height: 50 }}
          />
        ))}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === "go" && (
          <motion.div
            key="go"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span
              className="text-5xl font-bold tracking-tight text-black"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              TAP!
            </span>
          </motion.div>
        )}

        {phase === "result" && reactionMs !== null && (
          <motion.div
            key="result"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
          >
            <span
              className="text-6xl font-bold tabular-nums text-white neon-text"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {reactionMs}
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/50">ms</span>
          </motion.div>
        )}

        {phase === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-lg font-medium text-white/60">Too early!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats footer */}
      {avg !== null && phase !== "go" && (
        <div className="pointer-events-none absolute inset-x-0 bottom-20 flex justify-center gap-6">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-white/30">Avg</p>
            <p className="font-mono text-sm tabular-nums text-white/60">{avg}ms</p>
          </div>
          {best !== null && (
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-white/30">Best</p>
              <p className="font-mono text-sm tabular-nums text-white/60">{best}ms</p>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
