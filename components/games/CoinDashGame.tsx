"use client";

import { useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@/lib/games/types";
import { prepareCanvasFrame, useGameLifecycle } from "@/lib/games/hooks";
import { useSprites } from "@/lib/games/useSprites";
import { playGameSound, unlockAudio } from "@/lib/games/audio";
import GameHud from "@/components/GameHud";

const SPRITES = {
  idle: "/sprites/platformer/character_green_idle.png",
  walkA: "/sprites/platformer/character_green_walk_a.png",
  walkB: "/sprites/platformer/character_green_walk_b.png",
  jump: "/sprites/platformer/character_green_jump.png",
  hit: "/sprites/platformer/character_green_hit.png",
  slimeA: "/sprites/platformer/slime_normal_walk_a.png",
  slimeB: "/sprites/platformer/slime_normal_walk_b.png",
  sawA: "/sprites/platformer/saw_a.png",
  sawB: "/sprites/platformer/saw_b.png",
  beeA: "/sprites/platformer/bee_a.png",
  beeB: "/sprites/platformer/bee_b.png",
  flyA: "/sprites/platformer/fly_a.png",
  flyB: "/sprites/platformer/fly_b.png",
  coin: "/sprites/platformer/coin_gold.png",
  gem: "/sprites/platformer/gem_blue.png",
  plank: "/sprites/platformer/block_planks.png",
  heart: "/sprites/platformer/hud_heart.png",
  heartEmpty: "/sprites/platformer/hud_heart_empty.png",
};

type ObstacleKind = "slime" | "saw" | "bee" | "fly";
type CollectKind = "coin" | "gem";

interface Obstacle {
  x: number;
  y: number;
  w: number;
  h: number;
  kind: ObstacleKind;
  air: boolean;
  frame: 0 | 1;
}

interface Collectible {
  x: number;
  y: number;
  kind: CollectKind;
}

const MAX_MS = 60000;

export default function CoinDashGame({ isActive, onStart, onComplete }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });
  const sprites = useSprites(SPRITES);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!isActive || !sprites) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = {
      running: true,
      start: performance.now(),
      speed: 3.2,
      distance: 0,
      hearts: 1,
      invulnUntil: 0,
      jumping: false,
      vy: 0,
      playerY: 0,
      groundY: 0,
      walkFrame: 0 as 0 | 1,
      walkTimer: 0,
      obstacles: [] as Obstacle[],
      collectibles: [] as Collectible[],
      spawnTimer: 0,
      score: 0,
      lastScoreUpdate: 0,
      layoutW: 0,
      layoutH: 0,
      scale: 1,
    };

    queueMicrotask(() => setScore(0));

    const applyLayout = (w: number, h: number, scale: number) => {
      state.layoutW = w;
      state.layoutH = h;
      state.scale = scale;
      state.groundY = Math.round(h * 0.78);
      state.playerY = state.groundY - Math.round(48 * scale);
    };

    const spawn = (w: number, scale: number) => {
      const air = Math.random() < 0.45;
      if (air) {
        const kind: ObstacleKind = Math.random() < 0.5 ? "bee" : "fly";
        state.obstacles.push({
          x: w + 40,
          y: state.groundY - Math.round(120 * scale),
          w: Math.round(40 * scale),
          h: Math.round(34 * scale),
          kind,
          air: true,
          frame: 0,
        });
      } else {
        const kind: ObstacleKind = Math.random() < 0.55 ? "slime" : "saw";
        const size = Math.round((kind === "slime" ? 42 : 36) * scale);
        state.obstacles.push({
          x: w + 40,
          y: state.groundY - size,
          w: size,
          h: size,
          kind,
          air: false,
          frame: 0,
        });
      }
      if (Math.random() < 0.65) {
        state.collectibles.push({
          x: w + 60,
          y: state.groundY - Math.round((air ? 130 : 70) * scale),
          kind: Math.random() < 0.75 ? "coin" : "gem",
        });
      }
    };

    const loseHeart = (now: number) => {
      if (now < state.invulnUntil) return;
      state.hearts -= 1;
      state.invulnUntil = now + 800;
      playGameSound("/sounds/sfx_hurt.ogg", 0.45);
      if (state.hearts <= 0) {
        state.running = false;
        complete(state.score, true);
      }
    };

    const onPointerDown = () => {
      unlockAudio();
      if (state.jumping) return;
      state.jumping = true;
      state.vy = -11 * state.scale;
      playGameSound("/sounds/sfx_jump.ogg", 0.4);
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
      const { ctx, w: cw, h: ch, scale } = frame;

      if (cw !== state.layoutW || ch !== state.layoutH) {
        applyLayout(cw, ch, scale);
      }

      const dt = 1 / 60;
      const elapsed = now - state.start;
      state.speed = (3.2 + elapsed * 0.00035) * scale;
      state.distance += state.speed;
      state.score = Math.floor(state.distance / 10);

      const playerH = Math.round(48 * scale);
      const playerW = Math.round(34 * scale);
      const playerX = Math.round(70 * scale);
      const jumpFloor = state.groundY - Math.round(48 * scale);

      if (state.jumping) {
        state.vy += 0.55 * scale;
        state.playerY += state.vy;
        if (state.playerY >= jumpFloor) {
          state.playerY = jumpFloor;
          state.jumping = false;
          state.vy = 0;
        }
      }

      state.walkTimer += dt;
      if (state.walkTimer > 0.12) {
        state.walkTimer = 0;
        state.walkFrame = state.walkFrame === 0 ? 1 : 0;
      }

      state.spawnTimer += dt;
      if (state.spawnTimer > Math.max(0.55, 1.3 - elapsed * 0.00001)) {
        state.spawnTimer = 0;
        spawn(cw, scale);
      }

      for (const o of state.obstacles) {
        o.x -= state.speed;
        o.frame = o.frame === 0 ? 1 : 0;
      }
      for (const c of state.collectibles) c.x -= state.speed;
      state.obstacles = state.obstacles.filter((o) => o.x > -80);
      state.collectibles = state.collectibles.filter((c) => c.x > -40);

      const py = state.playerY;
      const pickupR = Math.round(22 * scale);

      const playerCx = playerX + playerW / 2;
      const playerCy = py + playerH / 2;
      const playerR = Math.round(10 * scale);

      for (const c of state.collectibles) {
        if (Math.hypot(playerCx - c.x, playerCy - c.y) < pickupR) {
          state.score += c.kind === "coin" ? 10 : 50;
          c.x = -999;
          playGameSound("/sounds/sfx_coin.ogg", 0.35);
        }
      }
      state.collectibles = state.collectibles.filter((c) => c.x > -40);

      const obstacleRadius = (o: Obstacle) => {
        if (o.kind === "slime") return Math.round(13 * scale);
        if (o.kind === "saw") return Math.round(11 * scale);
        return Math.round(10 * scale);
      };

      for (const o of state.obstacles) {
        const ocx = o.x + o.w / 2;
        const ocy = o.y + o.h / 2;
        const hitDist = playerR + obstacleRadius(o);
        if (Math.hypot(playerCx - ocx, playerCy - ocy) >= hitDist) continue;
        if (o.air) {
          if (!state.jumping || state.playerY > jumpFloor - Math.round(15 * scale)) {
            loseHeart(now);
          }
        } else if (!state.jumping || state.playerY > state.groundY - Math.round(70 * scale)) {
          loseHeart(now);
        }
      }

      if (elapsed >= MAX_MS) {
        state.running = false;
        complete(state.score, true);
      }

      if (Math.floor(state.score / 5) !== state.lastScoreUpdate) {
        state.lastScoreUpdate = Math.floor(state.score / 5);
        queueMicrotask(() => setScore(state.score));
      }

      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(0, 0, cw, state.groundY);
      ctx.fillStyle = "#8fd694";
      ctx.fillRect(0, state.groundY, cw, ch - state.groundY);

      const tileW = Math.round(64 * scale);
      const tileH = Math.round(48 * scale);
      for (let x = -(state.distance % tileW); x < cw; x += tileW) {
        ctx.drawImage(sprites.plank, x, state.groundY, tileW, tileH);
      }

      const itemSize = Math.round(32 * scale);
      for (const c of state.collectibles) {
        ctx.drawImage(sprites[c.kind], c.x - itemSize / 2, c.y - itemSize / 2, itemSize, itemSize);
      }

      for (const o of state.obstacles) {
        let img = sprites.slimeA;
        if (o.kind === "slime") img = o.frame ? sprites.slimeB : sprites.slimeA;
        if (o.kind === "saw") img = o.frame ? sprites.sawB : sprites.sawA;
        if (o.kind === "bee") img = o.frame ? sprites.beeB : sprites.beeA;
        if (o.kind === "fly") img = o.frame ? sprites.flyB : sprites.flyA;
        ctx.drawImage(img, o.x, o.y, o.w, o.h);
      }

      let playerImg = state.walkFrame ? sprites.walkB : sprites.walkA;
      if (state.jumping) playerImg = sprites.jump;
      if (now < state.invulnUntil && Math.floor(now / 100) % 2 === 0) playerImg = sprites.hit;
      ctx.drawImage(playerImg, playerX, py, playerW, playerH);

      const heartSize = Math.round(22 * scale);
      ctx.drawImage(
        state.hearts > 0 ? sprites.heart : sprites.heartEmpty,
        Math.round(12 * scale),
        Math.round(148 * scale),
        heartSize,
        heartSize
      );

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
      <div className="flex h-full w-full items-center justify-center bg-[#87ceeb] text-sm font-bold text-[#2b2b3a]">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <GameHud title="Coin Dash" score={score} accentColor="#4ade80" subtitle="1 life" />
    </div>
  );
}
