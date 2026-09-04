import { drawHalo, TAU, type DrawScene } from "./scene-types";

const INFLUENCE_RADIUS = 290;
const PARTICLE_SPACING = 58;
const MAX_PARTICLES = 440;
const TRAIL_LENGTH = 5;

export const createSwarm = (width: number, height: number): DrawScene => {
  const count = Math.min(MAX_PARTICLES, Math.ceil((width * height) / PARTICLE_SPACING ** 2));
  const particles = Array.from({ length: count }, (_, index) => {
    const homeX = ((index * 0.61803398875 + 0.07) % 1) * width;
    const homeY = ((index * 0.41421356237 + 0.13) % 1) * height;
    return {
      homeX, homeY, x: homeX, y: homeY, energy: 0,
      phase: index * 2.39996,
      radius: 22 + (index % 11) * 5,
      trail: Array.from({ length: TRAIL_LENGTH }, () => ({ x: homeX, y: homeY })),
    };
  });

  return ({ context, time, delta, pointer, dark, motion }) => {
    const active = motion && pointer.active;
    const ink = dark ? "101,208,234" : "17,125,163";
    const response = 1 - Math.exp(-5 * delta);
    const cursorX = pointer.x;
    const cursorY = pointer.y;
    if (active) {
      drawHalo(context, cursorX, cursorY, INFLUENCE_RADIUS, ink, dark ? 0.15 : 0.08);
      drawHalo(context, cursorX, cursorY, 65, ink, dark ? 0.13 : 0.045);
    }
    context.lineCap = "round";
    for (const particle of particles) {
      const distance = Math.hypot(particle.homeX - cursorX, particle.homeY - cursorY);
      const influence = active ? Math.max(0, 1 - distance / INFLUENCE_RADIUS) : 0;
      const capture = Math.min(1, influence * 2.3);
      const angle = particle.phase + time * 0.85;
      const idleX = particle.homeX + (motion ? Math.sin(time * 0.16 + particle.phase) * 5 : 0);
      const idleY = particle.homeY + (motion ? Math.cos(time * 0.2 + particle.phase) * 5 : 0);
      const targetX = idleX + (cursorX + Math.cos(angle) * particle.radius - idleX) * capture;
      const targetY = idleY + (cursorY + Math.sin(angle) * particle.radius * 0.7 - idleY) * capture;
      if (!motion) {
        particle.x = particle.homeX;
        particle.y = particle.homeY;
        particle.energy = 0;
      } else {
        for (let index = TRAIL_LENGTH - 1; index > 0; index--) {
          particle.trail[index].x = particle.trail[index - 1].x;
          particle.trail[index].y = particle.trail[index - 1].y;
        }
        particle.trail[0].x = particle.x;
        particle.trail[0].y = particle.y;
        particle.x += (targetX - particle.x) * response;
        particle.y += (targetY - particle.y) * response;
        particle.energy += (capture - particle.energy) * response;
      }
      if (motion && particle.energy > 0.05) {
        context.strokeStyle = `rgba(${ink},${particle.energy * 0.22})`;
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(particle.x, particle.y);
        for (const point of particle.trail) context.lineTo(point.x, point.y);
        context.stroke();
      }
      const radius = 1 + (particle.radius % 3) * 0.25 + particle.energy;
      context.fillStyle = `rgba(${ink},${(dark ? 0.35 : 0.27) + particle.energy * 0.55})`;
      context.beginPath();
      context.arc(particle.x, particle.y, radius, 0, TAU);
      context.fill();
      if (particle.energy > 0.4) {
        context.fillStyle = `rgba(${ink},${particle.energy * 0.06})`;
        context.beginPath();
        context.arc(particle.x, particle.y, radius * 3, 0, TAU);
        context.fill();
      }
    }
  };
};
