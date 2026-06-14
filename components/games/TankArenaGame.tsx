"use client";

import { useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@/lib/games/types";
import { prepareCanvasFrame, useGameLifecycle } from "@/lib/games/hooks";
import { useSprites } from "@/lib/games/useSprites";
import { setGameInputLock } from "@/lib/games/inputLock";
import GameHud from "@/components/GameHud";

const SPRITES = {
  player: "/sprites/tanks-td/tank_blue.png",
  enemy: "/sprites/tanks-td/tank_red.png",
  enemyDark: "/sprites/tanks-td/tank_dark.png",
  bulletP: "/sprites/tanks-td/bulletBlue1.png",
  bulletE: "/sprites/tanks-td/bulletRed1.png",
  exp1: "/sprites/tanks-td/explosion1.png",
  exp2: "/sprites/tanks-td/explosion2.png",
  exp3: "/sprites/tanks-td/explosion3.png",
  exp4: "/sprites/tanks-td/explosion4.png",
  exp5: "/sprites/tanks-td/explosion5.png",
  crate: "/sprites/tanks-td/crateWood.png",
  sandbag: "/sprites/tanks-td/sandbagBeige.png",
  barrel: "/sprites/tanks-td/barrelRed_top.png",
};

interface Tank {
  x: number;
  y: number;
  angle: number;
  hp: number;
  fireCd: number;
  speed: number;
  dark?: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  enemy: boolean;
}

interface Explosion {
  x: number;
  y: number;
  frame: number;
  timer: number;
}

const MAX_MS = 45000;

export default function TankArenaGame({ isActive, onStart, onComplete }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });
  const sprites = useSprites(SPRITES);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  useEffect(() => {
    if (!isActive || !sprites) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = {
      running: true,
      start: performance.now(),
      player: { x: 0, y: 0, angle: 0, hp: 3, fireCd: 0, speed: 2.8 } as Tank,
      enemies: [] as Tank[],
      bullets: [] as Bullet[],
      explosions: [] as Explosion[],
      kills: 0,
      spawnTimer: 0,
      joyOrigin: null as { x: number; y: number } | null,
      joyVec: { x: 0, y: 0 },
      invulnUntil: 0,
      layoutW: 0,
      layoutH: 0,
      scale: 1,
    };

    queueMicrotask(() => {
      setScore(0);
      setLives(3);
    });

    const applyLayout = (w: number, h: number, scale: number) => {
      state.layoutW = w;
      state.layoutH = h;
      state.scale = scale;
      if (state.player.x === 0 && state.player.y === 0) {
        state.player.x = w / 2;
        state.player.y = h / 2;
      }
      state.player.speed = 2.8 * scale;
    };

    const spawnEnemy = (w: number, h: number, elapsed: number) => {
      const edge = Math.floor(Math.random() * 4);
      let x = w / 2;
      let y = h / 2;
      if (edge === 0) {
        x = Math.random() * w;
        y = -30;
      } else if (edge === 1) {
        x = w + 30;
        y = Math.random() * h;
      } else if (edge === 2) {
        x = Math.random() * w;
        y = h + 30;
      } else {
        x = -30;
        y = Math.random() * h;
      }
      state.enemies.push({
        x,
        y,
        angle: 0,
        hp: 1,
        fireCd: 0.2 + Math.random() * 0.4,
        speed: (2.0 + Math.random() * 1.2 + elapsed * 0.000015) * state.scale,
        dark: Math.random() < 0.35,
      });
      if (elapsed > 12000 && Math.random() < 0.35) {
        state.enemies.push({
          x: x + (Math.random() - 0.5) * 40,
          y: y + (Math.random() - 0.5) * 40,
          angle: 0,
          hp: 1,
          fireCd: 0.3,
          speed: (2.2 + Math.random()) * state.scale,
          dark: Math.random() < 0.5,
        });
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientY - rect.top < Math.round(48 * state.scale)) return;
      setGameInputLock(true);
      state.joyOrigin = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!state.joyOrigin) return;
      const rect = canvas.getBoundingClientRect();
      state.joyVec = {
        x: e.clientX - rect.left - state.joyOrigin.x,
        y: e.clientY - rect.top - state.joyOrigin.y,
      };
    };
    const endJoy = () => {
      setGameInputLock(false);
      state.joyOrigin = null;
      state.joyVec = { x: 0, y: 0 };
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endJoy);
    canvas.addEventListener("pointercancel", endJoy);

    let animId = 0;
    const loop = (now: number) => {
      if (!state.running) return;

      const frame = prepareCanvasFrame(canvas);
      if (!frame) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const { ctx, w, h, scale } = frame;

      if (w !== state.layoutW || h !== state.layoutH) {
        applyLayout(w, h, scale);
      }

      const elapsed = now - state.start;
      const tankR = Math.round(22 * scale);
      const bulletR = Math.round(6 * scale);
      const hitR = Math.round(24 * scale);

      const jLen = Math.hypot(state.joyVec.x, state.joyVec.y);
      if (jLen > 8) {
        const nx = state.joyVec.x / jLen;
        const ny = state.joyVec.y / jLen;
        state.player.x += nx * state.player.speed;
        state.player.y += ny * state.player.speed;
        state.player.angle = Math.atan2(ny, nx);
      }
      state.player.x = Math.max(tankR, Math.min(w - tankR, state.player.x));
      state.player.y = Math.max(Math.round(60 * scale), Math.min(h - tankR, state.player.y));

      state.player.fireCd -= 1 / 60;
      let nearest: Tank | null = null;
      let nearestDist = Infinity;
      for (const e of state.enemies) {
        const d = Math.hypot(e.x - state.player.x, e.y - state.player.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = e;
        }
      }
      if (nearest && state.player.fireCd <= 0) {
        const ang = Math.atan2(nearest.y - state.player.y, nearest.x - state.player.x);
        const bulletSpeed = 7 * scale;
        state.bullets.push({
          x: state.player.x,
          y: state.player.y,
          vx: Math.cos(ang) * bulletSpeed,
          vy: Math.sin(ang) * bulletSpeed,
          enemy: false,
        });
        state.player.fireCd = 0.5;
      }

      state.spawnTimer += 1 / 60;
      if (state.spawnTimer > Math.max(0.45, 1.1 - elapsed * 0.000025)) {
        state.spawnTimer = 0;
        spawnEnemy(w, h, elapsed);
      }

      for (const e of state.enemies) {
        const ang = Math.atan2(state.player.y - e.y, state.player.x - e.x);
        e.x += Math.cos(ang) * e.speed;
        e.y += Math.sin(ang) * e.speed;
        e.angle = ang;
        e.fireCd -= 1 / 60;
        if (e.fireCd <= 0) {
          state.bullets.push({
            x: e.x,
            y: e.y,
            vx: Math.cos(ang) * 6.5 * scale,
            vy: Math.sin(ang) * 6.5 * scale,
            enemy: true,
          });
          e.fireCd = 0.65 + Math.random() * 0.35;
        }
      }

      for (const b of state.bullets) {
        b.x += b.vx;
        b.y += b.vy;
      }
      state.bullets = state.bullets.filter(
        (b) => b.x > -20 && b.x < w + 20 && b.y > -20 && b.y < h + 20
      );

      for (const b of state.bullets) {
        if (!b.enemy) {
          for (const e of state.enemies) {
            if (Math.hypot(b.x - e.x, b.y - e.y) < hitR) {
              e.hp -= 1;
              b.x = -999;
              if (e.hp <= 0) {
                state.explosions.push({ x: e.x, y: e.y, frame: 0, timer: 0 });
                e.x = -999;
                state.kills += 1;
              }
            }
          }
        } else if (
          now >= state.invulnUntil &&
          Math.hypot(b.x - state.player.x, b.y - state.player.y) < hitR
        ) {
          b.x = -999;
          state.player.hp -= 1;
          state.invulnUntil = now + 900;
          queueMicrotask(() => setLives(state.player.hp));
          if (state.player.hp <= 0) {
            state.running = false;
            complete(state.kills * 100 + Math.floor(elapsed / 1000) * 10, true);
          }
        }
      }
      state.enemies = state.enemies.filter((e) => e.x > -50);
      state.bullets = state.bullets.filter((b) => b.x > -50);

      for (const ex of state.explosions) {
        ex.timer += 1 / 60;
        if (ex.timer > 0.06) {
          ex.timer = 0;
          ex.frame += 1;
        }
      }
      state.explosions = state.explosions.filter((ex) => ex.frame < 5);

      if (elapsed >= MAX_MS) {
        state.running = false;
        complete(state.kills * 100 + Math.floor(elapsed / 1000) * 10, true);
      }

      queueMicrotask(() => setScore(state.kills * 100 + Math.floor(elapsed / 1000) * 10));

      ctx.fillStyle = "#d9c08a";
      ctx.fillRect(0, 0, w, h);

      const decorSize = Math.round(32 * scale);
      for (let i = 0; i < 8; i++) {
        const img = i % 3 === 0 ? sprites.crate : i % 3 === 1 ? sprites.sandbag : sprites.barrel;
        ctx.drawImage(
          img,
          (i * 97 + 20) % Math.max(1, w - decorSize),
          (i * 53 + Math.round(100 * scale)) % Math.max(1, h - Math.round(120 * scale)),
          decorSize,
          decorSize
        );
      }

      const enemySize = Math.round(40 * scale);
      for (const e of state.enemies) {
        ctx.save();
        ctx.translate(e.x, e.y);
        ctx.rotate(e.angle + Math.PI / 2);
        ctx.drawImage(e.dark ? sprites.enemyDark : sprites.enemy, -enemySize / 2, -enemySize / 2, enemySize, enemySize);
        ctx.restore();
      }

      const bulletSize = bulletR * 2;
      for (const b of state.bullets) {
        ctx.drawImage(
          b.enemy ? sprites.bulletE : sprites.bulletP,
          b.x - bulletR,
          b.y - bulletR,
          bulletSize,
          bulletSize
        );
      }

      const playerSize = Math.round(44 * scale);
      if (now >= state.invulnUntil || Math.floor(now / 100) % 2 === 0) {
        ctx.save();
        ctx.translate(state.player.x, state.player.y);
        ctx.rotate(state.player.angle + Math.PI / 2);
        ctx.drawImage(sprites.player, -playerSize / 2, -playerSize / 2, playerSize, playerSize);
        ctx.restore();
      }

      const expSize = Math.round(48 * scale);
      const expFrames = [sprites.exp1, sprites.exp2, sprites.exp3, sprites.exp4, sprites.exp5];
      for (const ex of state.explosions) {
        ctx.drawImage(expFrames[ex.frame], ex.x - expSize / 2, ex.y - expSize / 2, expSize, expSize);
      }

      if (state.joyOrigin) {
        const joyR = Math.round(40 * scale);
        const knobR = Math.round(14 * scale);
        ctx.strokeStyle = "rgba(43,43,58,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(state.joyOrigin.x, state.joyOrigin.y, joyR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(
          state.joyOrigin.x + state.joyVec.x * 0.4,
          state.joyOrigin.y + state.joyVec.y * 0.4,
          knobR,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(43,43,58,0.5)";
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endJoy);
      canvas.removeEventListener("pointercancel", endJoy);
      setGameInputLock(false);
      state.running = false;
    };
  }, [isActive, sprites, complete]);

  if (!sprites) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#d9c08a] text-sm font-bold text-[#2b2b3a]">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <GameHud title="Tank Arena" score={score} accentColor="#3b82f6" subtitle={`${lives} lives`} />
    </div>
  );
}
