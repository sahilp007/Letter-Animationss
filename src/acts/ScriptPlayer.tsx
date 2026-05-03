import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useBeat } from "../hooks/useBeat";
import { AudioEngine } from "../audio/AudioEngine";
import type { ScriptEntry } from "../types";

interface Props {
  script: ScriptEntry[];
  /** Beat index at which playback begins. The script consumes beats from the global heartbeat. */
  startBeat: number;
  /** Called once after the final entry's beats have elapsed. */
  onComplete: () => void;
  /** Called whenever a voice clip is triggered, for telemetry. */
  onVoice?: (clipId: string) => void;
  /** Optional progress callback: 0..1 across the entire script. */
  onProgress?: (p: number) => void;
  /** Visual scale multiplier for the displayed text. */
  scale?: number;
}

export function ScriptPlayer({ script, startBeat, onComplete, onVoice, onProgress, scale = 1 }: Props) {
  const [currentEntry, setCurrentEntry] = useState<ScriptEntry | null>(null);
  const indexRef = useRef(0);
  const entryStartBeatRef = useRef(startBeat);
  const completedRef = useRef(false);
  const voicePlayedRef = useRef<Set<string>>(new Set());

  const totalBeats = script.reduce((sum, e) => sum + e.beats, 0);

  useBeat((event) => {
    if (completedRef.current) return;
    const elapsed = event.index - startBeat;
    if (elapsed < 0) return;

    const entry = script[indexRef.current];
    if (!entry) return;

    /* Trigger entry on its first beat. */
    const beatsIntoEntry = event.index - entryStartBeatRef.current;
    if (beatsIntoEntry === 0) {
      setCurrentEntry(entry);
      if (entry.kind === "voice" && entry.voiceClip && !voicePlayedRef.current.has(entry.id)) {
        voicePlayedRef.current.add(entry.id);
        AudioEngine.playVoice(entry.voiceClip);
        onVoice?.(entry.voiceClip);
      }
    }

    /* Advance when this entry's beats are spent. */
    if (beatsIntoEntry + 1 >= entry.beats) {
      indexRef.current += 1;
      entryStartBeatRef.current = event.index + 1;
      if (indexRef.current >= script.length) {
        completedRef.current = true;
        setCurrentEntry(null);
        onComplete();
        return;
      }
    }

    onProgress?.(Math.min(1, (elapsed + 1) / totalBeats));
  });

  useEffect(() => {
    indexRef.current = 0;
    entryStartBeatRef.current = startBeat;
    completedRef.current = false;
    voicePlayedRef.current = new Set();
    setCurrentEntry(null);
  }, [script, startBeat]);

  const text = currentEntry && currentEntry.kind !== "silence" ? currentEntry.text ?? "" : "";

  return (
    <div className="script-stage">
      <AnimatePresence mode="wait">
        {text && (
          <motion.div
            key={currentEntry!.id}
            initial={{ opacity: 0, y: 6, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -4, filter: "blur(3px)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`script-line script-line--${currentEntry!.kind}`}
            style={{ fontSize: `${scale * 5.6}vw` }}
          >
            {text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
