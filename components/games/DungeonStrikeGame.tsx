"use client";

import { useEffect, useRef, useState } from "react";
import type { GameComponentProps } from "@/lib/games/types";
import { prepareCanvasFrame, useGameLifecycle } from "@/lib/games/hooks";
import { useSprites } from "@/lib/games/useSprites";
import { createBurst, drawParticles, updateParticles, type Particle } from "@/lib/games/effects";
import {
  angleDiff,
  createProceduralWeapon,
  tintSprite,
} from "@/lib/games/dungeonHelpers";
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

type EnemyKind = "red" | "purple" | "blue" | "yellow" | "orange" | "dragon";
type WeaponId = "sword" | "axe" | "spear" | "hammer";

interface Enemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  kind: EnemyKind;
  id: number;
}

interface WeaponDef {
  id: WeaponId;
  name: string;
  arc: number;
  range: number;
  damage: number;
  cooldown: number;
  particle: string;
  unlockKills: number;
}

const WEAPONS: WeaponDef[] = [
  { id: "sword", name: "Sword", arc: Math.PI * 0.55, range: 118, damage: 1, cooldown: 0.18, particle: "#f472b6", unlockKills: 0 },
  { id: "axe", name: "Axe", arc: Math.PI * 0.78, range: 102, damage: 1, cooldown: 0.26, particle: "#fb923c", unlockKills: 5 },
  { id: "spear", name: "Spear", arc: Math.PI * 0.32, range: 158, damage: 2, cooldown: 0.3, particle: "#67e8f9", unlockKills: 12 },
  { id: "hammer", name: "Hammer", arc: Math.PI * 0.48, range: 96, damage: 2, cooldown: 0.36, particle: "#facc15", unlockKills: 20 },
];

const ENEMY_DEFS: Record<
  EnemyKind,
  { speed: number; hp: number; size: number; score: number; burst: string; weight: number }
> = {
  red: { speed: 1.25, hp: 1, size: 36, score: 100, burst: "#ef4444", weight: 28 },
  purple: { speed: 1.05, hp: 1, size: 38, score: 120, burst: "#a855f7", weight: 24 },
  blue: { speed: 0.78, hp: 2, size: 42, score: 160, burst: "#3b82f6", weight: 16 },
  yellow: { speed: 1.55, hp: 1, size: 32, score: 130, burst: "#eab308", weight: 18 },
  orange: { speed: 1.12, hp: 1, size: 36, score: 110, burst: "#f97316", weight: 20 },
  dragon: { speed: 0.88, hp: 3, size: 52, score: 320, burst: "#dc2626", weight: 0 },
};

const MAX_MS = 45000;
const COMBO_WINDOW_MS = 520;

function pickEnemyKind(kills: number, elapsed: number): EnemyKind {
  if (kills > 0 && kills % 10 === 0 && Math.random() < 0.45) return "dragon";
  const pool: EnemyKind[] = ["red", "purple"];
  if (kills >= 2 || elapsed > 4000) pool.push("orange");
  if (kills >= 4 || elapsed > 8000) pool.push("yellow");
  if (kills >= 6 || elapsed > 12000) pool.push("blue");

  let total = 0;
  const weights = pool.map((k) => {
    total += ENEMY_DEFS[k].weight;
    return ENEMY_DEFS[k].weight;
  });
  let roll = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return pool[i];
  }
  return pool[0];
}

