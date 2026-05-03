/**
 * Organic pulse rendering — a radial gradient with subtle noise on its edge so it breathes
 * rather than reading as a perfect circle. Pure 2D canvas; no WebGL.
 */

export interface PulseFrame {
  /** 0..1 amplitude — peaks at 1 on each beat, decays softly between beats. */
  amplitude: number;
  /** RGB color, 0..255 each, of the pulse core. */
  coreColor: [number, number, number];
  /** RGB color of the surrounding glow. */
  glowColor: [number, number, number];
  /** Background color the canvas clears to. */
  bgColor: [number, number, number];
  /** 0..1 — how much the pulse fills the screen (0 = small, 1 = covers everything). */
  bloom: number;
}

/* Lightweight value-noise — good enough for an organic edge, cheap to compute every frame. */
const NOISE_GRID = 64;
const noiseSeed: number[] = (() => {
  const arr: number[] = [];
  for (let i = 0; i < NOISE_GRID; i++) arr.push(Math.random());
  return arr;
})();

function softNoise(t: number): number {
  const x = ((t % 1) + 1) % 1;
  const i = Math.floor(x * NOISE_GRID);
  const f = x * NOISE_GRID - i;
  const a = noiseSeed[i % NOISE_GRID];
  const b = noiseSeed[(i + 1) % NOISE_GRID];
  const u = f * f * (3 - 2 * f);
  return a * (1 - u) + b * u;
}

export function renderPulse(ctx: CanvasRenderingContext2D, frame: PulseFrame, time: number): void {
  const { width, height } = ctx.canvas;
  const [br, bg, bb] = frame.bgColor;
  ctx.fillStyle = `rgb(${br}, ${bg}, ${bb})`;
  ctx.fillRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const baseRadius = minDim * (0.08 + 0.55 * frame.bloom);
  const pulseRadius = baseRadius * (1 + frame.amplitude * 0.18);

  const [cr, cg, cb] = frame.coreColor;
  const [gr, gg, gb] = frame.glowColor;

  /* Outer glow — large, soft, fills more of the screen as bloom grows. */
  const glowRadius = pulseRadius * (2.4 + frame.bloom * 1.6);
  const glow = ctx.createRadialGradient(cx, cy, pulseRadius * 0.4, cx, cy, glowRadius);
  glow.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, ${0.55 + 0.25 * frame.amplitude})`);
  glow.addColorStop(0.5, `rgba(${gr}, ${gg}, ${gb}, ${0.18 * (1 - frame.bloom * 0.4)})`);
  glow.addColorStop(1, `rgba(${gr}, ${gg}, ${gb}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  /* Organic edge — sample noise around the perimeter to perturb the radius. */
  ctx.beginPath();
  const segments = 96;
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const n = softNoise(time * 0.07 + i * 0.13) - 0.5;
    const r = pulseRadius * (1 + n * 0.06);
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
  core.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.95})`);
  core.addColorStop(0.6, `rgba(${cr}, ${cg}, ${cb}, ${0.6})`);
  core.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
  ctx.fillStyle = core;
  ctx.fill();
}

export function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const k = Math.max(0, Math.min(1, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
}

export const PALETTE = {
  black: [0, 0, 0] as [number, number, number],
  plum: [26, 13, 31] as [number, number, number],
  umber: [61, 40, 24] as [number, number, number],
  gold: [212, 165, 116] as [number, number, number],
  warmWhite: [244, 228, 212] as [number, number, number],
  ember: [255, 184, 124] as [number, number, number],
};
