"use client";

import { motion, AnimatePresence } from "framer-motion";

interface GameHudProps {
  title: string;
  score: number | string;
  accentColor?: string;
  timer?: number;
  maxTimer?: number;
  combo?: number;
  subtitle?: string;
}

export default function GameHud({
  title,
  score,
  accentColor = "#818cf8",
  timer,
  maxTimer,
  combo,
  subtitle,
}: GameHudProps) {
  const timerProgress =
    timer !== undefined && maxTimer ? timer / maxTimer : undefined;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-14 pb-2">
      <div className="flex items-start justify-between">
        {/* Title pill */}
        <div
          className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{
            background: `${accentColor}18`,
            color: accentColor,
            boxShadow: `0 0 12px ${accentColor}25`,
          }}
        >
          {title}
        </div>

        {/* Timer ring */}
        {timerProgress !== undefined && (
          <div className="relative h-9 w-9">
            <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="2"
              />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                strokeDasharray={`${timerProgress * 94.2} 94.2`}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 4px ${accentColor})` }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tabular-nums text-white/70">
              {timer}
            </span>
          </div>
        )}
      </div>

      {/* Score */}
      <div className="mt-3 flex items-end gap-3">
        <motion.span
          key={String(score)}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-display text-4xl font-bold tabular-nums leading-none"
          style={{
            fontFamily: "var(--font-space-grotesk)",
            color: "#fff",
            textShadow: `0 0 20px ${accentColor}80, 0 0 40px ${accentColor}30`,
          }}
        >
          {score}
        </motion.span>
        {subtitle && (
          <span className="mb-1 text-xs text-white/30">{subtitle}</span>
        )}
      </div>

      {/* Combo */}
      <AnimatePresence>
        {combo !== undefined && combo > 1 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="mt-1 inline-block rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wider"
            style={{
              background: `${accentColor}25`,
              color: accentColor,
              textShadow: `0 0 8px ${accentColor}`,
            }}
          >
            {combo}x combo
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
