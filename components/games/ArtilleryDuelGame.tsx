"use client";

import { useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@/lib/games/types";
import { prepareCanvasFrame, useGameLifecycle } from "@/lib/games/hooks";
import { useSprites } from "@/lib/games/useSprites";
import { setGameInputLock } from "@/lib/games/inputLock";
import GameHud from "@/components/GameHud";

const SPRITES = {
  player: "/sprites/artillery/tanks_tankGreen1.png",
  enemy: "/sprites/artillery/tanks_tankDesert1.png",
  fly1: "/sprites/artillery/tank_bulletFly1.png",
  fly2: "/sprites/artillery/tank_bulletFly2.png",
  fly3: "/sprites/artillery/tank_bulletFly3.png",
  arrowEmpty: "/sprites/artillery/tank_arrowEmpty.png",
  arrowFull: "/sprites/artillery/tank_arrowFull.png",
  mine: "/sprites/artillery/tanks_mineOn.png",
  exp1: "/sprites/artillery/tank_explosion1.png",
  exp2: "/sprites/artillery/tank_explosion2.png",
  exp3: "/sprites/artillery/tank_explosion3.png",
  exp4: "/sprites/artillery/tank_explosion4.png",
};

interface Shell {
  x: number;
  y: number;
  vx: number;
  vy: number;
  enemy: boolean;
  frame: number;
}

interface Explosion {
  x: number;
  y: number;
  frame: number;
  timer: number;
}

interface AimVector {
  vx: number;
  vy: number;
  powerNorm: number;
}

const MAX_MS = 60000;

function simulateTrajectory(
  startX: number,
  startY: number,
  vx: number,
  vy: number,
  gravity: number,
  wind: number,
  steps = 120
) {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  let x = startX;
  let y = startY;
  let cvx = vx;
  let cvy = vy;
  for (let i = 0; i < steps; i++) {
    cvy += gravity;
    cvx += wind * 0.01;
    x += cvx;
    y += cvy;
    points.push({ x, y });
    if (y > 2000) break;
  }
  return { points, endX: x, endY: y };
}

/** Find velocities that land closest to the aim point (tap/drag target). */
function solveBallisticShot(
  startX: number,
  startY: number,
  targetX: number,
  targetY: number,
  scale: number,
  gravity: number,
  wind: number
): AimVector | null {
  let best: AimVector | null = null;
  let bestDist = Infinity;

  for (let ang = -Math.PI * 0.92; ang <= -Math.PI * 0.04; ang += 0.03) {
    for (let power = 7; power <= 32; power += 0.75) {
      const vx = Math.cos(ang) * power * scale;
      const vy = Math.sin(ang) * power * scale;
      const { endX, endY } = simulateTrajectory(startX, startY, vx, vy, gravity, wind, 100);
      const d = Math.hypot(endX - targetX, endY - targetY);
      if (d < bestDist) {
        bestDist = d;
        best = { vx, vy, powerNorm: Math.min(1, power / 28) };
      }
    }
  }

  return best;
}

export default function ArtilleryDuelGame({ isActive, onStart, onComplete }: GameComponentProps) {
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
      playerX: 0,
      playerY: 0,
      enemyX: 0,
      enemyY: 0,
      platY: 0,
      gapLeft: 0,
      gapRight: 0,
      muzzleX: 0,
      muzzleY: 0,
      enemyHp: 2,
      round: 1,
      lives: 3,
      score: 0,
      dragging: false,
      dragCurrent: null as { x: number; y: number } | null,
      previewAim: null as AimVector | null,
      shells: [] as Shell[],
      explosions: [] as Explosion[],
      wind: (Math.random() - 0.5) * 0.04,
      waitingEnemyShot: false,
      enemyShotTimer: 0,
      layoutW: 0,
      layoutH: 0,
      scale: 1,
    };

    const applyLayout = (w: number, h: number, scale: number) => {
      state.layoutW = w;
      state.layoutH = h;
      state.scale = scale;
      const tankSize = Math.round(50 * scale);
      const platH = Math.round(52 * scale);
      state.platY = h - platH;
      const tankY = state.platY - tankSize / 2 + Math.round(4 * scale);
      state.playerX = Math.round(w * 0.13);
      state.playerY = tankY;
      state.enemyX = w - Math.round(w * 0.13);
      state.enemyY = tankY;
      state.gapLeft = w * 0.4;
      state.gapRight = w * 0.6;
      state.muzzleX = state.playerX + Math.round(22 * scale);
      state.muzzleY = state.playerY - Math.round(16 * scale);
    };

    queueMicrotask(() => {
      setScore(0);
      setLives(3);
    });

    const gravity = () => 0.15 * state.scale;

    const fireShell = (x: number, y: number, vx: number, vy: number, enemy: boolean) => {
      state.shells.push({ x, y, vx, vy, enemy, frame: 0 });
    };

    const enemyReturnFire = () => {
      const aim = solveBallisticShot(
        state.enemyX - Math.round(18 * state.scale),
        state.enemyY - Math.round(12 * state.scale),
        state.playerX,
        state.playerY,
        state.scale,
        gravity(),
        state.wind
      );
      if (!aim) return;
      fireShell(
        state.enemyX - Math.round(18 * state.scale),
        state.enemyY - Math.round(12 * state.scale),
        aim.vx + state.wind * state.scale * 0.5,
        aim.vy,
        true
      );
    };

    const pointerPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const updatePreview = () => {
      if (!state.dragCurrent) {
        state.previewAim = null;
        return;
      }
      state.previewAim = solveBallisticShot(
        state.muzzleX,
        state.muzzleY,
        state.dragCurrent.x,
        state.dragCurrent.y,
        state.scale,
        gravity(),
        state.wind
      );
    };

    const onPointerDown = (e: PointerEvent) => {
      if (state.waitingEnemyShot) return;
      const { x, y } = pointerPos(e);
      if (y < Math.round(100 * state.scale)) return;
      e.preventDefault();
      setGameInputLock(true);
      state.dragging = true;
      state.dragCurrent = { x, y };
      updatePreview();
      canvas.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!state.dragging) return;
      state.dragCurrent = pointerPos(e);
      updatePreview();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!state.dragging) return;
      const aim = state.previewAim;
      if (aim && !state.waitingEnemyShot) {
        fireShell(state.muzzleX, state.muzzleY, aim.vx, aim.vy, false);
        state.waitingEnemyShot = true;
        state.enemyShotTimer = 1.2;
      }
      state.dragging = false;
      state.dragCurrent = null;
      state.previewAim = null;
      setGameInputLock(false);
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    let animId = 0;
    const loop = (now: number) => {
      if (!state.running) return;

      const frame = prepareCanvasFrame(canvas);
      if (!frame) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const { ctx, w, h, scale } = frame;

      if (w !== state.layoutW || h !== state.layoutH || state.playerX === 0) {
        applyLayout(w, h, scale);
      }

      const elapsed = now - state.start;
      const hitR = Math.round(36 * scale);
      const tankSize = Math.round(50 * scale);
      const g = gravity();

      if (state.waitingEnemyShot) {
        state.enemyShotTimer -= 1 / 60;
        if (state.enemyShotTimer <= 0) {
          enemyReturnFire();
          state.waitingEnemyShot = false;
        }
      }

      for (const s of state.shells) {
        s.vy += g;
        s.vx += state.wind * 0.01;
        s.x += s.vx;
        s.y += s.vy;
        s.frame = (s.frame + 1) % 3;

        if (
          !s.enemy &&
          s.x > state.gapLeft &&
          s.x < state.gapRight &&
          s.y > state.platY - Math.round(8 * scale)
        ) {
          state.explosions.push({ x: s.x, y: state.platY, frame: 0, timer: 0 });
          s.x = -9999;
        }
      }
      state.shells = state.shells.filter(
        (s) => s.x > -9990 && s.y < h + 80 && s.x > -80 && s.x < w + 80 && s.y > -300
      );

      for (const s of [...state.shells]) {
        const targetX = s.enemy ? state.playerX : state.enemyX;
        const targetY = s.enemy ? state.playerY : state.enemyY;
        if (Math.hypot(s.x - targetX, s.y - targetY) < hitR) {
          s.x = -9999;
          if (!s.enemy) {
            state.enemyHp -= 1;
            state.explosions.push({ x: state.enemyX, y: state.enemyY, frame: 0, timer: 0 });
            if (state.enemyHp <= 0) {
              state.score += 100 * state.round;
              state.round += 1;
              state.enemyHp = 2 + Math.floor(state.round / 2);
              state.enemyX = Math.max(w - Math.round(w * 0.18), state.enemyX - Math.round(12 * scale));
              state.wind = (Math.random() - 0.5) * 0.06;
            }
          } else {
            state.lives -= 1;
            state.explosions.push({ x: state.playerX, y: state.playerY, frame: 0, timer: 0 });
            queueMicrotask(() => setLives(state.lives));
            if (state.lives <= 0) {
              state.running = false;
              complete(state.score, true);
            }
          }
        }
      }
      state.shells = state.shells.filter((s) => s.x > -9990);

      for (const ex of state.explosions) {
        ex.timer += 1 / 60;
        if (ex.timer > 0.08) {
          ex.timer = 0;
          ex.frame += 1;
        }
      }
      state.explosions = state.explosions.filter((ex) => ex.frame < 4);

      if (elapsed >= MAX_MS) {
        state.running = false;
        complete(state.score, true);
      }

      queueMicrotask(() => setScore(state.score));

      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "#bfe9ff");
      grad.addColorStop(1, "#fdf6e3");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const platH = Math.round(52 * scale);
      ctx.fillStyle = "#8b7355";
      ctx.fillRect(0, state.platY, state.gapLeft, platH);
      ctx.fillRect(state.gapRight, state.platY, w - state.gapRight, platH);
      ctx.fillStyle = "#2b2b3a";
      ctx.fillRect(state.gapLeft, state.platY - Math.round(16 * scale), state.gapRight - state.gapLeft, platH + Math.round(16 * scale));

      const mineSize = Math.round(20 * scale);
      ctx.drawImage(
        sprites.mine,
        (state.gapLeft + state.gapRight) / 2 - mineSize / 2,
        state.platY - mineSize - Math.round(2 * scale),
        mineSize,
        mineSize
      );
      ctx.drawImage(sprites.player, state.playerX - tankSize / 2, state.playerY - tankSize / 2, tankSize, tankSize);
      ctx.drawImage(sprites.enemy, state.enemyX - tankSize / 2, state.enemyY - tankSize / 2, tankSize, tankSize);

      if (state.enemyX > state.playerX + Math.round(40 * scale)) {
        ctx.strokeStyle = "rgba(234,179,8,0.25)";
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(state.muzzleX, state.muzzleY);
        ctx.lineTo(state.enemyX, state.enemyY - Math.round(10 * scale));
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const shellSize = Math.round(18 * scale);
      const flyFrames = [sprites.fly1, sprites.fly2, sprites.fly3];
      for (const s of state.shells) {
        ctx.drawImage(flyFrames[s.frame], s.x - shellSize / 2, s.y - shellSize / 2, shellSize, shellSize);
      }

      const expSize = Math.round(52 * scale);
      const expFrames = [sprites.exp1, sprites.exp2, sprites.exp3, sprites.exp4];
      for (const ex of state.explosions) {
        ctx.drawImage(expFrames[ex.frame], ex.x - expSize / 2, ex.y - expSize / 2, expSize, expSize);
      }

      if (state.dragging && state.dragCurrent) {
        ctx.strokeStyle = "rgba(43,43,58,0.35)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(state.muzzleX, state.muzzleY);
        ctx.lineTo(state.dragCurrent.x, state.dragCurrent.y);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(234,179,8,0.85)";
        ctx.beginPath();
        ctx.arc(state.dragCurrent.x, state.dragCurrent.y, Math.round(10 * scale), 0, Math.PI * 2);
        ctx.fill();

        if (state.previewAim) {
          const traj = simulateTrajectory(
            state.muzzleX,
            state.muzzleY,
            state.previewAim.vx,
            state.previewAim.vy,
            g,
            state.wind,
            80
          );
          ctx.strokeStyle = "rgba(234,179,8,0.85)";
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(traj.points[0].x, traj.points[0].y);
          for (let i = 1; i < traj.points.length; i++) {
            ctx.lineTo(traj.points[i].x, traj.points[i].y);
          }
          ctx.stroke();

          const arrowW = Math.round(68 * scale);
          const arrowH = Math.round(16 * scale);
          const arrowY = state.playerY - Math.round(58 * scale);
          ctx.drawImage(sprites.arrowEmpty, state.playerX - arrowW / 2, arrowY, arrowW, arrowH);
          ctx.drawImage(
            sprites.arrowFull,
            state.playerX - arrowW / 2,
            arrowY,
            arrowW * state.previewAim.powerNorm,
            arrowH
          );
        }
      } else if (!state.dragging && state.shells.length === 0 && elapsed < 12000) {
        ctx.fillStyle = "rgba(43,43,58,0.55)";
        ctx.font = `bold ${Math.round(13 * scale)}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("Tap the sky where you want to land the shell", w / 2, Math.round(175 * scale));
        ctx.font = `${Math.round(11 * scale)}px sans-serif`;
        ctx.fillText("Yellow arc = predicted path · release to fire", w / 2, Math.round(195 * scale));
        ctx.textAlign = "left";
      }

      ctx.fillStyle = "#2b2b3a";
      ctx.font = `${Math.round(11 * scale)}px sans-serif`;
      ctx.fillText(
        `Wind ${state.wind > 0 ? "→" : "←"}${Math.abs(state.wind * 100).toFixed(0)} · Round ${state.round}`,
        Math.round(12 * scale),
        h - Math.round(10 * scale)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      setGameInputLock(false);
      state.running = false;
    };
  }, [isActive, sprites, complete]);

  if (!sprites) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#bfe9ff] text-sm font-bold text-[#2b2b3a]">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className="block h-full w-full" />
      <GameHud title="Artillery Duel" score={score} accentColor="#eab308" subtitle={`${lives} lives`} />
    </div>
  );
}
