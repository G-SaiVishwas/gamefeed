/** Tint a sprite sheet pixel for colored enemy variants. */
export function tintSprite(
  img: HTMLImageElement,
  hex: string
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  ctx.globalCompositeOperation = "source-atop";
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}

/** Doodle-style procedural weapons matching the Scribble pack. */
export function createProceduralWeapon(
  kind: "axe" | "spear" | "hammer"
): HTMLCanvasElement {
  const size = 128;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const ctx = c.getContext("2d")!;
  const ink = "#2b2b3a";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (kind === "axe") {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 5;
    ctx.fillStyle = "#fb923c";
    ctx.beginPath();
    ctx.moveTo(78, 28);
    ctx.lineTo(108, 52);
    ctx.lineTo(96, 78);
    ctx.lineTo(62, 62);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(36, 96);
    ctx.lineTo(88, 44);
    ctx.stroke();
  } else if (kind === "spear") {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(34, 94);
    ctx.lineTo(94, 34);
    ctx.stroke();
    ctx.fillStyle = "#67e8f9";
    ctx.beginPath();
    ctx.moveTo(94, 34);
    ctx.lineTo(108, 48);
    ctx.lineTo(88, 52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3b82f6";
    ctx.beginPath();
    ctx.moveTo(88, 52);
    ctx.lineTo(102, 66);
    ctx.lineTo(82, 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(40, 98);
    ctx.lineTo(72, 66);
    ctx.stroke();
    ctx.fillStyle = "#facc15";
    ctx.beginPath();
    ctx.arc(82, 46, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eab308";
    ctx.beginPath();
    ctx.arc(88, 40, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  return c;
}

export function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}
