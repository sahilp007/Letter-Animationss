import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScoreEngine } from "../audio/ScoreEngine";

interface Props {
  progress: number;
  onComplete: () => void;
}

const BEATS = [
  { at: 0.05, text: "the sky is yours." },
  { at: 0.4, text: "every word i never said —" },
  { at: 0.72, text: "they're all here." },
];

/**
 * Movement II — the galaxy forms. Most of the visual lives in the Three.js layer (particles
 * morph from chaos cloud to spiral, nebula warms up). HTML overlay is just a few lyrical
 * captions that fade in and out, like subtitles in a wordless film.
 */
export function Galaxy({ progress, onComplete }: Props) {
  useEffect(() => {
    if (progress >= 0.99) onComplete();
  }, [progress, onComplete]);

  useEffect(() => {
    /* Bring in choir as the galaxy reveals itself. */
    ScoreEngine.bringInLayer("choir", 5000);
    ScoreEngine.bringInLayer("winds", 5500);
  }, []);

  const active = BEATS.find((b, i) => {
    const next = BEATS[i + 1];
    return progress >= b.at && (!next || progress < next.at);
  });

  return (
    <div className="galaxy-stage" aria-hidden>
      <AnimatePresence mode="wait">
        {active && (
          <motion.div
            key={active.text}
            className="galaxy-caption"
            initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
          >
            {active.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
