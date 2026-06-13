"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@/lib/games/types";
import { useCanvasSize, useGameLifecycle } from "@/lib/games/hooks";
import GameHud from "@/components/GameHud";
import {
  type Particle,
  GAME_ACCENTS,
  createBurst,
  updateParticles,
  drawNeonRect,
  drawGrid,
} from "@/lib/games/effects";

interface Block {
  x: number;
  width: number;
  y: number;
  hue: number;
}

interface FallingPiece {
  x: number;
  y: number;
  width: number;
  vy: number;
  hue: number;
}

const BLOCK_HEIGHT = 26;
const MAX_DURATION_MS = 15000;

function hueColor(h: number): string {
  return `hsl(${h}, 80%, 65%)`;
}

export default function StackGame(props: GameComponentProps) {
  const { isActive, onStart, onComplete } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });
  useCanvasSize(canvasRef);

  const stateRef = useRef({
    blocks: [] as Block[],
    fallingPieces: [] as FallingPiece[],
    particles: [] as Particle[],
    movingX: 0,
    movingWidth: 120,
    direction: 1,
    speed: 4,
    stackHeight: 0,
    baseHue: 200,
    running: false,
    startTime: 0,
    placed: false,
    flashAlpha: 0,
    perfectFlash: false,
    lastFrame: 0,
    gridOffset: 0,
  });

  const [displayScore, setDisplayScore] = useState(0);

  const endGame = useCallback(
    (score: number) => {
      stateRef.current.running = false;
      complete(score, true);
    },
    [complete]
  );

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = stateRef.current;
    const w = canvas.clientWidth;
    const baseWidth = Math.min(w * 0.55, 170);

    state.blocks = [{ x: (w - baseWidth) / 2, width: baseWidth, y: canvas.clientHeight - BLOCK_HEIGHT, hue: state.baseHue }];
    state.fallingPieces = [];
    state.particles = [];
    state.movingWidth = baseWidth;
    state.movingX = 0;
    state.direction = 1;
    state.speed = 4.5;
    state.stackHeight = 0;
    state.baseHue = 200;
    state.running = true;
    state.startTime = performance.now();
    state.lastFrame = state.startTime;
    state.placed = false;
    state.flashAlpha = 0;
    state.perfectFlash = false;
    state.gridOffset = 0;
    queueMicrotask(() => setDisplayScore(0));

    const placeBlock = () => {
      if (state.placed || !state.running) return;
      state.placed = true;

      const prev = state.blocks[state.blocks.length - 1];
      const ml = state.movingX;
      const mr = state.movingX + state.movingWidth;
      const pl = prev.x;
      const pr = prev.x + prev.width;
      const overlapLeft = Math.max(ml, pl);
      const overlapRight = Math.min(mr, pr);
      const overlap = overlapRight - overlapLeft;

      if (overlap <= 6) {
        endGame(state.stackHeight);
        return;
      }

      const sliceLeft = ml < pl ? { x: ml, width: pl - ml } : null;
      const sliceRight = mr > pr ? { x: pr, width: mr - pr } : null;
      const hue = state.baseHue + state.blocks.length * 8;

      if (sliceLeft) {
        state.fallingPieces.push({ x: sliceLeft.x, y: prev.y - BLOCK_HEIGHT, width: sliceLeft.width, vy: 0, hue });
      }
      if (sliceRight) {
        state.fallingPieces.push({ x: sliceRight.x, y: prev.y - BLOCK_HEIGHT, width: sliceRight.width, vy: 0, hue });
      }

      const perfect = Math.abs(overlap - prev.width) < 4;
      if (perfect) {
        state.perfectFlash = true;
        state.flashAlpha = 0.3;
        const cx = overlapLeft + overlap / 2;
        state.particles.push(...createBurst(cx, prev.y - BLOCK_HEIGHT, 12, hueColor(hue), 3));
      }

      state.blocks.push({ x: overlapLeft, width: overlap, y: prev.y - BLOCK_HEIGHT, hue });
      state.stackHeight += 1;
      state.movingWidth = overlap;
      state.movingX = overlapLeft;
      state.speed = Math.min(state.speed + 0.5, 11);
      queueMicrotask(() => setDisplayScore(state.stackHeight));

      if (performance.now() - state.startTime >= MAX_DURATION_MS) {
        endGame(state.stackHeight);
        return;
      }

      setTimeout(() => { state.placed = false; }, 180);
    };

    canvas.addEventListener("pointerdown", placeBlock);
    let animId: number;

    const loop = (now: number) => {
      if (!state.running) return;
      const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
      state.lastFrame = now;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      if (!state.placed) {
        state.movingX += state.speed * state.direction;
        if (state.movingX + state.movingWidth > cw - 16) state.direction = -1;
        else if (state.movingX < 16) state.direction = 1;
      }

      for (const fp of state.fallingPieces) {
        fp.vy += 0.4;
        fp.y += fp.vy;
      }
      state.fallingPieces = state.fallingPieces.filter((fp) => fp.y < ch + 50);

      state.particles = updateParticles(state.particles, dt);
      state.gridOffset += dt * 15;
      if (state.flashAlpha > 0) state.flashAlpha -= dt * 1.5;
      if (state.perfectFlash) state.perfectFlash = false;

      const cameraY = Math.max(0, state.blocks[state.blocks.length - 1].y - ch * 0.55);
      const bgHue = state.baseHue + state.stackHeight * 3;

      ctx.fillStyle = `hsl(${bgHue}, 30%, 4%)`;
      ctx.fillRect(0, 0, cw, ch);
      drawGrid(ctx, cw, ch, state.gridOffset, `hsla(${bgHue}, 60%, 50%, 0.04)`);

      for (const block of state.blocks) {
        drawNeonRect(ctx, block.x, block.y - cameraY, block.width, BLOCK_HEIGHT, hueColor(block.hue));
      }

      for (const fp of state.fallingPieces) {
        drawNeonRect(ctx, fp.x, fp.y - cameraY, fp.width, BLOCK_HEIGHT, hueColor(fp.hue), false);
      }

      if (!state.placed) {
        const movingY = state.blocks[state.blocks.length - 1].y - BLOCK_HEIGHT - cameraY;
        const hue = state.baseHue + state.blocks.length * 8;
        ctx.globalAlpha = 0.85;
        drawNeonRect(ctx, state.movingX, movingY, state.movingWidth, BLOCK_HEIGHT, hueColor(hue));
        ctx.globalAlpha = 1;
      }

      for (const p of state.particles) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y - cameraY, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (state.flashAlpha > 0) {
        ctx.fillStyle = `rgba(103,232,249,${state.flashAlpha})`;
        ctx.fillRect(0, 0, cw, ch);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointerdown", placeBlock);
      state.running = false;
    };
  }, [isActive, endGame]);

  return (
    <div className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className="h-full w-full" />
      <GameHud title="Stack" score={displayScore} accentColor={GAME_ACCENTS.stack.primary} subtitle="height" />
    </div>
  );
}
