import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LETTER_LINES, buildNoteAssignments } from "../content/letter";
import { NotesEngine } from "../audio/NotesEngine";
import { ScoreEngine } from "../audio/ScoreEngine";

interface Props {
  /** 0..1 progress within Opening; the words reveal letter-by-letter as this advances. */
  progress: number;
  onWordPlayed: (wordIndex: number) => void;
  onComplete: () => void;
  /** When true, words start lifting off the page — used as we transition into Lift. */
  lifting: boolean;
}

/**
 * The opening — your letter on paper, written in Beth Ellen. Each word is hoverable; touching
 * a word plays a note and brings in an orchestral layer. After the full reveal, the words
 * begin to drift upward (lifting=true) and fade out as the cosmic scene takes over.
 */
export function Opening({ progress, onWordPlayed, onComplete, lifting }: Props) {
  const noteAssignments = useMemo(() => buildNoteAssignments(), []);
  const allWords = useMemo(() => LETTER_LINES.flatMap((line, lineIdx) => line.split(/\s+/).map((w) => ({ w, lineIdx }))), []);
  const [revealedCount, setRevealedCount] = useState(0);
  const [playedSet, setPlayedSet] = useState<Set<number>>(new Set());
  const completedRef = useRef(false);

  useEffect(() => {
    /* Reveal words across the first 80% of progress; the rest is rest. */
    const targetCount = Math.floor(Math.min(1, progress / 0.8) * allWords.length);
    if (targetCount > revealedCount) setRevealedCount(targetCount);
    if (progress >= 0.99 && !completedRef.current) {
      completedRef.current = true;
      onComplete();
    }
  }, [progress, allWords.length, revealedCount, onComplete]);

  const playWord = (idx: number) => {
    if (playedSet.has(idx)) return;
    const assignment = noteAssignments[idx];
    if (!assignment) return;
    NotesEngine.play(assignment.semitone, 0.7);
    ScoreEngine.bringInLayer(assignment.layer, 2400);
    setPlayedSet((s) => new Set(s).add(idx));
    onWordPlayed(idx);
  };

  let runningWordIndex = -1;

  return (
    <AnimatePresence>
      {!lifting && (
        <motion.div
          className="opening-stage"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.6 }}
        >
          <div className="paper">
            <div className="paper__inner">
              {LETTER_LINES.map((line, lineIdx) => (
                <div key={lineIdx} className="paper__line">
                  {line.split(/\s+/).map((word) => {
                    runningWordIndex += 1;
                    const idx = runningWordIndex;
                    const revealed = idx < revealedCount;
                    const played = playedSet.has(idx);
                    return (
                      <motion.span
                        key={idx}
                        className={`paper__word${played ? " is-played" : ""}${revealed ? " is-revealed" : ""}`}
                        initial={false}
                        animate={{
                          opacity: revealed ? 1 : 0,
                          y: revealed ? 0 : 6,
                          filter: revealed ? "blur(0px)" : "blur(4px)",
                        }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        onPointerEnter={() => revealed && playWord(idx)}
                        onClick={() => revealed && playWord(idx)}
                      >
                        {word}{" "}
                      </motion.span>
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="paper__cue">{progress < 0.95 ? "drag your cursor across the words" : "·"}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
