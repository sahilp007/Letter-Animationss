import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FINAL_WORD, HOLDING_COPY } from "../content/letter";
import { ScoreEngine } from "../audio/ScoreEngine";
import type { Answer } from "../types";

interface Props {
  onAnswer: (answer: Answer, timeToDecideMs: number) => void;
  onHoverStart?: (which: Answer) => void;
  onReplay: () => void;
  inHolding: boolean;
}

/* The Coda — Yes blooms gold, "I need a moment" holds the chord open. */
export function Coda({ onAnswer, onHoverStart, onReplay, inHolding }: Props) {
  const [decided, setDecided] = useState<Answer | null>(null);
  const shownAt = useRef(performance.now());
  const hoverNotedRef = useRef<Set<Answer>>(new Set());
  const hoverTimer = useRef<Record<Answer, number | null>>({ yes: null, moment: null });

  const onHoverIn = (which: Answer) => {
    if (hoverTimer.current[which] !== null) return;
    hoverTimer.current[which] = window.setTimeout(() => {
      if (!hoverNotedRef.current.has(which)) {
        hoverNotedRef.current.add(which);
        onHoverStart?.(which);
      }
    }, 500);
  };
  const onHoverOut = (which: Answer) => {
    if (hoverTimer.current[which] !== null) {
      window.clearTimeout(hoverTimer.current[which]!);
      hoverTimer.current[which] = null;
    }
  };

  const decide = (answer: Answer) => {
    setDecided(answer);
    if (answer === "yes") {
      ScoreEngine.swellAll(2000);
      ScoreEngine.setMasterTarget(1.4, 3000);
    } else {
      ScoreEngine.setMasterTarget(0.6, 4000);
    }
    onAnswer(answer, performance.now() - shownAt.current);
  };

  if (inHolding) {
    return (
      <motion.div
        className="coda-holding"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6 }}
      >
        <motion.div className="coda-holding__line" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 0.4 }}>
          {HOLDING_COPY.line1}
        </motion.div>
        <motion.div className="coda-holding__line coda-holding__line--soft" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 1.6 }}>
          {HOLDING_COPY.line2}
        </motion.div>
        <motion.button className="coda-replay" initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ duration: 1.2, delay: 4 }} onClick={onReplay}>
          {HOLDING_COPY.replay}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="coda-stage">
      <AnimatePresence mode="wait">
        {decided === null && (
          <motion.div
            key="choices"
            className="coda-choices"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
          >
            <button
              className="coda-button coda-button--primary"
              onMouseEnter={() => onHoverIn("yes")}
              onMouseLeave={() => onHoverOut("yes")}
              onClick={() => decide("yes")}
            >
              yes.
            </button>
            <button
              className="coda-button coda-button--secondary"
              onMouseEnter={() => onHoverIn("moment")}
              onMouseLeave={() => onHoverOut("moment")}
              onClick={() => decide("moment")}
            >
              i need a moment.
            </button>
          </motion.div>
        )}
        {decided === "yes" && (
          <motion.div
            key="bloom"
            className="coda-bloom"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 3, ease: [0.16, 1, 0.3, 1] }}
          >
            {FINAL_WORD}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
