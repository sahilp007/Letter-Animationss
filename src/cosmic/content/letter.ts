import type { NoteAssignment, ScoreLayer } from "../types";

/**
 * The handwritten letter. Each LINE is shown as a unit; words within a line are individually
 * playable (each triggers a note + brings in a score layer).
 *
 * Replace with your own letter before the proposal. Aim for ~30-50 words total — enough to
 * carry the emotional arc, not so many that the cursor-instrument moment loses its weight.
 */

export const LETTER_LINES: string[] = [
  "i was going to write something clever.",
  "but every time i tried,",
  "the words came out the same way —",
  "you,",
  "and the way you make every ordinary day",
  "feel like a place i want to live in.",
  "so i'll just say what's true:",
];

/** A pentatonic-ish scale so anything she "plays" sounds beautiful. */
const SCALE: number[] = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];

const LAYER_ROTATION: ScoreLayer[] = ["strings", "piano", "choir", "winds", "bass", "percussion"];

/** Build per-word note assignments from the letter so each word maps to a pitch + layer. */
export function buildNoteAssignments(): NoteAssignment[] {
  const all = LETTER_LINES.flatMap((line) => line.split(/\s+/));
  return all.map((_, i) => ({
    word: i,
    semitone: SCALE[i % SCALE.length] - 12,
    layer: LAYER_ROTATION[i % LAYER_ROTATION.length],
  }));
}

/** The single line of handwriting that returns at the climax, light-years tall. */
export const FINAL_QUESTION = "will you marry me?";

/** Settle word after "yes". */
export const FINAL_WORD = "yours.";

export const HOLDING_COPY = {
  line1: "take all the time you need.",
  line2: "i'm not going anywhere.",
  replay: "come back when you're ready",
};
