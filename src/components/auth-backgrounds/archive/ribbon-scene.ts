import { drawHalo, TAU, type DrawScene } from "../scene-types";

const TRAIL_SECONDS = 2.8;
const MAX_TRAIL_POINTS = 130;
const SAMPLE_INTERVAL = 1 / 45;
const IDLE_DELAY = 1.8;
const SPRING = 25;
const DAMPING = 8;
const BANDS = 8;

export const createRibbon = (width: number, height: number): DrawScene => {
  const orbit = (time: number, phase: number) => ({
    x: width * (0.5 + Math.sin(time * 0.48 + phase) * 0.4),
    y: height * (0.5 + Math.sin(time * 0.64 + phase * 1.6) * 0.34),
  });
  const strands = ["42,133,207", "29,173,185", "119,139,205"].map((ink, index) => {
    const phase = index * 2.1;
    const head = orbit(0, phase);
    const rest = Array.from({ length: MAX_TRAIL_POINTS }, (_, index) => {
      const time = (index / (MAX_TRAIL_POINTS - 1) - 1) * TRAIL_SECONDS;
      return { ...orbit(time, phase), time };
    });
    return { ink, phase, x: head.x, y: head.y, vx: 0, vy: 0, rest, trail: [...rest] };
  });
  let lastSample = 0;
  let lastMove = -IDLE_DELAY;
  let previousPointer = { x: 0, y: 0, active: false };

  let startedAt: number | null = null;

  return ({ context, time: elapsed, delta, pointer, dark, motion }) => {
    // A resize creates a fresh scene while the canvas clock keeps running.
    startedAt ??= elapsed;
    const time = elapsed - startedAt;
    if (pointer.active && (!previousPointer.active || Math.hypot(pointer.x - previousPointer.x, pointer.y - previousPointer.y) > 0.5)) lastMove = time;
    previousPointer = { ...pointer };
    const active = motion && pointer.active && time - lastMove < IDLE_DELAY;
    const sample = time - lastSample >= SAMPLE_INTERVAL;
    context.lineCap = "round";
    context.lineJoin = "round";
    for (const strand of strands) {
      if (motion) {
        const drift = orbit(time, strand.phase);
        const targetX = active ? pointer.x + Math.cos(time * 1.3 + strand.phase) * 24 : drift.x;
        const targetY = active ? pointer.y + Math.sin(time * 1.1 + strand.phase) * 24 : drift.y;
        strand.vx += ((targetX - strand.x) * SPRING - strand.vx * DAMPING) * delta;
        strand.vy += ((targetY - strand.y) * SPRING - strand.vy * DAMPING) * delta;
        strand.x += strand.vx * delta;
        strand.y += strand.vy * delta;
        if (sample) strand.trail.push({ x: strand.x, y: strand.y, time });
        while (strand.trail.length > MAX_TRAIL_POINTS || (strand.trail.length > 1 && time - strand.trail[0].time > TRAIL_SECONDS)) strand.trail.shift();
      }
      const trail = motion ? strand.trail : strand.rest;
      for (let band = 0; band < BANDS; band++) {
        const first = Math.floor(band / BANDS * (trail.length - 1));
        const last = Math.floor((band + 1) / BANDS * (trail.length - 1));
        if (last <= first) continue;
        const strength = (band + 1) / BANDS;
        context.beginPath();
        context.moveTo(trail[first].x, trail[first].y);
        for (let index = first; index < last; index++) {
          const point = trail[index];
          const next = trail[index + 1];
          context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
        }
        context.lineTo(trail[last].x, trail[last].y);
        context.lineWidth = 3 + strength * 9;
        context.strokeStyle = `rgba(${strand.ink},${strength * (dark ? 0.095 : 0.035)})`;
        context.stroke();
        context.lineWidth = 0.6 + strength * 2.4;
        context.strokeStyle = `rgba(${strand.ink},${strength * (dark ? 0.75 : 0.43)})`;
        context.stroke();
      }
      const head = motion ? strand : strand.rest[strand.rest.length - 1];
      drawHalo(context, head.x, head.y, 90, strand.ink, dark ? 0.1 : 0.04);
      context.fillStyle = `rgba(${strand.ink},${dark ? 0.9 : 0.6})`;
      context.beginPath();
      context.arc(head.x, head.y, 2, 0, TAU);
      context.fill();
    }
    if (sample) lastSample = time;
  };
};
