export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  alpha: number;
}

export interface ScreenShake {
  intensity: number;
  duration: number;
  elapsed: number;
}

export const PALETTE = {
  indigo: "#818cf8",
  violet: "#c084fc",
  cyan: "#67e8f9",
  magenta: "#f472b6",
  red: "#fb7185",
  green: "#4ade80",
  yellow: "#facc15",
  white: "#ffffff",
  dark: "#06060a",
} as const;

export const GAME_ACCENTS = {
  dodge: { primary: "#818cf8", secondary: "#fb7185", glow: "rgba(129,140,248,0.5)" },
  tapRush: { primary: "#c084fc", secondary: "#67e8f9", glow: "rgba(192,132,252,0.5)" },
  stack: { primary: "#67e8f9", secondary: "#818cf8", glow: "rgba(103,232,249,0.5)" },
  reaction: { primary: "#f472b6", secondary: "#facc15", glow: "rgba(244,114,182,0.5)" },
} as const;

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function createBurst(
  x: number,
  y: number,
  count: number,
  color: string,
  speed = 4
): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const vel = speed * (0.5 + Math.random() * 0.5);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * vel,
      vy: Math.sin(angle) * vel,
      life: 1,
      maxLife: 0.4 + Math.random() * 0.4,
      size: 2 + Math.random() * 4,
      color,
      alpha: 1,
    });
  }
  return particles;
}

export function createTrail(
  x: number,
  y: number,
  color: string
): Particle {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    life: 1,
    maxLife: 0.3 + Math.random() * 0.2,
    size: 3 + Math.random() * 3,
    color,
    alpha: 0.6,
  };
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map((p) => {
      p.x += p.vx * dt * 60;
      p.y += p.vy * dt * 60;
      p.vy += 0.05 * dt * 60;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      p.size *= 0.98;
      return p;
    })
    .filter((p) => p.life > 0);
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (const p of particles) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

export function createShake(intensity = 8, duration = 300): ScreenShake {
  return { intensity, duration, elapsed: 0 };
}

export function getShakeOffset(shake: ScreenShake): { x: number; y: number } {
  if (shake.elapsed >= shake.duration) return { x: 0, y: 0 };
  const progress = 1 - shake.elapsed / shake.duration;
  const mag = shake.intensity * progress;
  return {
    x: (Math.random() - 0.5) * mag * 2,
    y: (Math.random() - 0.5) * mag * 2,
  };
}

export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  glowRadius = 20
) {
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius + glowRadius);
  grad.addColorStop(0, color);
  grad.addColorStop(0.6, color);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius + glowRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

export function drawNeonRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  glow = true
) {
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
  }
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, color);
  grad.addColorStop(1, adjustBrightness(color, -30));
  ctx.fillStyle = grad;
  ctx.beginPath();
  roundRect(ctx, x, y, w, h, 4);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = adjustBrightness(color, 40);
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  offsetY: number,
  color = "rgba(99,102,241,0.06)",
  spacing = 40
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const startY = offsetY % spacing;
  for (let y = startY; y < h; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let x = 0; x < w; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  stars: { x: number; y: number; size: number; alpha: number }[],
  offsetY: number
) {
  for (const star of stars) {
    const y = ((star.y + offsetY) % h + h) % h;
    ctx.globalAlpha = star.alpha;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(star.x, y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function generateStars(count: number, w: number, h: number) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    size: Math.random() * 1.5 + 0.5,
    alpha: Math.random() * 0.5 + 0.2,
  }));
}

function adjustBrightness(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function drawShard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  color: string
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fillStyle = color;
  ctx.beginPath();
  const s = size / 2;
  ctx.moveTo(0, -s);
  ctx.lineTo(s * 0.6, 0);
  ctx.lineTo(0, s);
  ctx.lineTo(-s * 0.6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
