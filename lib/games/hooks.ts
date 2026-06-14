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

/** Scale factor relative to a ~390×700 reference phone viewport. */
export function gameScale(w: number, h: number): number {
  return Math.min(w / 390, h / 700);
}

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
  dpr: number;
  scale: number;
}

/**
 * Resize the canvas to its parent and apply the DPR transform.
 * Call at the start of every animation frame — setting canvas.width resets
 * the context transform, so a one-time resize hook is not enough.
 */
export function prepareCanvasFrame(
  canvas: HTMLCanvasElement
): CanvasFrame | null {
  const parent = canvas.parentElement;
  if (!parent) return null;

  const dpr = window.devicePixelRatio || 1;
  const w = parent.clientWidth;
  const h = parent.clientHeight;
  if (w <= 0 || h <= 0) return null;

  const pw = Math.round(w * dpr);
  const ph = Math.round(h * dpr);
  if (canvas.width !== pw || canvas.height !== ph) {
    canvas.width = pw;
    canvas.height = ph;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = true;

  return { ctx, w, h, dpr, scale: gameScale(w, h) };
}

/** @deprecated Use prepareCanvasFrame inside the game loop instead. */
export function useCanvasSize(
  canvasRef: React.RefObject<HTMLCanvasElement | null>
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas?.parentElement) return;

    const observer = new ResizeObserver(() => {
      prepareCanvasFrame(canvas);
    });
    observer.observe(canvas.parentElement);
    prepareCanvasFrame(canvas);
    return () => observer.disconnect();
  }, [canvasRef]);
}
