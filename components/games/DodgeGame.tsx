"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@/lib/games/types";
import { useCanvasSize, useGameLifecycle } from "@/lib/games/hooks";
import GameHud from "@/components/GameHud";
import {
  type Particle,
  type ScreenShake,
  GAME_ACCENTS,
  createBurst,
  createTrail,
  createShake,
  updateParticles,
  drawParticles,
  drawGlowCircle,
  drawShard,
  drawGrid,
  drawStarfield,
  generateStars,
  getShakeOffset,
} from "@/lib/games/effects";

interface Obstacle {
  x: number;
  y: number;
  size: number;
  speed: number;
  rotation: number;
  rotSpeed: number;
}

const PLAYER_SIZE = 32;
const MAX_DURATION_MS = 20000;

export default function DodgeGame(props: GameComponentProps) {
  const { isActive, onStart, onComplete } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });
  useCanvasSize(canvasRef);

  const stateRef = useRef({
    playerX: 0,
    prevPlayerX: 0,
    obstacles: [] as Obstacle[],
    particles: [] as Particle[],
    shake: null as ScreenShake | null,
    stars: [] as ReturnType<typeof generateStars>,
    gridOffset: 0,
    score: 0,
    lastSpawn: 0,
    startTime: 0,
    running: false,
    pointerDown: false,
    pointerX: 0,
    flashAlpha: 0,
    lastFrame: 0,
  });

  const [displayScore, setDisplayScore] = useState(0);

  const endGame = useCallback(
    (score: number, x: number, y: number) => {
      const state = stateRef.current;
      state.running = false;
      state.shake = createShake(12, 400);
      state.particles.push(...createBurst(x, y, 24, GAME_ACCENTS.dodge.secondary, 6));
      state.flashAlpha = 0.6;
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
    const h = canvas.clientHeight;
    state.playerX = w / 2;
    state.prevPlayerX = w / 2;
    state.obstacles = [];
    state.particles = [];
    state.shake = null;
    state.stars = generateStars(60, w, h);
    state.gridOffset = 0;
    state.score = 0;
    state.lastSpawn = 0;
    state.startTime = performance.now();
    state.lastFrame = state.startTime;
    state.running = true;
    state.flashAlpha = 0;
    queueMicrotask(() => setDisplayScore(0));

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      state.pointerX = e.clientX - rect.left;
      state.pointerDown = true;
    };
    const onPointerUp = () => { state.pointerDown = false; };

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    let animId: number;

    const loop = (now: number) => {
      if (!state.running && state.flashAlpha <= 0 && state.particles.length === 0) return;

      const dt = Math.min((now - state.lastFrame) / 1000, 0.05);
      state.lastFrame = now;
      const elapsed = now - state.startTime;
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      if (state.running) {
        if (state.pointerDown) {
          state.playerX += (state.pointerX - state.playerX) * 0.3;
        }
        state.playerX = Math.max(PLAYER_SIZE, Math.min(cw - PLAYER_SIZE, state.playerX));

        const spawnInterval = Math.max(350, 850 - elapsed * 0.025);
        if (now - state.lastSpawn > spawnInterval) {
          state.lastSpawn = now;
          const size = 18 + Math.random() * 14;
          state.obstacles.push({
            x: Math.random() * (cw - size * 2) + size,
            y: -size,
            size,
            speed: 3.5 + Math.random() * 2.5 + elapsed * 0.0004,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.08,
          });
        }

        for (const obs of state.obstacles) {
          obs.y += obs.speed;
          obs.rotation += obs.rotSpeed;
        }
        state.obstacles = state.obstacles.filter((o) => o.y < ch + 60);

        const px = state.playerX;
        const py = ch - 70;

        if (Math.abs(state.playerX - state.prevPlayerX) > 1) {
          state.particles.push(createTrail(px, py + 10, GAME_ACCENTS.dodge.primary));
        }
        state.prevPlayerX = state.playerX;

        for (const obs of state.obstacles) {
          const dx = px - obs.x;
          const dy = py - obs.y;
          if (Math.sqrt(dx * dx + dy * dy) < PLAYER_SIZE / 2 + obs.size / 2 - 3) {
            endGame(Math.floor(elapsed / 100), px, py);
            break;
          }
        }

        state.score = Math.floor(elapsed / 100);
        if (Math.floor(elapsed / 200) !== Math.floor((elapsed - dt * 1000) / 200)) {
          queueMicrotask(() => setDisplayScore(state.score));
        }

        if (elapsed >= MAX_DURATION_MS) {
          state.running = false;
          complete(state.score, true);
        }
      }

      state.gridOffset += dt * 30;
      state.particles = updateParticles(state.particles, dt);
      if (state.shake) {
        state.shake.elapsed += dt * 1000;
        if (state.shake.elapsed >= state.shake.duration) state.shake = null;
      }
      if (state.flashAlpha > 0) state.flashAlpha -= dt * 2;

      const shake = state.shake ? getShakeOffset(state.shake) : { x: 0, y: 0 };
      ctx.save();
      ctx.translate(shake.x, shake.y);

      ctx.fillStyle = "#06060a";
      ctx.fillRect(-10, -10, cw + 20, ch + 20);

      drawStarfield(ctx, cw, ch, state.stars, state.gridOffset * 0.3);
      drawGrid(ctx, cw, ch, state.gridOffset, "rgba(129,140,248,0.05)");

      for (const obs of state.obstacles) {
        drawShard(ctx, obs.x, obs.y, obs.size, obs.rotation, GAME_ACCENTS.dodge.secondary);
      }

      drawParticles(ctx, state.particles);

      const px = state.playerX;
      const py = ch - 70;
      drawGlowCircle(ctx, px, py, PLAYER_SIZE / 2, GAME_ACCENTS.dodge.primary, 18);

      ctx.restore();

      if (state.flashAlpha > 0) {
        ctx.fillStyle = `rgba(251,113,133,${state.flashAlpha})`;
        ctx.fillRect(0, 0, cw, ch);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      state.running = false;
    };
  }, [isActive, endGame, complete]);

  return (
    <div className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className="h-full w-full" />
      <GameHud title="Dodge" score={displayScore} accentColor={GAME_ACCENTS.dodge.primary} subtitle="survival" />
    </div>
  );
}
