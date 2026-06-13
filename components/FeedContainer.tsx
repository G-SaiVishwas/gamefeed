"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, animate } from "framer-motion";
import { GAMES, TOTAL_SLIDES } from "@/lib/games/registry";
import GameSlide from "@/components/GameSlide";
import WaitlistSlide from "@/components/WaitlistSlide";
import { startSession, track } from "@/lib/analytics";

const SWIPE_THRESHOLD = 60;
const SLIDE_COLORS = ["#818cf8", "#c084fc", "#67e8f9", "#f472b6", "#6366f1"];

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

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isAnimatingRef.current) return;
      const deltaY = touchStartY.current - e.changedTouches[0].clientY;
      const deltaX = Math.abs(touchStartX.current - e.changedTouches[0].clientX);
      if (Math.abs(deltaY) < SWIPE_THRESHOLD || Math.abs(deltaY) < deltaX) return;
      if (deltaY > 0) goToIndex(currentIndex + 1, "up");
      else goToIndex(currentIndex - 1, "down");
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (isAnimatingRef.current) return;
      if (e.deltaY > 40) goToIndex(currentIndex + 1, "up");
      else if (e.deltaY < -40) goToIndex(currentIndex - 1, "down");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isAnimatingRef.current) return;
      if (e.key === "ArrowDown" || e.key === "j") goToIndex(currentIndex + 1, "up");
      else if (e.key === "ArrowUp" || e.key === "k") goToIndex(currentIndex - 1, "down");
    };

    feed.addEventListener("touchstart", handleTouchStart, { passive: true });
    feed.addEventListener("touchend", handleTouchEnd, { passive: true });
    feed.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      feed.removeEventListener("touchstart", handleTouchStart);
      feed.removeEventListener("touchend", handleTouchEnd);
      feed.removeEventListener("wheel", handleWheel);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, goToIndex]);

  useEffect(() => {
    if (slideHeight > 0) y.set(-currentIndex * slideHeight);
  }, [slideHeight, currentIndex, y]);

  return (
    <div ref={feedRef} className="relative h-full w-full overflow-hidden touch-pan-y">
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
              color: "rgba(255,255,255,0.25)",
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
