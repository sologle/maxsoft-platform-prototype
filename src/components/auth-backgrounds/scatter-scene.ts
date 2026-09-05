import type { ScatterSettings } from "./scatter-preset";
import { createWordTargets } from "./field-word";
import { drawHalo, type DrawScene } from "./scene-types";

const MAX_MARKS = 1800;
const MIN_MARKS = 750;
const ASSEMBLY_SECONDS = 0.9;
const MAX_SPEED = 1100;
const BRUSH_TRAVEL = 26;
const ORBIT_EDGE_RATIO = 0.7;
const ORBIT_ANGLE_RESPONSE = 10;
const ORBIT_BAND_SPREAD = 0.16;

export const createScatterWordmark = (width: number, height: number, readSettings: () => ScatterSettings): DrawScene => {
  const spacing = Math.max(Math.min(30, Math.sqrt(width * height / MIN_MARKS)), Math.sqrt(width * height / MAX_MARKS));
  const columns = Math.ceil(width / spacing);
  const count = columns * Math.ceil(height / spacing);
  const targets = createWordTargets(width, height / 2, count);
  const baseRadius = Math.min(165, Math.max(75, width * 0.15));
  const wordHalfLength = width < 640 ? 1.3 : 2.2;
  const strokeScale = width < 640 ? 2 / 3 : 1;
  let wordIndex = 0;
  const points = Array.from({ length: count }, (_, index) => ({
    index,
    homeX: (index % columns) * spacing + spacing / 2,
    homeY: Math.floor(index / columns) * spacing + spacing / 2,
    word: index % 5 !== 0 ? targets[index] : null,
    variation: Math.sin(index * 2.4) * 0.35,
    orbitLane: (Math.sin(index * 1.7) + Math.cos(index * 0.7)) * ORBIT_BAND_SPREAD / 2,
    x: 0, y: 0, vx: 0, vy: 0, spin: 0, spinVelocity: 0, orbit: 0, angle: -Math.PI / 4,
  })).filter((point) => {
    if (width >= 640 || !point.word) return true;
    // Omit every fifth word fragment on phones, including its physics work.
    wordIndex += 1;
    return wordIndex % 5 !== 0;
  });
  const previous = { x: 0, y: 0, active: false };
  let startedAt: number | null = null;
  let glow = 0;

  return ({ context, delta, time, pointer, dark, motion }) => {
    const settings = readSettings();
    const radius = baseRadius * settings.radius;
    startedAt ??= time;
    const progress = motion ? Math.min(1, Math.max(0, (time - startedAt) / ASSEMBLY_SECONDS)) : 1;
    const assembly = progress * progress * (3 - 2 * progress);
    const active = motion && pointer.active;
    const fromX = previous.active ? previous.x : pointer.x;
    const fromY = previous.active ? previous.y : pointer.y;
    const moveX = pointer.x - fromX;
    const moveY = pointer.y - fromY;
    const travel = active ? Math.hypot(moveX, moveY) : 0;
    const arrival = active && !previous.active;
    // A swept brush catches fragments between pointer samples, including a fast flick.
    const brush = active && delta > 0 && (travel > 0.1 || arrival);
    const flowX = travel > 0 ? moveX / travel : 0;
    const flowY = travel > 0 ? moveY / travel : 0;
    const impulse = brush ? (180 + Math.min(travel / delta, 1800) * 0.55) * (1 - Math.exp(-(arrival ? 12 : travel) / BRUSH_TRAVEL)) : 0;
    const damping = Math.exp(-settings.damping * delta);
    glow = motion ? glow + ((active ? settings.orbitStrength * 0.4 + (brush ? 0.6 : 0) : 0) - glow) * (1 - Math.exp(-6 * delta)) : 0;
    const color = dark ? "108,198,238" : "26,115,166";
    if (active && glow > 0.005) drawHalo(context, pointer.x, pointer.y, radius * 1.35, color, glow * (dark ? 0.12 : 0.07));
    context.lineCap = "round";

    for (const point of points) {
      const { index } = point;
      const mobility = 1 + point.variation * settings.variation;
      const morph = point.word ? assembly : 0;
      const anchorX = point.homeX + (point.word ? (point.word.x - point.homeX) * morph : 0);
      const anchorY = point.homeY + (point.word ? (point.word.y - point.homeY) * morph : 0);
      const anchorDx = anchorX - pointer.x;
      const anchorDy = anchorY - pointer.y;
      const anchorDistance = Math.hypot(anchorDx, anchorDy);
      const nx = anchorDistance > 0.1 ? anchorDx / anchorDistance : Math.cos(index * 2.4);
      const ny = anchorDistance > 0.1 ? anchorDy / anchorDistance : Math.sin(index * 2.4);
      const edge = Math.max(0, Math.min(1, (anchorDistance - settings.orbitRadius) / (settings.orbitRadius * ORBIT_EDGE_RATIO)));
      const orbit = active ? settings.orbitStrength * (1 - edge * edge * (3 - 2 * edge)) : 0;
      // A narrow band keeps separate dashes visible instead of stacking them into a solid outline.
      const orbitDistance = settings.orbitRadius * (1 + point.orbitLane);
      const orbitX = nx * (orbitDistance - anchorDistance) * orbit;
      const orbitY = ny * (orbitDistance - anchorDistance) * orbit;
      point.orbit = motion ? point.orbit + (orbit - point.orbit) * (1 - Math.exp(-ORBIT_ANGLE_RESPONSE * delta)) : 0;
      if (!motion) {
        point.x = point.y = point.vx = point.vy = point.spin = point.spinVelocity = 0;
      } else {
        if (brush) {
          const px = anchorX + point.x;
          const py = anchorY + point.y;
          const projection = travel > 0 ? Math.max(0, Math.min(1, ((px - fromX) * moveX + (py - fromY) * moveY) / (travel * travel))) : 0;
          const dx = px - (fromX + moveX * projection);
          const dy = py - (fromY + moveY * projection);
          const distance = Math.hypot(dx, dy);
          if (distance < radius) {
            const strength = impulse * settings.force * mobility * (1 - distance / radius) ** 2;
            const nx = distance > 0.1 ? dx / distance : Math.cos(index * 2.4);
            const ny = distance > 0.1 ? dy / distance : Math.sin(index * 2.4);
            const curl = Math.sin(index * 1.7) * 0.25;
            point.vx += (nx + flowX * 0.35 - ny * curl) * strength;
            point.vy += (ny + flowY * 0.35 + nx * curl) * strength;
            point.spinVelocity += (nx * flowY - ny * flowX + curl) * strength * 0.045 * settings.spin;
          }
        }
        // The resting target is the cursor ring nearby, and the original letter when the cursor leaves.
        point.vx = (point.vx - (point.x - orbitX) * settings.spring * delta) * damping;
        point.vy = (point.vy - (point.y - orbitY) * settings.spring * delta) * damping;
        const speed = Math.hypot(point.vx, point.vy);
        const speedLimit = MAX_SPEED * mobility * Math.max(1, settings.force);
        if (speed > speedLimit) {
          point.vx *= speedLimit / speed;
          point.vy *= speedLimit / speed;
        }
        point.x += point.vx * delta;
        point.y += point.vy * delta;
        point.spinVelocity = Math.max(-18, Math.min(18, (point.spinVelocity - point.spin * 10 * delta) * damping));
        point.spin += point.spinVelocity * delta;
      }
      const speed = Math.hypot(point.vx, point.vy);
      const energy = Math.min(1, speed / 700);
      const idleAngle = -Math.PI / 4 + (motion ? time * 0.18 + Math.sin(index * 0.7) * 0.6 : 0);
      const tangent = Math.atan2(anchorY + point.y - pointer.y, anchorX + point.x - pointer.x) + Math.PI / 2;
      const targetAngle = point.orbit > 0.01 ? tangent : idleAngle;
      const turn = Math.atan2(Math.sin(targetAngle - point.angle), Math.cos(targetAngle - point.angle));
      point.angle = motion ? point.angle + turn * (1 - Math.exp(-ORBIT_ANGLE_RESPONSE * delta)) : -Math.PI / 4;
      const angle = point.angle + point.spin;
      const halfLength = 3 + (wordHalfLength - 3) * morph + energy * 5 + point.orbit * 2;
      const x = anchorX + point.x;
      const y = anchorY + point.y;
      context.lineWidth = (1.25 + morph * 0.55) * strokeScale;
      if (energy > 0.12 && settings.trail > 0) {
        context.strokeStyle = `rgba(${color},${energy * 0.13})`;
        context.beginPath();
        context.moveTo(x - point.vx * 0.035 * settings.trail, y - point.vy * 0.035 * settings.trail);
        context.lineTo(x, y);
        context.stroke();
      }
      context.strokeStyle = `rgba(${color},${(dark ? 0.21 : 0.17) + morph * 0.48 + energy * 0.18})`;
      context.beginPath();
      context.moveTo(x - Math.cos(angle) * halfLength, y - Math.sin(angle) * halfLength);
      context.lineTo(x + Math.cos(angle) * halfLength, y + Math.sin(angle) * halfLength);
      context.stroke();
    }
    previous.x = pointer.x;
    previous.y = pointer.y;
    previous.active = active;
  };
};
