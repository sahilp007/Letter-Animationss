import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FINAL_QUESTION } from "../content/letter";
import { ScoreEngine } from "../audio/ScoreEngine";

interface Props {
  progress: number;
  onComplete: () => void;
}

/**
 * Movement IV — the climax. The galaxy collapses (driven by the Three.js layer's `collapse`
 * uniform), the score collapses to silence, the question reforms in massive light-handwriting,
 * and the orchestra returns at peak.
 *
 * Phases (within this scene's progress):
 *   0.00 - 0.25  collapse      everything pulls inward, score fades out
 *   0.25 - 0.40  silence       a held breath
 *   0.40 - 0.85  bloom         question fades in, score swells back to full
 *   0.85 - 1.00  hold          the question lingers
 */
export function Crescendo({ progress, onComplete }: Props) {
  const [phase, setPhase] = useState<"collapse" | "silence" | "bloom" | "hold">("collapse");

  useEffect(() => {
    if (progress < 0.25) setPhase("collapse");
    else if (progress < 0.4) setPhase("silence");
    else if (progress < 0.85) setPhase("bloom");
    else setPhase("hold");
  }, [progress]);

  useEffect(() => {
    if (phase === "collapse") ScoreEngine.collapseAll(2400);
    if (phase === "bloom") {
      ScoreEngine.swellAll(3500);
      ScoreEngine.setMasterTarget(1.2, 4000);
    }
  }, [phase]);

  useEffect(() => {
    if (progress >= 0.99) onComplete();
  }, [progress, onComplete]);

  return (
    <div className="crescendo-stage" aria-hidden>
      <AnimatePresence>
        {(phase === "bloom" || phase === "hold") && (
          <motion.div
            className="crescendo-question"
            initial={{ opacity: 0, scale: 0.7, filter: "blur(40px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0 }}
            transition={{ duration: 4.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {FINAL_QUESTION}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
