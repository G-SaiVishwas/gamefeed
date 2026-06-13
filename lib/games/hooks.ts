"use client";

import { useCallback, useEffect, useRef } from "react";
import type { GameComponentProps } from "./types";

export function useGameLifecycle({
  isActive,
  onStart,
  onComplete,
}: GameComponentProps) {
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (isActive && !startedRef.current) {
      startedRef.current = true;
      completedRef.current = false;
      startTimeRef.current = Date.now();
      onStart();
    }
    if (!isActive) {
      startedRef.current = false;
      completedRef.current = false;
    }
  }, [isActive, onStart]);

  const complete = useCallback(
    (score: number, completed = true) => {
      if (completedRef.current) return;
      completedRef.current = true;
      const timeSpentMs = Date.now() - startTimeRef.current;
      onComplete({ score, completed, timeSpentMs });
    },
    [onComplete]
  );

  return { complete, startedRef, completedRef };
}

export function useCanvasSize(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas.parentElement!);
    return () => observer.disconnect();
  }, [canvasRef]);
}