export default function DungeonStrikeGame({ isActive, onStart, onComplete }: GameComponentProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { complete } = useGameLifecycle({ isActive, onStart, onComplete });
  const sprites = useSprites(SPRITES);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [weaponLabel, setWeaponLabel] = useState("Sword");

  useEffect(() => {
    if (!isActive || !sprites) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const enemySprites: Partial<Record<EnemyKind, CanvasImageSource>> = {
      red: sprites.red,
      purple: sprites.purple,
      dragon: sprites.dragon,
      blue: tintSprite(sprites.red, "#5b9cf5"),
      yellow: tintSprite(sprites.purple, "#f5d547"),
      orange: tintSprite(sprites.red, "#f5924a"),
    };

    const weaponSprites: Record<WeaponId, CanvasImageSource> = {
      sword: sprites.sword,
      axe: createProceduralWeapon("axe"),
      spear: createProceduralWeapon("spear"),
      hammer: createProceduralWeapon("hammer"),
    };

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
      swingArc: Math.PI * 0.55,
      swingRange: 118,
      cooldown: 0,
      lastSlashAt: 0,
      weaponIdx: 0,
      unlockedWeapons: 1,
      layoutW: 0,
      layoutH: 0,
      scale: 1,
    };

    queueMicrotask(() => {
      setScore(0);
      setCombo(0);
      setWeaponLabel("Sword");
    });

    const currentWeapon = () => WEAPONS[state.weaponIdx];

    const unlockWeapons = () => {
      let changed = false;
      while (
        state.unlockedWeapons < WEAPONS.length &&
        state.kills >= WEAPONS[state.unlockedWeapons].unlockKills
      ) {
        state.unlockedWeapons += 1;
        state.weaponIdx = state.unlockedWeapons - 1;
        changed = true;
      }
      if (changed) {
        const w = currentWeapon();
        queueMicrotask(() => setWeaponLabel(w.name));
      }
    };

    const spawnOne = (
      w: number,
      h: number,
      scale: number,
      elapsed: number,
      originX: number,
      originY: number,
      kind?: EnemyKind
    ) => {
      const cx = w / 2;
      const cy = h / 2;
      const k = kind ?? pickEnemyKind(state.kills, elapsed);
      const def = ENEMY_DEFS[k];
      const speed =
        (def.speed + Math.random() * 0.35 + state.kills * 0.018 + elapsed * 0.000015) * scale;
      const ang = Math.atan2(cy - originY, cx - originX);
      state.enemies.push({
        id: state.nextId++,
        x: originX + (Math.random() - 0.5) * 36 * scale,
        y: originY + (Math.random() - 0.5) * 36 * scale,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        hp: def.hp,
        maxHp: def.hp,
        kind: k,
      });
    };

    const spawnSwarm = (w: number, h: number, scale: number, elapsed: number) => {
      const cx = w / 2;
      const cy = h / 2;
      const margin = Math.round(36 * scale);
      const edge = Math.floor(Math.random() * 4);
      let ox = cx;
      let oy = cy;
      if (edge === 0) {
        ox = Math.random() * w;
        oy = margin;
      } else if (edge === 1) {
        ox = w - margin;
        oy = Math.random() * h;
      } else if (edge === 2) {
        ox = Math.random() * w;
        oy = h - margin;
      } else {
        ox = margin;
        oy = Math.random() * h;
      }

      const baseCount = 2 + Math.floor(elapsed / 12000);
      const count = Math.min(8, baseCount + Math.floor(Math.random() * 3));
      const kinds: EnemyKind[] = [];
      for (let i = 0; i < count; i++) kinds.push(pickEnemyKind(state.kills, elapsed));
      if (count >= 4 && Math.random() < 0.35) {
        kinds[Math.floor(Math.random() * count)] = "dragon";
      }
      for (const kind of kinds) spawnOne(w, h, scale, elapsed, ox, oy, kind);
    };

    const performSlash = (angle: number) => {
      const weapon = currentWeapon();
      if (state.cooldown > 0) return;

      const cx = state.layoutW / 2;
      const cy = state.layoutH / 2;
      const range = weapon.range * state.scale;
      const halfArc = weapon.arc / 2;
      const now = performance.now();

      state.swingTimer = 0.22;
      state.swingAngle = angle;
      state.swingArc = weapon.arc;
      state.swingRange = weapon.range;
      state.cooldown = weapon.cooldown;

      if (now - state.lastSlashAt < COMBO_WINDOW_MS) {
        state.combo += 1;
      } else {
        state.combo = 1;
      }
      state.lastSlashAt = now;

      const comboBonus = Math.min(state.combo, 8);
      let hitCount = 0;

      for (const en of state.enemies) {
        const dx = en.x - cx;
        const dy = en.y - cy;
        const dist = Math.hypot(dx, dy);
        const def = ENEMY_DEFS[en.kind];
        const hitR = range + def.size * state.scale * 0.45;
        if (dist > hitR) continue;
        const enAng = Math.atan2(dy, dx);
        if (angleDiff(enAng, angle) > halfArc) continue;

        en.hp -= weapon.damage;
        state.particles.push(
          ...createBurst(en.x, en.y, 8 + comboBonus, def.burst, 2.5 + comboBonus * 0.15)
        );
        hitCount += 1;

        if (en.hp <= 0) {
          state.enemies = state.enemies.filter((e) => e.id !== en.id);
          state.kills += 1;
          state.score += def.score * comboBonus;
          unlockWeapons();
        }
      }

      if (hitCount > 0) {
        state.particles.push(...createBurst(cx, cy, 6, weapon.particle, 2));
        queueMicrotask(() => {
          setScore(state.score);
          setCombo(state.combo);
        });
      } else {
        state.combo = 1;
        queueMicrotask(() => setCombo(1));
      }
    };

    const tryWeaponBarTap = (x: number, y: number): boolean => {
      const h = state.layoutH;
      const scale = state.scale;
      const barY = h - Math.round(58 * scale);
      if (y < barY) return false;
      const cx = state.layoutW / 2;
      const slotW = Math.round(52 * scale);
      const totalW = slotW * state.unlockedWeapons;
      const startX = cx - totalW / 2;
      if (x < startX || x > startX + totalW) return false;
      const idx = Math.floor((x - startX) / slotW);
      if (idx >= 0 && idx < state.unlockedWeapons) {
        state.weaponIdx = idx;
        queueMicrotask(() => setWeaponLabel(currentWeapon().name));
        return true;
      }
      return false;
    };

    const onPointerDown = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      if (tryWeaponBarTap(x, y)) return;
      const cx = state.layoutW / 2;
      const cy = state.layoutH / 2;
      performSlash(Math.atan2(y - cy, x - cx));
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
      const spawnInterval = Math.max(0.32, 1.05 - elapsed * 0.000025 - state.kills * 0.004);
      if (state.spawnTimer > spawnInterval) {
        state.spawnTimer = 0;
        spawnSwarm(w, h, scale, elapsed);
      }

      for (const en of state.enemies) {
        en.x += en.vx;
        en.y += en.vy;
        if (Math.hypot(en.x - cx, en.y - cy) < heroR + Math.round(6 * scale)) {
          state.hearts -= 1;
          state.combo = 1;
          state.enemies = state.enemies.filter((e) => e.id !== en.id);
          state.particles.push(...createBurst(en.x, en.y, 14, ENEMY_DEFS[en.kind].burst, 4));
          queueMicrotask(() => setCombo(1));
          if (state.hearts <= 0) {
            state.running = false;
            complete(state.score, true);
          }
        }
      }

      if (state.swingTimer > 0) state.swingTimer -= 1 / 60;
      if (state.cooldown > 0) state.cooldown -= 1 / 60;
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
      ctx.drawImage(
        sprites.campfire,
        w - decorSize - Math.round(16 * scale),
        h - decorSize - Math.round(60 * scale),
        decorSize,
        decorSize
      );
      ctx.drawImage(
        sprites.chest,
        Math.round(16 * scale),
        h - decorSize - Math.round(60 * scale),
        decorSize,
        decorSize
      );

      for (const en of state.enemies) {
        const img = enemySprites[en.kind] ?? sprites.red;
        const def = ENEMY_DEFS[en.kind];
        const size = Math.round(def.size * scale);
        ctx.drawImage(img, en.x - size / 2, en.y - size / 2, size, size);
        if (en.maxHp > 1 && en.hp < en.maxHp) {
          const barW = size;
          ctx.fillStyle = "rgba(43,43,58,0.25)";
          ctx.fillRect(en.x - barW / 2, en.y - size / 2 - Math.round(6 * scale), barW, Math.round(4 * scale));
          ctx.fillStyle = def.burst;
          ctx.fillRect(
            en.x - barW / 2,
            en.y - size / 2 - Math.round(6 * scale),
            barW * (en.hp / en.maxHp),
            Math.round(4 * scale)
          );
        }
      }

      const heroSize = Math.round(56 * scale);
      ctx.drawImage(sprites.hero, cx - heroSize / 2, cy - heroSize / 2, heroSize, heroSize);

      const weapon = currentWeapon();
      if (state.swingTimer > 0) {
        const t = state.swingTimer / 0.22;
        const weaponImg = weaponSprites[weapon.id];
        const swordSize = Math.round(44 * scale);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(state.swingAngle);
        ctx.globalAlpha = 0.85 + t * 0.15;
        ctx.drawImage(weaponImg, Math.round(12 * scale), -swordSize / 2, swordSize, swordSize);

        ctx.strokeStyle = weapon.particle;
        ctx.lineWidth = Math.round(3 * scale);
        ctx.globalAlpha = 0.35 * t;
        ctx.beginPath();
        ctx.arc(0, 0, state.swingRange * scale * (1 - t * 0.2), state.swingAngle - state.swingArc / 2, state.swingAngle + state.swingArc / 2);
        ctx.stroke();
        ctx.restore();
      }

      drawParticles(ctx, state.particles);

      const barY = h - Math.round(52 * scale);
      const slotW = Math.round(48 * scale);
      const slotH = Math.round(48 * scale);
      const totalW = slotW * state.unlockedWeapons;
      const barX = cx - totalW / 2;
      for (let i = 0; i < state.unlockedWeapons; i++) {
        const wDef = WEAPONS[i];
        const sx = barX + i * slotW + Math.round(4 * scale);
        const sy = barY;
        const active = i === state.weaponIdx;
        ctx.fillStyle = active ? "#ffffff" : "rgba(255,255,255,0.75)";
        ctx.strokeStyle = "#2b2b3a";
        ctx.lineWidth = active ? 3 : 2;
        ctx.beginPath();
        ctx.roundRect(sx, sy, slotW - Math.round(8 * scale), slotH, Math.round(8 * scale));
        ctx.fill();
        ctx.stroke();
        const iconSize = Math.round(28 * scale);
        ctx.drawImage(
          weaponSprites[wDef.id],
          sx + (slotW - Math.round(8 * scale) - iconSize) / 2,
          sy + Math.round(8 * scale),
          iconSize,
          iconSize
        );
      }

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
      <GameHud
        title="Tap Slasher"
        score={score}
        accentColor="#a855f7"
        combo={combo > 1 ? combo : undefined}
        subtitle={weaponLabel}
      />
    </div>
  );
}
