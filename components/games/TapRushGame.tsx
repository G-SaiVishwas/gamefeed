"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { GameComponentProps } from "@/lib/games/types";
import { useGameLifecycle } from "@/lib/games/hooks";
import GameHud from "@/components/GameHud";
import { GAME_ACCENTS } from "@/lib/games/effects";

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  createdAt: number;
  lifetime: number;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

const GAME_DURATION_MS = 10000;

export default function TapRushGame(props: GameComponentProps) {
  const { isActive, onStart, onComplete } = props;
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });
  const containerRef = useRef<HTMLDivElement>(null);
  const [targets, setTargets] = useState<Target[]>([]);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [combo, setCombo] = useState(0);
  const [tick, setTick] = useState(0);
  const idRef = useRef(0);
  const rippleIdRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lastTapRef = useRef(0);
  const nowRef = useRef(0);
  const runningRef = useRef(false);

  const spawnTarget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const padding = 50;
    const w = container.clientWidth - padding * 2;
    const h = container.clientHeight - padding * 2;
    const size = 52 + Math.random() * 20;
    setTargets((prev) => [
      ...prev.slice(-5),
      {
        id: idRef.current++,
        x: padding + Math.random() * (w - size),
        y: padding + Math.random() * (h - size),
        size,
        createdAt: Date.now(),
        lifetime: 700 + Math.random() * 600,
      },
    ]);
  }, []);

  const endGame = useCallback(() => {
    if (!runningRef.current) return;
    runningRef.current = false;
    complete(scoreRef.current, true);
  }, [complete]);

  useEffect(() => {
    if (!isActive) return;

    scoreRef.current = 0;
    comboRef.current = 0;
    runningRef.current = true;
    idRef.current = 0;
    const startTime = Date.now();

    queueMicrotask(() => {
      setScore(0);
      setTimeLeft(10);
      setCombo(0);
      setTargets([]);
      setRipples([]);
    });

    spawnTarget();
    const spawnInterval = setInterval(spawnTarget, 550);

    const tickInterval = setInterval(() => {
      const now = Date.now();
      nowRef.current = now;
      setTick(now);
      const elapsed = now - startTime;
      setTimeLeft(Math.max(0, Math.ceil((GAME_DURATION_MS - elapsed) / 1000)));
      setTargets((prev) => prev.filter((t) => now - t.createdAt < t.lifetime));
      setRipples((prev) => prev.filter((r) => now - r.createdAt < 500));
      if (elapsed >= GAME_DURATION_MS) {
        clearInterval(spawnInterval);
        clearInterval(tickInterval);
        endGame();
      }
    }, 80);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(tickInterval);
      runningRef.current = false;
    };
  }, [isActive, spawnTarget, endGame]);

  const handleTap = (id: number, x: number, y: number, size: number) => {
    if (!runningRef.current) return;
    const now = nowRef.current;
    if (now - lastTapRef.current < 800) {
      comboRef.current += 1;
    } else {
      comboRef.current = 1;
    }
    lastTapRef.current = now;

    scoreRef.current += comboRef.current;
    setScore(scoreRef.current);
    setCombo(comboRef.current);
    setTargets((prev) => prev.filter((t) => t.id !== id));
    setRipples((prev) => [
      ...prev,
      { id: rippleIdRef.current++, x: x + size / 2, y: y + size / 2, createdAt: now },
    ]);
    spawnTarget();
  };

  return (
    <div ref={containerRef} className="relative h-full w-full touch-none overflow-hidden">
      {/* Grid backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(rgba(192,132,252,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(192,132,252,0.06) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <GameHud
        title="Tap Rush"
        score={score}
        accentColor={GAME_ACCENTS.tapRush.primary}
        timer={timeLeft}
        maxTimer={10}
        combo={combo}
      />

      {/* Ripples */}
      <AnimatePresence>
        {ripples.map((r) => (
          <motion.div
            key={r.id}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute rounded-full border-2"
            style={{
              left: r.x - 20,
              top: r.y - 20,
              width: 40,
              height: 40,
              borderColor: GAME_ACCENTS.tapRush.secondary,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Targets */}
      <AnimatePresence>
        {targets.map((target) => {
          const age = tick - target.createdAt;
          const progress = age / target.lifetime;
          const ringScale = 1 + progress * 0.3;
          return (
            <motion.button
              key={target.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute touch-none"
              style={{ left: target.x, top: target.y, width: target.size, height: target.size }}
              onPointerDown={(e) => {
                e.preventDefault();
                handleTap(target.id, target.x, target.y, target.size);
              }}
            >
              {/* Shrinking timer ring */}
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3" />
                <circle
                  cx="50" cy="50" r="46" fill="none"
                  stroke={GAME_ACCENTS.tapRush.secondary}
                  strokeWidth="3"
                  strokeDasharray={`${(1 - progress) * 289} 289`}
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 4px ${GAME_ACCENTS.tapRush.secondary})` }}
                />
              </svg>
              {/* Glowing orb */}
              <div
                className="absolute inset-[15%] rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 35%, ${GAME_ACCENTS.tapRush.primary}, ${GAME_ACCENTS.tapRush.secondary})`,
                  boxShadow: `0 0 20px ${GAME_ACCENTS.tapRush.glow}, 0 0 40px ${GAME_ACCENTS.tapRush.glow}`,
                  transform: `scale(${ringScale > 1.1 ? 0.9 : 1})`,
                }}
              />
            </motion.button>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
