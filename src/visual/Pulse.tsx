import { useEffect, useRef } from "react";
import { heartbeat } from "../audio/HeartbeatScheduler";
import { renderPulse, lerpColor, PALETTE, type PulseFrame } from "./pulseRender";
import type { ActId } from "../types";

interface Props {
  act: ActId;
  /** 0..1 — progress within the current act, used to interpolate palette. */
  progress: number;
  /** When true the pulse stops growing/decaying (used for the suspended moment after the question). */
  frozen?: boolean;
}

interface Stage {
  bg: [number, number, number];
  core: [number, number, number];
  glow: [number, number, number];
  bloom: number;
}

function stageFor(act: ActId, progress: number): Stage {
  const p = Math.max(0, Math.min(1, progress));
  switch (act) {
    case "threshold":
      return { bg: PALETTE.black, core: [40, 30, 25], glow: [40, 30, 25], bloom: 0 };
    case "pulse":
      return {
        bg: PALETTE.black,
        core: lerpColor([180, 100, 70], [200, 130, 90], p),
        glow: lerpColor([120, 60, 40], [160, 90, 60], p),
        bloom: 0.05,
      };
    case "memories": {
      const bg = p < 0.5 ? lerpColor(PALETTE.black, PALETTE.plum, p * 2) : lerpColor(PALETTE.plum, PALETTE.umber, (p - 0.5) * 2);
      return {
        bg,
        core: lerpColor([200, 130, 90], PALETTE.ember, p),
        glow: lerpColor([160, 90, 60], PALETTE.gold, p),
        bloom: 0.05 + p * 0.1,
      };
    }
    case "crossfade": {
      const bg = lerpColor(PALETTE.umber, PALETTE.gold, p);
      return {
        bg,
        core: lerpColor(PALETTE.ember, PALETTE.warmWhite, p),
        glow: lerpColor(PALETTE.gold, PALETTE.warmWhite, p),
        bloom: 0.15 + p * 0.65,
      };
    }
    case "answer":
      return { bg: PALETTE.gold, core: PALETTE.warmWhite, glow: PALETTE.warmWhite, bloom: 0.85 };
    case "holding":
      return { bg: PALETTE.umber, core: PALETTE.ember, glow: PALETTE.gold, bloom: 0.5 };
    default:
      return { bg: PALETTE.black, core: [0, 0, 0], glow: [0, 0, 0], bloom: 0 };
  }
}

export function Pulse({ act, progress, frozen }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const amplitudeRef = useRef(0);
  const lastBeatAtRef = useRef(0);
  const lastBpmRef = useRef(50);
  const stageRef = useRef<Stage>(stageFor(act, progress));
  const targetStageRef = useRef<Stage>(stageFor(act, progress));

  useEffect(() => {
    targetStageRef.current = stageFor(act, progress);
  }, [act, progress]);

  useEffect(() => {
    const unsub = heartbeat.on((event) => {
      lastBeatAtRef.current = event.performanceTime;
      lastBpmRef.current = event.bpm;
      amplitudeRef.current = 1;
    });
    return unsub;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = (t: number) => {
      const cur = stageRef.current;
      const tgt = targetStageRef.current;
      const k = 0.04;
      cur.bg = [cur.bg[0] + (tgt.bg[0] - cur.bg[0]) * k, cur.bg[1] + (tgt.bg[1] - cur.bg[1]) * k, cur.bg[2] + (tgt.bg[2] - cur.bg[2]) * k];
      cur.core = [cur.core[0] + (tgt.core[0] - cur.core[0]) * k, cur.core[1] + (tgt.core[1] - cur.core[1]) * k, cur.core[2] + (tgt.core[2] - cur.core[2]) * k];
      cur.glow = [cur.glow[0] + (tgt.glow[0] - cur.glow[0]) * k, cur.glow[1] + (tgt.glow[1] - cur.glow[1]) * k, cur.glow[2] + (tgt.glow[2] - cur.glow[2]) * k];
      cur.bloom = cur.bloom + (tgt.bloom - cur.bloom) * k;

      if (!frozen) {
        const beatDuration = 60_000 / Math.max(30, lastBpmRef.current);
        const sinceBeat = t - lastBeatAtRef.current;
        const decayTime = beatDuration * 0.6;
        const decay = sinceBeat > 0 ? Math.max(0, 1 - sinceBeat / decayTime) : 0;
        amplitudeRef.current = Math.max(decay, 0);
      }

      const frame: PulseFrame = {
        amplitude: amplitudeRef.current,
        coreColor: [cur.core[0] | 0, cur.core[1] | 0, cur.core[2] | 0],
        glowColor: [cur.glow[0] | 0, cur.glow[1] | 0, cur.glow[2] | 0],
        bgColor: [cur.bg[0] | 0, cur.bg[1] | 0, cur.bg[2] | 0],
        bloom: cur.bloom,
      };
      renderPulse(ctx, frame, t / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [frozen]);

  return <canvas ref={canvasRef} className="pulse-canvas" aria-hidden />;
}
