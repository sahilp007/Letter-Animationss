/**
 * The script — every word and silence in the experience, in order, by beat.
 * Replace the placeholder strings with your real moments before the proposal.
 *
 * Notation:
 *   { kind: "word", text: "...", beats: 1 }  → one word lasting one beat
 *   { kind: "cluster", text: "...", beats: N } → a short phrase shown for N beats
 *   { kind: "silence", beats: N }              → a pause of N beats with no text
 *   { kind: "voice", voiceClip: "v01", beats: N } → play a voice clip across N beats
 */

import type { ScriptEntry } from "../types";

export const ACT1_WARMUP_BEATS = 4;

export const ACT1_SCRIPT: ScriptEntry[] = [
  { id: "a1-w1", kind: "word", text: "i.", beats: 1 },
  { id: "a1-w2", kind: "word", text: "have.", beats: 1 },
  { id: "a1-w3", kind: "word", text: "been.", beats: 1 },
  { id: "a1-w4", kind: "word", text: "thinking.", beats: 1 },
  { id: "a1-s1", kind: "silence", beats: 2 },
  { id: "a1-w5", kind: "word", text: "about", beats: 1 },
  { id: "a1-w6", kind: "word", text: "you.", beats: 1 },
  { id: "a1-s2", kind: "silence", beats: 3 },
  { id: "a1-w7", kind: "word", text: "about", beats: 1 },
  { id: "a1-w8", kind: "word", text: "us.", beats: 1 },
  { id: "a1-s3", kind: "silence", beats: 3 },
];

export const ACT2_SCRIPT: ScriptEntry[] = [
  { id: "a2-c1", kind: "cluster", text: "the first time.", beats: 4 },
  { id: "a2-c2", kind: "cluster", text: "the rain. your laugh.", beats: 5 },
  { id: "a2-v1", kind: "voice", voiceClip: "v01", beats: 6 },
  { id: "a2-s1", kind: "silence", beats: 2 },

  { id: "a2-c3", kind: "cluster", text: "march. the bridge.", beats: 4 },
  { id: "a2-c4", kind: "cluster", text: "you were laughing at me.", beats: 5 },
  { id: "a2-v2", kind: "voice", voiceClip: "v02", beats: 6 },
  { id: "a2-s2", kind: "silence", beats: 2 },

  { id: "a2-c5", kind: "cluster", text: "the kitchen at 2am.", beats: 4 },
  { id: "a2-c6", kind: "cluster", text: "neither of us sleeping.", beats: 5 },
  { id: "a2-v3", kind: "voice", voiceClip: "v03", beats: 6 },
  { id: "a2-s3", kind: "silence", beats: 2 },

  { id: "a2-c7", kind: "cluster", text: "august. the pier.", beats: 4 },
  { id: "a2-c8", kind: "cluster", text: "the sky was orange.", beats: 5 },
  { id: "a2-v4", kind: "voice", voiceClip: "v04", beats: 6 },
  { id: "a2-s4", kind: "silence", beats: 2 },

  { id: "a2-c9", kind: "cluster", text: "every quiet sunday.", beats: 4 },
  { id: "a2-c10", kind: "cluster", text: "every coffee. every walk.", beats: 5 },
  { id: "a2-v5", kind: "voice", voiceClip: "v05", beats: 6 },
  { id: "a2-s5", kind: "silence", beats: 3 },
];

export const ACT3_BUILDUP_SCRIPT: ScriptEntry[] = [
  { id: "a3-c1", kind: "cluster", text: "and the truth is —", beats: 6 },
  { id: "a3-s1", kind: "silence", beats: 2 },
  { id: "a3-c2", kind: "cluster", text: "i don't want a single day", beats: 6 },
  { id: "a3-c3", kind: "cluster", text: "without you in it.", beats: 6 },
  { id: "a3-s2", kind: "silence", beats: 4 },
];

export const ACT3_QUESTION: ScriptEntry[] = [
  { id: "q1", kind: "word", text: "will", beats: 2 },
  { id: "q2", kind: "word", text: "you", beats: 2 },
  { id: "q3", kind: "word", text: "marry", beats: 2 },
  { id: "q4", kind: "word", text: "me?", beats: 4 },
];

/** A single warm closing word shown after "Yes". Customize before shipping. */
export const FINAL_WORD = "yours.";

/** Copy shown on the "I need a moment" path. */
export const HOLDING_COPY = {
  line1: "take all the time you need.",
  line2: "i'm not going anywhere.",
  replay: "come back when you're ready",
};
