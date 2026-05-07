import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { LETTER_LINES } from "../content/letter";
import { ScoreEngine } from "../audio/ScoreEngine";

interface Props {
  progress: number;
  onComplete: () => void;
}

interface FloatingLetter {
  ch: string;
  /* Polar position so letters disperse radially from a central origin and stay on-screen. */
  angle: number;
  /* Radius at the start (within the paper area) and at the end (within viewport). */
  startR: number;
  driftR: number;
  /* Subtle rotation while drifting. */
  rotate: number;
  /* Per-letter delay so the disbursement reads as a wave, not a snap. */
  delay: number;
  /* Per-letter duration ranges (slower stars feel further away). */
  duration: number;
  /* Final scale shrinks slightly to suggest receding into space. */
  finalScale: number;
  /* Initial size variation — small letters read as drifting further. */
  size: number;
  /* Color tone bias — most warm, a few cool, gives variety. */
  cool: boolean;
}

/**
 * Movement I — letters from the page detach and disperse outward in a soft cosmic bloom.
 *
 * Geometry: each letter has a polar (angle, radius). Letters start at small radii (the paper
 * footprint) and drift to larger radii capped at ~vmin*0.55 so they NEVER clip a screen edge.
 * Opacity is curved so they fade out before reaching the boundary.
 *
 * Timing: a wave of disbursement across ~3.5s, then a long quiet decay as the cosmos behind
 * takes over. The score brings strings/piano/bass to the front.
 */
export function Lift({ progress, onComplete }: Props) {
  const completedRef = useRef(false);

  const letters = useMemo<FloatingLetter[]>(() => {
    /* Flatten letter content; preserve no spaces for visual density. */
    const all = LETTER_LINES.join(" ").split("").filter((c) => c.trim().length > 0);
    return all.map((ch, i) => {
      const angle = (i / all.length) * Math.PI * 2 + Math.random() * 0.4;
      const startR = 6 + Math.random() * 14; /* vmin units, paper-ish footprint */
      const driftR = 28 + Math.random() * 18; /* never exceeds 50 vmin from center */
      return {
        ch,
        angle,
        startR,
        driftR,
        rotate: -22 + Math.random() * 44,
        delay: (i % 30) * 0.06 + Math.random() * 1.2,
        duration: 14 + Math.random() * 8,
        finalScale: 0.55 + Math.random() * 0.4,
        size: 0.85 + Math.random() * 1.0,
        cool: Math.random() < 0.18,
      };
    });
  }, []);

  useEffect(() => {
    /* Bring in strings + piano + bass for the lift */
    ScoreEngine.bringInLayer("strings", 2400);
    ScoreEngine.bringInLayer("piano", 3200);
    ScoreEngine.bringInLayer("bass", 4000);
  }, []);

  useEffect(() => {
    if (progress >= 0.99 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [progress, onComplete]);

  return (
    <div className="lift-stage" aria-hidden>
      {letters.map((l, i) => {
        const sx = Math.cos(l.angle) * l.startR;
        const sy = Math.sin(l.angle) * l.startR;
        const ex = Math.cos(l.angle) * l.driftR;
        const ey = Math.sin(l.angle) * l.driftR;
        return (
          <motion.span
            key={i}
            className={`lift-letter${l.cool ? " is-cool" : ""}`}
            initial={{
              x: `${sx}vmin`,
              y: `${sy}vmin`,
              opacity: 0,
              scale: l.size,
              rotate: 0,
            }}
            animate={{
              x: [`${sx}vmin`, `${ex * 0.65}vmin`, `${ex}vmin`],
              y: [`${sy}vmin`, `${ey * 0.6 - 4}vmin`, `${ey - 6}vmin`],
              opacity: [0, 0.95, 0],
              scale: [l.size, l.size * 0.9, l.size * l.finalScale],
              rotate: [0, l.rotate * 0.6, l.rotate],
            }}
            transition={{
              duration: l.duration,
              delay: l.delay,
              times: [0, 0.4, 1],
              ease: [0.32, 0.04, 0.18, 1],
            }}
          >
            {l.ch}
          </motion.span>
        );
      })}
    </div>
  );
}
