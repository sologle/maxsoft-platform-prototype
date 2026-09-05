import { drawHalo, type DrawScene } from "./scene-types";
import { createWordTargets } from "./field-word";

const LIVING_SPACING = 30;
const MAX_MARKS = 1800;
const MIN_WORDMARK_MARKS = 750;
const INFLUENCE_RADIUS = 245;
const SPRING_RATE = 13;

const ROTATION_SPEED = 0.18;
const WORD_PERIOD_SECONDS = 26;
const WORD_START_SECONDS = 6;
const WORD_MORPH_SECONDS = 2.5;
const WORD_HOLD_SECONDS = 3;
const WORD_RESPONSE = 4;
const WORDMARK_ASSEMBLY_SECONDS = 2;

const smoothStep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

const createFieldScene = (width: number, height: number, mode: "living" | "wordmark"): DrawScene => {
  const centered = mode === "wordmark";
  // Keep the standalone word readable even on a small viewport.
  const preferredSpacing = centered ? Math.min(LIVING_SPACING, Math.sqrt(width * height / MIN_WORDMARK_MARKS)) : LIVING_SPACING;
  const spacing = Math.max(preferredSpacing, Math.sqrt(width * height / MAX_MARKS));
  const wordHalfLength = width < 640 ? 1.3 : 2.2;
  const columns = Math.ceil(width / spacing);
  const points = Array.from({ length: columns * Math.ceil(height / spacing) }, (_, index) => {
    const homeX = (index % columns) * spacing + spacing / 2;
    const homeY = Math.floor(index / columns) * spacing + spacing / 2;
    return { homeX, homeY, x: homeX, y: homeY, angle: -Math.PI / 4, energy: 0 };
  });

  const wordTargets = createWordTargets(width, centered ? height / 2 : Math.min(height * 0.2, 210), points.length);
  let startedAt: number | null = null;
  let idleTime = 0;
  let wordAmount = 0;
  let previousPointer = { x: 0, y: 0, active: false };

  return ({ context, delta, time, pointer, dark, motion }) => {
    const color = dark ? "108,198,238" : "26,115,166";
    const response = 1 - Math.exp(-SPRING_RATE * delta);
    const active = pointer.active && motion;
    startedAt ??= time;
    const moved = pointer.active && (!previousPointer.active || Math.hypot(pointer.x - previousPointer.x, pointer.y - previousPointer.y) > 0.5);
    idleTime = motion && !moved ? idleTime + delta : 0;
    previousPointer = { ...pointer };
    const phase = idleTime % WORD_PERIOD_SECONDS - WORD_START_SECONDS;
    const target = smoothStep(phase / WORD_MORPH_SECONDS) * (1 - smoothStep((phase - WORD_MORPH_SECONDS - WORD_HOLD_SECONDS) / WORD_MORPH_SECONDS));
    wordAmount = centered
      ? motion ? smoothStep((time - startedAt) / WORDMARK_ASSEMBLY_SECONDS) : 1
      : motion ? wordAmount + (target - wordAmount) * (1 - Math.exp(-WORD_RESPONSE * delta)) : 0;
    const pointerStrength = centered ? 0.65 : 1 - wordAmount;
    if (active) drawHalo(context, pointer.x, pointer.y, INFLUENCE_RADIUS, color, (dark ? 0.16 : 0.1) * pointerStrength);
    context.lineCap = "round";
    for (const [index, point] of points.entries()) {
      // Leave a sparse ambient grid behind the word instead of emptying the backdrop.
      const word = index % 5 !== 0 ? wordTargets[index] : null;
      const morph = word ? wordAmount : 0;
      // In the centered composition, each letter fragment reacts at its place in the word.
      const anchorX = point.homeX + (centered && word ? (word.x - point.homeX) * morph : 0);
      const anchorY = point.homeY + (centered && word ? (word.y - point.homeY) * morph : 0);
      const dx = anchorX - pointer.x;
      const dy = anchorY - pointer.y;
      const distance = Math.hypot(dx, dy);
      const influence = active ? Math.max(0, 1 - distance / INFLUENCE_RADIUS) ** 2 * pointerStrength : 0;
      const angle = Math.atan2(dy, dx);
      const targetX = point.homeX + Math.cos(angle) * influence * 62 + (word ? (word.x - point.homeX) * morph : 0);
      const targetY = point.homeY + Math.sin(angle) * influence * 62 + (word ? (word.y - point.homeY) * morph : 0);
      const idleAngle = -Math.PI / 4 + (time * ROTATION_SPEED + Math.sin(index * 0.7) * 0.6);
      const targetAngle = influence > 0 ? angle + Math.PI / 2 : idleAngle;
      if (!motion) {
        point.x = anchorX;
        point.y = anchorY;
        point.angle = -Math.PI / 4;
        point.energy = 0;
      } else {
        point.x += (targetX - point.x) * response;
        point.y += (targetY - point.y) * response;
        // Wrap the angle so adjacent elements take the short turn toward the cursor.
        const turn = Math.atan2(Math.sin(targetAngle - point.angle), Math.cos(targetAngle - point.angle));
        point.angle += turn * response;
        point.energy += (influence - point.energy) * response;
      }
      const halfLength = 3 + point.energy * 11 - morph * (3 - wordHalfLength);
      const ux = Math.cos(point.angle) * halfLength;
      const uy = Math.sin(point.angle) * halfLength;
      context.lineWidth = 1.25 + (centered ? morph * 0.85 : 0);
      context.strokeStyle = `rgba(${color},${(dark ? 0.21 : 0.17) + point.energy * 0.7 + morph * (centered ? 0.48 : 0.32)})`;
      context.beginPath();
      context.moveTo(point.x - ux, point.y - uy);
      context.lineTo(point.x + ux, point.y + uy);
      context.stroke();
    }
  };
};

export const createLivingField = (width: number, height: number): DrawScene => createFieldScene(width, height, "living");
export const createWordmarkField = (width: number, height: number): DrawScene => createFieldScene(width, height, "wordmark");
