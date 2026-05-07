export type Movement = "opening" | "lift" | "galaxy" | "conductor" | "crescendo" | "coda" | "moment";

export type Answer = "yes" | "moment";

export interface MemoryStar {
  id: string;
  /** Position in galaxy space (units roughly correspond to scene units). */
  position: [number, number, number];
  /** Voice clip id (must exist in voiceClips registry). */
  voiceId: string;
  /** Optional caption that floats near the star when approached. */
  caption?: string;
  /** RGB color of the bloom when this star is touched. */
  color: [number, number, number];
}

export interface NoteAssignment {
  /** Which word index this note maps to. */
  word: number;
  /** A pitch in semitones relative to A3. Used by the cursor-as-instrument. */
  semitone: number;
  /** Sustain layer to bring in when this word is played. */
  layer: ScoreLayer;
}

export type ScoreLayer = "strings" | "piano" | "choir" | "percussion" | "bass" | "winds";

export interface GestureSample {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  /** EMA-smoothed speed in [0, 1]. */
  energy: number;
  t: number;
}

export type TelemetryEventName =
  | "session_start"
  | "movement_enter"
  | "word_played"
  | "memory_visited"
  | "decision_started"
  | "decision_made"
  | "replay"
  | "session_end";
