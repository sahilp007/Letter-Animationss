import { useCallback, useEffect, useRef, useState } from "react";
import type { Movement } from "../types";

interface TimelineState {
  movement: Movement;
  /** Seconds since the current movement entered. */
  elapsed: number;
  /** 0..1 progress through the current movement (only meaningful for timed movements). */
  progress: number;
}

/**
 * Master timeline. Each movement has a target duration; the timeline ticks elapsed time and
 * exposes progress. Movements can opt out of auto-advance (set duration to Infinity) — useful
 * for the open-ended exploration in Movement III.
 */
export function useTimeline(initial: Movement = "opening") {
  const [state, setState] = useState<TimelineState>({ movement: initial, elapsed: 0, progress: 0 });
  const enteredAt = useRef(performance.now());

  const enter = useCallback((next: Movement) => {
    enteredAt.current = performance.now();
    setState({ movement: next, elapsed: 0, progress: 0 });
  }, []);

  useEffect(() => {
    let raf = 0;
    const durations: Record<Movement, number> = {
      opening: 50,
      lift: 32,
      galaxy: 55,
      conductor: 110,
      crescendo: 70,
      coda: 60,
      moment: Infinity,
    };
    const loop = () => {
      const dur = durations[state.movement];
      const elapsed = (performance.now() - enteredAt.current) / 1000;
      const progress = dur === Infinity ? 0 : Math.min(1, elapsed / dur);
      setState((s) => (s.elapsed === elapsed ? s : { ...s, elapsed, progress }));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [state.movement]);

  return { state, enter };
}
