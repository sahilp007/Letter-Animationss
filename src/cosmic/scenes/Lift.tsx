import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LETTER_LINES } from "../content/letter";
import { ScoreEngine } from "../audio/ScoreEngine";

interface Props {
  progress: number;
  onComplete: () => void;
}

interface FloatingLetter {
  ch: string;
  startX: number;
  startY: number;
  driftX: number;
  driftY: number;
  rotation: number;
  delay: number;
  size: number;
}

/**
 * Movement I — letters from the page detach and float upward into the void as the score
 * brings strings to the front. Pure HTML/CSS animation over the Three.js cosmos that's
 * already revealing itself behind. Once they've drifted out of frame, the scene completes
 * and Movement II takes over (galaxy formation).
 */
export function Lift({ progress, onComplete }: Props) {
  const completedRef = useRef(false);
  const [phase, setPhase] = useState<"detach" | "drift" | "fade">("detach");

  /* Build a randomized constellation of letters from the letter content. */
  const letters = useMemo<FloatingLetter[]>(() => {
    const all = LETTER_LINES.join(" ").split("");
    return all
      .filter((c) => c.trim().length > 0)
      .map((ch, i) => ({
        ch,
        startX: -30 + ((i * 13) % 60),
        startY: 8 + Math.sin(i * 1.7) * 18,
        driftX: -8 + Math.sin(i * 2.3) * 16,
        driftY: -55 - Math.random() * 25,
        rotation: -25 + Math.random() * 50,
        delay: i * 0.018 + Math.random() * 0.5,
        size: 0.9 + Math.random() * 1.4,
      }));
  }, []);

  useEffect(() => {
    if (progress > 0.05 && phase === "detach") setPhase("drift");
    if (progress > 0.7 && phase === "drift") setPhase("fade");
    if (progress >= 0.99 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [progress, phase, onComplete]);

  useEffect(() => {
    /* Bring in strings + piano + bass for the lift */
    ScoreEngine.bringInLayer("strings", 2400);
    ScoreEngine.bringInLayer("piano", 3200);
    ScoreEngine.bringInLayer("bass", 4000);
  }, []);

  return (
    <div className="lift-stage" aria-hidden>
      {letters.map((l, i) => (
        <motion.span
          key={i}
          className="lift-letter"
          initial={{ x: `${l.startX}vw`, y: `${l.startY}vh`, opacity: 0, rotate: 0, scale: l.size }}
          animate={
            phase === "detach"
              ? { opacity: 1, rotate: 0, y: `${l.startY - 1}vh` }
              : phase === "drift"
              ? { x: `${l.startX + l.driftX}vw`, y: `${l.driftY}vh`, opacity: 0.85, rotate: l.rotation, scale: l.size * 0.9 }
              : { opacity: 0, scale: l.size * 0.4, y: `${l.driftY - 30}vh` }
          }
          transition={{ duration: phase === "fade" ? 2.4 : 7, ease: [0.4, 0.04, 0.2, 1], delay: l.delay }}
        >
          {l.ch}
        </motion.span>
      ))}
    </div>
  );
}
