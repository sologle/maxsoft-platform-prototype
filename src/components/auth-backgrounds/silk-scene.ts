import { drawHalo, TAU, type DrawScene } from "./scene-types";

const MAX_COLUMNS = 48;
const MAX_ROWS = 44;
const THREAD_SPACING = 27;
const GRAB_RADIUS = 260;
const SPRING = 38;
const DAMPING = 7;

export const createSilk = (width: number, height: number): DrawScene => {
  const columns = Math.min(MAX_COLUMNS, Math.ceil(width / 30)) + 1;
  const rows = Math.min(MAX_ROWS, Math.ceil(height / THREAD_SPACING)) + 5;
  const threads = Array.from({ length: rows }, (_, row) => Array.from({ length: columns }, (_, column) => {
    const homeX = column / (columns - 1) * (width + 80) - 40;
    const phase = column / (columns - 1) * TAU * 0.8 + row * 0.085;
    const homeY = row / (rows - 1) * (height + 220) - 110 + Math.sin(phase) * 70;
    return { homeX, homeY, phase, x: homeX, y: homeY, vx: 0, vy: 0 };
  }));

  return ({ context, delta, time, pointer, dark, motion }) => {
    const active = pointer.active && motion;
    const ink = dark ? "119,199,231" : "39,124,169";
    if (active) drawHalo(context, pointer.x, pointer.y, GRAB_RADIUS, ink, dark ? 0.1 : 0.045);
    for (const thread of threads) {
      for (const point of thread) {
        if (!motion) { point.x = point.homeX; point.y = point.homeY; point.vx = 0; point.vy = 0; continue; }
        const dx = pointer.x - point.homeX;
        const dy = pointer.y - point.homeY;
        const pull = active ? Math.max(0, 1 - Math.hypot(dx, dy) / GRAB_RADIUS) ** 2 : 0;
        const targetX = point.homeX + dx * pull * 0.85;
        const targetY = point.homeY + dy * pull * 0.85 + (Math.sin(time * 0.48 + point.phase) - Math.sin(point.phase)) * 22;
        // An underdamped spring lets the fabric settle with a small elastic overshoot.
        point.vx += ((targetX - point.x) * SPRING - point.vx * DAMPING) * delta;
        point.vy += ((targetY - point.y) * SPRING - point.vy * DAMPING) * delta;
        point.x += point.vx * delta;
        point.y += point.vy * delta;
      }
    }
    context.lineWidth = 0.85;
    for (let row = 0; row < threads.length; row++) {
      const thread = threads[row];
      context.strokeStyle = `rgba(${row % 4 === 0 ? (dark ? "91,218,220" : "27,154,169") : ink},${dark ? 0.27 : 0.19})`;
      context.beginPath();
      context.moveTo(thread[0].x, thread[0].y);
      for (let column = 1; column < thread.length - 1; column++) {
        const point = thread[column];
        const next = thread[column + 1];
        context.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
      }
      const end = thread[thread.length - 1];
      context.lineTo(end.x, end.y);
      context.stroke();
    }
    context.strokeStyle = `rgba(${ink},${dark ? 0.085 : 0.055})`;
    context.lineWidth = 0.6;
    context.beginPath();
    for (let column = 1; column < columns; column += 3) {
      context.moveTo(threads[0][column].x, threads[0][column].y);
      for (let row = 1; row < rows; row++) context.lineTo(threads[row][column].x, threads[row][column].y);
    }
    context.stroke();
  };
};
