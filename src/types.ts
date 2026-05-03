export type ActId = "threshold" | "pulse" | "memories" | "crossfade" | "answer" | "holding";

export type Answer = "yes" | "moment";

export type ScriptEntryKind = "word" | "cluster" | "voice" | "silence";

export interface ScriptEntry {
  id: string;
  kind: ScriptEntryKind;
  beats: number;
  text?: string;
  voiceClip?: string;
}

export interface BeatEvent {
  index: number;
  audioTime: number;
  performanceTime: number;
  bpm: number;
}

export type TelemetryEventName =
  | "session_start"
  | "act_enter"
  | "act_complete"
  | "voice_played"
  | "pause_detected"
  | "resume"
  | "question_shown"
  | "decision_started"
  | "decision_made"
  | "replay"
  | "session_end";

export interface TelemetryEvent {
  name: TelemetryEventName;
  at: number;
  payload?: Record<string, string | number | boolean | null>;
}
