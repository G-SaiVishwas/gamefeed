"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { GAMES, TOTAL_SLIDES } from "@/lib/games/registry";
import GameSlide from "@/components/GameSlide";
import WaitlistSlide from "@/components/WaitlistSlide";
import { startSession, track } from "@/lib/analytics";
import { isGameInputLocked } from "@/lib/games/inputLock";

const SWIPE_THRESHOLD = 60;
const BOTTOM_NAV_ZONE_PX = 72;
const SLIDE_COLORS = ["#4ade80", "#3b82f6", "#a855f7", "#eab308", "#f97316"];

export default function FeedContainer() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [navGeneration, setNavGeneration] = useState(0);
  const [slideHeight, setSlideHeight] = useState(0);
  const y = useMotionValue(0);
  const feedRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  const initializedRef = useRef(false);
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);
  const navGestureStartedInBottomZone = useRef(false);

  const isInBottomNavZone = useCallback((clientY: number) => {
    const feed = feedRef.current;
    if (!feed) return false;
    const rect = feed.getBoundingClientRect();
    return clientY >= rect.bottom - BOTTOM_NAV_ZONE_PX;
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    startSession();
    track("feed_opened");
  }, []);

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSlideHeight(entry.contentRect.height);
    });
    observer.observe(feed);
    return () => observer.disconnect();
  }, []);

  const goToIndex = useCallback(
    (newIndex: number, direction: "up" | "down") => {
      const clamped = Math.max(0, Math.min(TOTAL_SLIDES - 1, newIndex));
      if (clamped === currentIndex || isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      track("swipe", {
        direction,
        fromIndex: currentIndex,
        toIndex: clamped,
      });

      animate(y, -clamped * slideHeight, {
        type: "spring",
        stiffness: 320,
        damping: 32,
        onComplete: () => {
          setCurrentIndex(clamped);
          setNavGeneration((g) => g + 1);
          isAnimatingRef.current = false;
        },
      });
    },
    [currentIndex, slideHeight, y]
  );

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      touchStartY.current = e.clientY;
      touchStartX.current = e.clientX;
      navGestureStartedInBottomZone.current = isInBottomNavZone(e.clientY);
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if (isAnimatingRef.current || isGameInputLocked()) return;
      if (!navGestureStartedInBottomZone.current) return;
      const deltaY = touchStartY.current - e.clientY;
      const deltaX = Math.abs(touchStartX.current - e.clientX);
      if (Math.abs(deltaY) < SWIPE_THRESHOLD || Math.abs(deltaY) < deltaX) return;
      if (deltaY > 0) goToIndex(currentIndex + 1, "up");
      else goToIndex(currentIndex - 1, "down");
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimatingRef.current || isGameInputLocked()) return;
      if (!isInBottomNavZone(e.clientY)) return;
      if (e.deltaY > 40) goToIndex(currentIndex + 1, "up");
      else if (e.deltaY < -40) goToIndex(currentIndex - 1, "down");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingRef.current) return;
      if (e.key === "ArrowDown" || e.key === "j") goToIndex(currentIndex + 1, "up");
      else if (e.key === "ArrowUp" || e.key === "k") goToIndex(currentIndex - 1, "down");
    };

    feed.addEventListener("pointerdown", handlePointerDown);
    feed.addEventListener("pointerup", handlePointerUp);
    feed.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      feed.removeEventListener("pointerdown", handlePointerDown);
      feed.removeEventListener("pointerup", handlePointerUp);
      feed.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, goToIndex, isInBottomNavZone]);

  useEffect(() => {
    if (slideHeight > 0) y.set(-currentIndex * slideHeight);
  }, [slideHeight, currentIndex, y]);

  return (
    <div ref={feedRef} className="relative h-full w-full overflow-hidden touch-none">
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex flex-col items-center pb-3">
        <div
          className="mb-1 h-1 w-10 rounded-full bg-[#2b2b3a]/20"
          aria-hidden
        />
        <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#2b2b3a] shadow-sm">
          Swipe up from here
        </span>
      </div>
      <motion.div
        className="relative w-full will-change-transform"
        style={{ y, height: slideHeight * TOTAL_SLIDES }}
      >
        {GAMES.map((game, index) => (
          <div
            key={game.id}
            className="absolute left-0 w-full"
            style={{ top: index * slideHeight, height: slideHeight }}
          >
            {Math.abs(index - currentIndex) <= 1 && (
              <motion.div
                className="h-full w-full"
                animate={{
                  scale: index === currentIndex ? 1 : 0.96,
                  opacity: index === currentIndex ? 1 : 0.5,
                }}
                transition={{ duration: 0.3 }}
              >
                <GameSlide
                  key={
                    index === currentIndex
                      ? `${game.id}-${navGeneration}`
                      : `${game.id}-adjacent`
                  }
                  game={game}
                  gameIndex={index}
                  isActive={index === currentIndex}
                />
              </motion.div>
            )}
          </div>
        ))}

        <div
          className="absolute left-0 w-full"
          style={{ top: GAMES.length * slideHeight, height: slideHeight }}
        >
          {Math.abs(GAMES.length - currentIndex) <= 1 && (
            <WaitlistSlide isActive={currentIndex === GAMES.length} />
          )}
        </div>
      </motion.div>

      {/* Brand mark on first slide */}
      {currentIndex === 0 && (
        <div className="pointer-events-none absolute left-5 top-12 z-30">
          <span
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{
              fontFamily: "var(--font-space-grotesk)",
              color: "rgba(43,43,58,0.25)",
            }}
          >
            GameFeed
          </span>
        </div>
      )}

      {/* Neon progress indicator */}
      <div className="pointer-events-none absolute left-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => {
          const active = i === currentIndex;
          const color = SLIDE_COLORS[i] ?? "#6366f1";
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-500"
              style={{
                width: active ? 3 : 2,
                height: active ? 20 : 6,
                background: active ? color : "rgba(255,255,255,0.15)",
                boxShadow: active ? `0 0 8px ${color}80` : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
