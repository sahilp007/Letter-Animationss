import { useEffect, useRef } from "react";
import type { GestureSample } from "../types";

/**
 * Tracks cursor (or touch) movement and exposes a smoothed energy value [0..1].
 * The energy drives orchestral swells — wide, fast gestures bring instruments in;
 * holding still pulls them back.
 */
export function useGesture(onSample?: (s: GestureSample) => void) {
  const stateRef = useRef<GestureSample>({ x: 0, y: 0, vx: 0, vy: 0, speed: 0, energy: 0, t: 0 });
  const cbRef = useRef(onSample);
  cbRef.current = onSample;

  useEffect(() => {
    let last: { x: number; y: number; t: number } | null = null;
    const update = (clientX: number, clientY: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const x = (clientX / w) * 2 - 1;
      const y = -((clientY / h) * 2 - 1);
      const t = performance.now();
      let vx = 0;
      let vy = 0;
      if (last) {
        const dt = Math.max(1, t - last.t);
        vx = (x - last.x) / (dt / 1000);
        vy = (y - last.y) / (dt / 1000);
      }
      const speed = Math.hypot(vx, vy);
      const targetEnergy = Math.min(1, speed / 6);
      const energy = stateRef.current.energy * 0.85 + targetEnergy * 0.15;
      stateRef.current = { x, y, vx, vy, speed, energy, t };
      last = { x, y, t };
      cbRef.current?.(stateRef.current);
    };
    const onMove = (e: PointerEvent) => update(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove);

    /* Decay energy when idle — gestures must be ongoing to keep instruments in. */
    let raf = 0;
    const decay = () => {
      stateRef.current.energy *= 0.995;
      cbRef.current?.(stateRef.current);
      raf = requestAnimationFrame(decay);
    };
    raf = requestAnimationFrame(decay);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return stateRef;
}
