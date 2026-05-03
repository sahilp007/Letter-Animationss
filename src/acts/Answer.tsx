import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioEngine } from "../audio/AudioEngine";
import { heartbeat } from "../audio/HeartbeatScheduler";
import { FINAL_WORD } from "../content/script";
import type { Answer } from "../types";

interface Props {
  onAnswer: (answer: Answer, timeToDecideMs: number) => void;
  onHoverStart?: (which: Answer) => void;
}

/* Act 4 — the answer. Two equal-weight choices, no pre-selection, no countdown. */
export function AnswerAct({ onAnswer, onHoverStart }: Props) {
  const [phase, setPhase] = useState<"choosing" | "yes-bloom">("choosing");
  const shownAt = useRef(performance.now());
  const hoverNotedRef = useRef<Set<Answer>>(new Set());
  const hoverTimerRef = useRef<Record<Answer, number | null>>({ yes: null, moment: null });

  const handleHoverEnter = (which: Answer) => {
    if (hoverTimerRef.current[which] !== null) return;
    hoverTimerRef.current[which] = window.setTimeout(() => {
      if (!hoverNotedRef.current.has(which)) {
        hoverNotedRef.current.add(which);
        onHoverStart?.(which);
      }
    }, 500);
  };

  const handleHoverLeave = (which: Answer) => {
    if (hoverTimerRef.current[which] !== null) {
      window.clearTimeout(hoverTimerRef.current[which]!);
      hoverTimerRef.current[which] = null;
    }
  };

  const decide = (answer: Answer) => {
    const dt = performance.now() - shownAt.current;
    if (answer === "yes") {
      setPhase("yes-bloom");
      heartbeat.setSyntheticGain(0.4);
      AudioEngine.setTargetSongVolume(1);
    }
    onAnswer(answer, dt);
  };

  useEffect(() => () => {
    Object.values(hoverTimerRef.current).forEach((t) => t !== null && window.clearTimeout(t));
  }, []);

  return (
    <div className="answer-stage">
      <AnimatePresence mode="wait">
        {phase === "choosing" && (
          <motion.div
            key="choosing"
            className="answer-choices"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          >
            <button
              className="answer-button"
              onMouseEnter={() => handleHoverEnter("yes")}
              onMouseLeave={() => handleHoverLeave("yes")}
              onClick={() => decide("yes")}
            >
              yes.
            </button>
            <button
              className="answer-button answer-button--secondary"
              onMouseEnter={() => handleHoverEnter("moment")}
              onMouseLeave={() => handleHoverLeave("moment")}
              onClick={() => decide("moment")}
            >
              i need a moment.
            </button>
          </motion.div>
        )}
        {phase === "yes-bloom" && (
          <motion.div
            key="bloom"
            className="answer-bloom"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 2.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="answer-bloom__word">{FINAL_WORD}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
