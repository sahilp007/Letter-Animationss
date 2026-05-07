import type { MemoryStar } from "../types";

/**
 * Memory stars she discovers in Movement III.
 * Position in galaxy space — radius ~30 units, distributed in a rough sphere.
 * Replace voice clip ids with your real recordings (placed in /public/audio/).
 */
export const MEMORIES: MemoryStar[] = [
  {
    id: "first",
    position: [-18, 6, -12],
    voiceId: "v01",
    caption: "the first time.",
    color: [1.0, 0.78, 0.55],
  },
  {
    id: "rain",
    position: [22, -4, -8],
    voiceId: "v02",
    caption: "rain. your laugh.",
    color: [1.0, 0.65, 0.42],
  },
  {
    id: "kitchen",
    position: [-8, -14, 16],
    voiceId: "v03",
    caption: "the kitchen at 2am.",
    color: [0.95, 0.58, 0.32],
  },
  {
    id: "pier",
    position: [14, 12, 14],
    voiceId: "v04",
    caption: "august. the pier.",
    color: [1.0, 0.85, 0.6],
  },
  {
    id: "sundays",
    position: [-22, -8, -4],
    voiceId: "v05",
    caption: "every quiet sunday.",
    color: [0.92, 0.75, 0.95],
  },
  {
    id: "knew",
    position: [4, 18, -18],
    voiceId: "v06",
    caption: "when i knew.",
    color: [0.7, 0.85, 1.0],
  },
];
