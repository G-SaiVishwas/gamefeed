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
  accentColor = "#3b82f6",
  timer,
  maxTimer,
  combo,
  subtitle,
}: GameHudProps) {
  const timerProgress =
    timer !== undefined && maxTimer ? timer / maxTimer : undefined;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-36 pb-2">
      <div className="flex items-start justify-between">
        <div
          className="rounded-full border-2 border-[#2b2b3a] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]"
          style={{
            background: "#ffffff",
            color: accentColor,
            boxShadow: "2px 2px 0 #2b2b3a",
          }}
        >
          {title}
        </div>

        {timerProgress !== undefined && (
          <div className="relative h-9 w-9 rounded-full border-2 border-[#2b2b3a] bg-white shadow-[2px_2px_0_#2b2b3a]">
            <svg className="h-9 w-9 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(43,43,58,0.15)" strokeWidth="2" />
              <circle
                cx="18"
                cy="18"
                r="15"
                fill="none"
                stroke={accentColor}
                strokeWidth="2"
                strokeDasharray={`${timerProgress * 94.2} 94.2`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] tabular-nums text-[#2b2b3a]">
              {timer}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-end gap-3">
        <motion.span
          key={String(score)}
          initial={{ scale: 1.3, opacity: 0.5 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-display text-4xl font-bold tabular-nums leading-none text-[#2b2b3a]"
          style={{
            fontFamily: "var(--font-space-grotesk)",
            textShadow: "2px 2px 0 rgba(255,255,255,0.8)",
          }}
        >
          {score}
        </motion.span>
        {subtitle && <span className="mb-1 text-xs text-[#2b2b3a]/60">{subtitle}</span>}
      </div>

      <AnimatePresence>
        {combo !== undefined && combo > 1 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="mt-1 inline-block rounded-md border-2 border-[#2b2b3a] px-2 py-0.5 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_#2b2b3a]"
            style={{ background: "#ffffff", color: accentColor }}
          >
            {combo}x combo
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
