import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface Props {
  /** 0..1 — when undefined the loader is in indeterminate mode (used as Suspense fallback). */
  progress?: number;
  /** Optional headline above the bloom. */
  headline?: string;
}

/**
 * The cinematic loader — a slow-blooming logomark on a dark field. Used both as the
 * Suspense fallback while the cosmic chunk downloads, and as the in-app loader while
 * the orchestral score loads after Begin.
 *
 * The visual: a single luminous mark drawn on a canvas, breathing, with three concentric
 * halos that expand on the rhythm of a slow heartbeat. As progress (or time) advances,
 * the halos brighten and a glyph reveals at the center.
 */
export function CosmicLoader({ progress, headline }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress ?? 0);
  const indeterminate = progress === undefined;

  /* Keep the canvas reading the latest progress without re-creating the RAF loop. */
  useEffect(() => {
    progressRef.current = progress ?? progressRef.current;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let driftedProgress = 0; /* used in indeterminate mode */
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const draw = (t: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;

      ctx.clearRect(0, 0, w, h);

      /* Background — almost black with a subtle warm radial. */
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7);
      bg.addColorStop(0, "rgba(20, 14, 28, 1)");
      bg.addColorStop(0.5, "rgba(7, 5, 12, 1)");
      bg.addColorStop(1, "rgba(2, 1, 4, 1)");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);

      /* Slow heartbeat — 0..1 amplitude, period ~3.2s. */
      const breath = 0.5 + 0.5 * Math.sin(t * 0.0019);
      const breath2 = 0.5 + 0.5 * Math.sin(t * 0.0019 - 0.6);

      const p = indeterminate ? driftedProgress : progressRef.current;
      const base = 0.18 + p * 0.62; /* core brightness */

      /* Three concentric halos. Each pulses on the breath at slightly different phases. */
      const baseRadius = Math.min(w, h) * 0.05;
      const halos = [
        { r: baseRadius * (3.2 + breath * 0.6), a: 0.12 * base, color: [255, 215, 175] },
        { r: baseRadius * (5.0 + breath2 * 0.7), a: 0.07 * base, color: [255, 195, 150] },
        { r: baseRadius * (7.4 + breath * 0.5), a: 0.04 * base, color: [255, 175, 130] },
      ];
      for (const halo of halos) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, halo.r);
        grad.addColorStop(0, `rgba(${halo.color[0]}, ${halo.color[1]}, ${halo.color[2]}, ${halo.a})`);
        grad.addColorStop(1, `rgba(${halo.color[0]}, ${halo.color[1]}, ${halo.color[2]}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, halo.r, 0, Math.PI * 2);
        ctx.fill();
      }

      /* Core mark — small, intimate, blooms with progress. */
      const coreR = baseRadius * (0.65 + breath * 0.12) * (0.7 + base * 0.6);
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
      core.addColorStop(0, `rgba(255, 245, 225, ${0.9 * base + 0.1})`);
      core.addColorStop(0.6, `rgba(255, 220, 180, ${0.5 * base})`);
      core.addColorStop(1, "rgba(255, 200, 140, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();

      /* Tiny bright nucleus. */
      ctx.fillStyle = `rgba(255, 252, 240, ${0.9 * base + 0.1})`;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(1.2, coreR * 0.18), 0, Math.PI * 2);
      ctx.fill();

      if (indeterminate) {
        /* Drift progress so the indeterminate loader still has visual momentum. */
        driftedProgress = (Math.sin(t * 0.00065) + 1) / 2;
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [indeterminate]);

  return (
    <motion.div
      className="cosmic-loader-stage"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
    >
      <canvas ref={canvasRef} className="cosmic-loader-canvas" aria-hidden />
      {headline && (
        <motion.div
          className="cosmic-loader-headline"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 0.78, y: 0 }}
          transition={{ duration: 1.6, delay: 0.4 }}
        >
          {headline}
        </motion.div>
      )}
      {progress !== undefined && (
        <motion.div
          className="cosmic-loader-percent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ duration: 1.2, delay: 0.6 }}
        >
          {Math.round(progress * 100)}%
        </motion.div>
      )}
    </motion.div>
  );
}
