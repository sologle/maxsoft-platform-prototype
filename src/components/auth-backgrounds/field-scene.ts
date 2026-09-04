import { drawHalo, type DrawScene } from "./scene-types";
import { createWordTargets } from "./field-word";

const SPACING = 36;
const LIVING_SPACING = 30;
const MAX_MARKS = 1800;
const INFLUENCE_RADIUS = 245;
const SPRING_RATE = 13;

const ROTATION_SPEED = 0.18;
const WORD_PERIOD_SECONDS = 26;
const WORD_START_SECONDS = 6;
const WORD_MORPH_SECONDS = 2.5;
const WORD_HOLD_SECONDS = 3;
const WORD_RESPONSE = 4;

const smoothStep = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

const createFieldScene = (width: number, height: number, living: boolean): DrawScene => {
  const spacing = Math.max(living ? LIVING_SPACING : SPACING, Math.sqrt(width * height / MAX_MARKS));
  const wordHalfLength = width < 640 ? 1.3 : 2.2;
  const columns = Math.ceil(width / spacing);
  const points = Array.from({ length: columns * Math.ceil(height / spacing) }, (_, index) => {
    const homeX = (index % columns) * spacing + spacing / 2;
    const homeY = Math.floor(index / columns) * spacing + spacing / 2;
    return { homeX, homeY, x: homeX, y: homeY, angle: -Math.PI / 4, energy: 0 };
  });

  const wordTargets = living ? createWordTargets(width, height, points.length) : null;
  let idleTime = 0;
  let wordAmount = 0;
  let previousPointer = { x: 0, y: 0, active: false };

  return ({ context, delta, time, pointer, dark, motion }) => {
    const color = dark ? "108,198,238" : "26,115,166";
    const response = 1 - Math.exp(-SPRING_RATE * delta);
    const active = pointer.active && motion;
    if (living) {
      const moved = pointer.active && (!previousPointer.active || Math.hypot(pointer.x - previousPointer.x, pointer.y - previousPointer.y) > 0.5);
      idleTime = motion && !moved ? idleTime + delta : 0;
      previousPointer = { ...pointer };
      const phase = idleTime % WORD_PERIOD_SECONDS - WORD_START_SECONDS;
      const target = smoothStep(phase / WORD_MORPH_SECONDS) * (1 - smoothStep((phase - WORD_MORPH_SECONDS - WORD_HOLD_SECONDS) / WORD_MORPH_SECONDS));
      wordAmount = motion ? wordAmount + (target - wordAmount) * (1 - Math.exp(-WORD_RESPONSE * delta)) : 0;
    }
    if (active) drawHalo(context, pointer.x, pointer.y, INFLUENCE_RADIUS, color, (dark ? 0.16 : 0.1) * (1 - wordAmount));
    context.lineCap = "round";
    context.lineWidth = 1.25;
    for (const [index, point] of points.entries()) {
      // Leave a sparse ambient grid behind the word instead of emptying the backdrop.
      const word = wordTargets && index % 5 !== 0 ? wordTargets[index] : null;
      const morph = word ? wordAmount : 0;
      const dx = point.homeX - pointer.x;
      const dy = point.homeY - pointer.y;
      const distance = Math.hypot(dx, dy);
      const influence = active ? Math.max(0, 1 - distance / INFLUENCE_RADIUS) ** 2 * (1 - wordAmount) : 0;
      const angle = Math.atan2(dy, dx);
      const targetX = point.homeX + Math.cos(angle) * influence * 62 + (word ? (word.x - point.homeX) * morph : 0);
      const targetY = point.homeY + Math.sin(angle) * influence * 62 + (word ? (word.y - point.homeY) * morph : 0);
      const idleAngle = -Math.PI / 4 + (living ? time * ROTATION_SPEED + Math.sin(index * 0.7) * 0.6 : 0);
      const targetAngle = influence > 0 ? angle + Math.PI / 2 : idleAngle;
      if (!motion) {
        point.x = point.homeX;
        point.y = point.homeY;
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
      context.strokeStyle = `rgba(${color},${(dark ? 0.21 : 0.17) + point.energy * 0.7 + morph * 0.32})`;
      context.beginPath();
      context.moveTo(point.x - ux, point.y - uy);
      context.lineTo(point.x + ux, point.y + uy);
      context.stroke();
    }
  };
};

export const createField = (width: number, height: number): DrawScene => createFieldScene(width, height, false);
export const createLivingField = (width: number, height: number): DrawScene => createFieldScene(width, height, true);
