import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MEMORIES } from "../content/memories";
import { ScoreEngine } from "../audio/ScoreEngine";
import type { MemoryStar } from "../types";

interface Props {
  progress: number;
  visited: Set<string>;
  onVisit: (id: string) => void;
  onComplete: () => void;
  /** Last memory the user touched — surfaces a caption above the stage. */
  lastVisited: MemoryStar | null;
}

/**
 * Movement III — she conducts. Memory stars (rendered in the 3D layer) become approachable.
 * As she visits stars, the orchestra has all layers active and pulses with her motion.
 * Auto-advance once she's visited at least 4 of 6 stars OR after a generous timeout.
 */
export function Conductor({ progress, visited, onVisit, onComplete, lastVisited }: Props) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (completed) return;
    /* Advance after a meaningful exploration — either she touched most stars, or time's up. */
    const enoughVisited = visited.size >= 4;
    const timeUp = progress >= 0.9;
    if (enoughVisited && progress >= 0.4) {
      setCompleted(true);
      onComplete();
    } else if (timeUp) {
      setCompleted(true);
      onComplete();
    }
  }, [progress, visited.size, completed, onComplete]);

  useEffect(() => {
    /* Full orchestra now. */
    ScoreEngine.swellAll(3000);
  }, []);

  /* Hint that fades in if she's been still for too long without visiting. */
  const showHint = visited.size === 0 && progress > 0.15;

  return (
    <div className="conductor-stage" aria-hidden>
      <AnimatePresence>
        {showHint && (
          <motion.div
            className="conductor-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4 }}
          >
            move closer to a star
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {lastVisited?.caption && (
          <motion.div
            key={lastVisited.id}
            className="conductor-caption"
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
            transition={{ duration: 1.4 }}
          >
            {lastVisited.caption}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="conductor-progress" aria-hidden>
        {MEMORIES.map((m) => (
          <span key={m.id} className={`conductor-pip${visited.has(m.id) ? " is-on" : ""}`} onClick={() => onVisit(m.id)} />
        ))}
      </div>
    </div>
  );
}
