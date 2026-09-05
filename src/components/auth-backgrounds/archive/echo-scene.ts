import { drawHalo, TAU, type DrawScene } from "../scene-types";

const DOT_SPACING = 34;
const MAX_DOTS = 1000;
const MAX_WAVES = 7;
const WAVE_SPEED = 185;
const WAVE_LIFETIME = 3.8;
const WAVE_WIDTH = 52;
const EMIT_INTERVAL = 0.24;
const EMIT_DISTANCE = 48;
const AMBIENT_INTERVAL = 3.2;

export const createEcho = (width: number, height: number): DrawScene => {
  const spacing = Math.max(DOT_SPACING, Math.sqrt(width * height / MAX_DOTS));
  const columns = Math.ceil(width / spacing);
  const dots = Array.from({ length: columns * Math.ceil(height / spacing) }, (_, index) => {
    const row = Math.floor(index / columns);
    return { x: (index % columns) * spacing + (row % 2 ? spacing / 2 : 0), y: row * spacing + spacing / 2 };
  });
  const initial = { x: width * 0.73, y: height * 0.27, started: -1.2 };
  let waves = [initial];
  let lastEmit = -EMIT_INTERVAL;
  let lastAmbient = 0;
  let lastSource = { x: 0, y: 0 };
  let entered = false;
  let ambientIndex = 0;

  let startedAt: number | null = null;

  return ({ context, time: elapsed, pointer, dark, motion }) => {
    // A resize creates a fresh scene while the canvas clock keeps running.
    startedAt ??= elapsed;
    const time = elapsed - startedAt;
    const active = pointer.active && motion;
    const ink = dark ? "113,205,243" : "26,121,176";
    const now = motion ? time : 0;
    if (!motion) { waves = [initial]; entered = false; lastEmit = -EMIT_INTERVAL; lastAmbient = time; }
    if (active && time - lastEmit >= EMIT_INTERVAL && (!entered || Math.hypot(pointer.x - lastSource.x, pointer.y - lastSource.y) >= EMIT_DISTANCE)) {
      waves.push({ x: pointer.x, y: pointer.y, started: time });
      lastSource = { ...pointer };
      lastEmit = time;
      lastAmbient = time;
    }
    entered = active;
    if (motion && time - lastAmbient >= AMBIENT_INTERVAL) {
      ambientIndex++;
      waves.push({ x: width * (ambientIndex % 2 ? 0.22 : 0.78), y: height * (ambientIndex % 2 ? 0.68 : 0.24), started: time });
      lastAmbient = time;
    }
    waves = waves.filter((wave) => now - wave.started < WAVE_LIFETIME).slice(-MAX_WAVES);
    if (active) drawHalo(context, pointer.x, pointer.y, 160, ink, dark ? 0.11 : 0.05);
    for (const dot of dots) {
      let displacement = 0;
      for (const wave of waves) {
        const distance = Math.hypot(dot.x - wave.x, dot.y - wave.y);
        const offset = (distance - (now - wave.started) * WAVE_SPEED) / WAVE_WIDTH;
        if (Math.abs(offset) > 3) continue;
        const fade = 1 - (now - wave.started) / WAVE_LIFETIME;
        displacement += Math.cos(offset * 2.1) * Math.exp(-offset * offset) * fade;
      }
      const energy = Math.min(1, Math.abs(displacement));
      context.fillStyle = `rgba(${ink},${(dark ? 0.22 : 0.14) + energy * 0.6})`;
      context.beginPath();
      context.arc(dot.x, dot.y - displacement * 19, 1 + energy * 2, 0, TAU);
      context.fill();
    }
    context.lineWidth = 0.8;
    for (const wave of waves) {
      const age = now - wave.started;
      const fade = Math.max(0, 1 - age / WAVE_LIFETIME);
      context.strokeStyle = `rgba(${ink},${fade * (dark ? 0.2 : 0.13)})`;
      context.beginPath();
      context.arc(wave.x, wave.y, Math.max(0, age * WAVE_SPEED), 0, TAU);
      context.stroke();
    }
  };
};
