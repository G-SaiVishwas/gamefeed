"use client";

import { useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@/lib/games/types";
import { prepareCanvasFrame, useGameLifecycle } from "@/lib/games/hooks";
import { useSprites } from "@/lib/games/useSprites";
import { createBurst, drawParticles, updateParticles, type Particle } from "@/lib/games/effects";
import GameHud from "@/components/GameHud";

const SPRITES = {
  hero: "/sprites/dungeon/green_character.png",
  red: "/sprites/dungeon/red_character.png",
  purple: "/sprites/dungeon/purple_character.png",
  dragon: "/sprites/dungeon/dragon.png",
  sword: "/sprites/dungeon/weapon_sword.png",
  tile: "/sprites/dungeon/tile.png",
  path: "/sprites/dungeon/floor_path.png",
  wall: "/sprites/dungeon/wall.png",
  campfire: "/sprites/dungeon/campfire.png",
  chest: "/sprites/dungeon/chest.png",
};

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  kind: "red" | "purple" | "dragon";
  id: number;
}

const MAX_MS = 45000;

export default function DungeonStrikeGame({ isActive, onStart, onComplete }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });
  const sprites = useSprites(SPRITES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  useEffect(() => {
    if (!isActive || !sprites) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = {
      running: true,
      start: performance.now(),
      hearts: 3,
      combo: 1,
      kills: 0,
      score: 0,
      enemies: [] as Enemy[],
      particles: [] as Particle[],
      spawnTimer: 0,
      nextId: 1,
      swingTimer: 0,
      swingAngle: 0,
      layoutW: 0,
      layoutH: 0,
      scale: 1,
    };

    queueMicrotask(() => {
      setScore(0);
      setCombo(0);
    });

    const spawn = (w: number, h: number, scale: number, elapsed: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const edge = Math.floor(Math.random() * 4);
      let x = cx;
      let y = cy;
      const margin = Math.round(40 * scale);
      if (edge === 0) {
        x = Math.random() * w;
        y = margin;
      } else if (edge === 1) {
        x = w - margin;
        y = Math.random() * h;
      } else if (edge === 2) {
        x = Math.random() * w;
        y = h - margin;
      } else {
        x = margin;
        y = Math.random() * h;
      }
      const isDragon = state.kills > 0 && state.kills % 8 === 0 && Math.random() < 0.5;
      const speed = (1.1 + Math.random() * 0.8 + state.kills * 0.025 + elapsed * 0.00002) * scale;
      const ang = Math.atan2(cy - y, cx - x);
      state.enemies.push({
        id: state.nextId++,
        x,
        y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        hp: isDragon ? 3 : 1,
        kind: isDragon ? "dragon" : Math.random() < 0.5 ? "red" : "purple",
      });
      if (state.kills >= 3 && Math.random() < 0.4) {
        const ang2 = ang + (Math.random() - 0.5) * 0.6;
        state.enemies.push({
          id: state.nextId++,
          x: x + (Math.random() - 0.5) * 30,
          y: y + (Math.random() - 0.5) * 30,
          vx: Math.cos(ang2) * speed * 0.9,
          vy: Math.sin(ang2) * speed * 0.9,
          hp: 1,
          kind: Math.random() < 0.5 ? "red" : "purple",
        });
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const tx = e.clientX - rect.left;
      const ty = e.clientY - rect.top;
      const tapR = Math.round(44 * state.scale);
      let hit: Enemy | null = null;
      let best = 9999;
      for (const en of state.enemies) {
        const d = Math.hypot(en.x - tx, en.y - ty);
        if (d < tapR && d < best) {
          best = d;
          hit = en;
        }
      }
      if (!hit) return;
      hit.hp -= 1;
      state.swingTimer = 0.15;
      state.swingAngle = Math.atan2(
        hit.y - state.layoutH / 2,
        hit.x - state.layoutW / 2
      );
      state.particles.push(...createBurst(hit.x, hit.y, 10, "#f472b6", 3));
      if (hit.hp <= 0) {
        state.enemies = state.enemies.filter((en) => en.id !== hit!.id);
        state.kills += 1;
        state.combo += 1;
        state.score += 100 * state.combo;
        queueMicrotask(() => {
          setScore(state.score);
          setCombo(state.combo);
        });
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);

    let animId = 0;
    const loop = (now: number) => {
      if (!state.running) return;

      const frame = prepareCanvasFrame(canvas);
      if (!frame) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const { ctx, w, h, scale } = frame;
      state.layoutW = w;
      state.layoutH = h;
      state.scale = scale;

      const elapsed = now - state.start;
      const cx = w / 2;
      const cy = h / 2;
      const heroR = Math.round(28 * scale);

      state.spawnTimer += 1 / 60;
      if (state.spawnTimer > Math.max(0.45, 1.0 - elapsed * 0.00002)) {
        state.spawnTimer = 0;
        spawn(w, h, scale, elapsed);
      }

      for (const en of state.enemies) {
        en.x += en.vx;
        en.y += en.vy;
        if (Math.hypot(en.x - cx, en.y - cy) < heroR + Math.round(4 * scale)) {
          state.hearts -= 1;
          state.combo = 1;
          state.enemies = state.enemies.filter((e) => e.id !== en.id);
          queueMicrotask(() => setCombo(1));
          if (state.hearts <= 0) {
            state.running = false;
            complete(state.score, true);
          }
        }
      }

      if (state.swingTimer > 0) state.swingTimer -= 1 / 60;
      state.particles = updateParticles(state.particles, 1 / 60);

      if (elapsed >= MAX_MS) {
        state.running = false;
        complete(state.score, true);
      }

      ctx.fillStyle = "#f4ecd8";
      ctx.fillRect(0, 0, w, h);

      const tileSize = Math.round(48 * scale);
      for (let x = 0; x < w; x += tileSize) {
        for (let y = 0; y < h; y += tileSize) {
          ctx.drawImage(sprites.tile, x, y, tileSize, tileSize);
        }
      }

      const corridorW = Math.round(72 * scale);
      ctx.fillStyle = "#e8dcc8";
      ctx.fillRect(cx - corridorW / 2, 0, corridorW, h);
      ctx.fillRect(0, cy - corridorW / 2, w, corridorW);
      for (let y = 0; y < h; y += tileSize) {
        for (let x = cx - corridorW / 2; x < cx + corridorW / 2; x += tileSize) {
          ctx.drawImage(sprites.path, x, y, tileSize, tileSize);
        }
      }
      for (let x = 0; x < w; x += tileSize) {
        for (let y = cy - corridorW / 2; y < cy + corridorW / 2; y += tileSize) {
          ctx.drawImage(sprites.path, x, y, tileSize, tileSize);
        }
      }

      const wallH = Math.round(20 * scale);
      for (let x = 0; x < w; x += tileSize) {
        ctx.drawImage(sprites.wall, x, 0, tileSize, wallH);
        ctx.drawImage(sprites.wall, x, h - wallH, tileSize, wallH);
      }

      const decorSize = Math.round(44 * scale);
      ctx.drawImage(sprites.campfire, w - decorSize - Math.round(16 * scale), h - decorSize - Math.round(60 * scale), decorSize, decorSize);
      ctx.drawImage(sprites.chest, Math.round(16 * scale), h - decorSize - Math.round(60 * scale), decorSize, decorSize);

      for (const en of state.enemies) {
        const img =
          en.kind === "dragon" ? sprites.dragon : en.kind === "red" ? sprites.red : sprites.purple;
        const size = Math.round((en.kind === "dragon" ? 52 : 38) * scale);
        ctx.drawImage(img, en.x - size / 2, en.y - size / 2, size, size);
      }

      const heroSize = Math.round(56 * scale);
      ctx.drawImage(sprites.hero, cx - heroSize / 2, cy - heroSize / 2, heroSize, heroSize);

      if (state.swingTimer > 0) {
        const swordSize = Math.round(40 * scale);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(state.swingAngle);
        ctx.drawImage(sprites.sword, Math.round(10 * scale), -swordSize / 2, swordSize, swordSize);
        ctx.restore();
      }

      drawParticles(ctx, state.particles);

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      state.running = false;
    };
  }, [isActive, sprites, complete]);

  if (!sprites) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#f4ecd8] text-sm font-bold text-[#2b2b3a]">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <GameHud title="Dungeon Strike" score={score} accentColor="#a855f7" combo={combo > 1 ? combo : undefined} />
    </div>
  );
}
