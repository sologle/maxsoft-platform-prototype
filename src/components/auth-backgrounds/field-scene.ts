import { drawHalo, type DrawScene } from "./scene-types";

const SPACING = 36;
const MAX_MARKS = 1800;
const INFLUENCE_RADIUS = 245;
const SPRING_RATE = 13;

export const createField = (width: number, height: number): DrawScene => {
  const spacing = Math.max(SPACING, Math.sqrt(width * height / MAX_MARKS));
  const columns = Math.ceil(width / spacing);
  const points = Array.from({ length: columns * Math.ceil(height / spacing) }, (_, index) => {
    const homeX = (index % columns) * spacing + spacing / 2;
    const homeY = Math.floor(index / columns) * spacing + spacing / 2;
    return { homeX, homeY, x: homeX, y: homeY, angle: -Math.PI / 4, energy: 0 };
  });

  return ({ context, delta, pointer, dark, motion }) => {
    const color = dark ? "108,198,238" : "26,115,166";
    const response = 1 - Math.exp(-SPRING_RATE * delta);
    const active = pointer.active && motion;
    if (active) drawHalo(context, pointer.x, pointer.y, INFLUENCE_RADIUS, color, dark ? 0.16 : 0.1);
    context.lineCap = "round";
    context.lineWidth = 1.25;
    for (const point of points) {
      const dx = point.homeX - pointer.x;
      const dy = point.homeY - pointer.y;
      const distance = Math.hypot(dx, dy);
      const influence = active ? Math.max(0, 1 - distance / INFLUENCE_RADIUS) ** 2 : 0;
      const angle = Math.atan2(dy, dx);
      const targetX = point.homeX + Math.cos(angle) * influence * 62;
      const targetY = point.homeY + Math.sin(angle) * influence * 62;
      const targetAngle = influence > 0 ? angle + Math.PI / 2 : -Math.PI / 4;
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
      const halfLength = 3 + point.energy * 11;
      const ux = Math.cos(point.angle) * halfLength;
      const uy = Math.sin(point.angle) * halfLength;
      context.strokeStyle = `rgba(${color},${(dark ? 0.21 : 0.17) + point.energy * 0.7})`;
      context.beginPath();
      context.moveTo(point.x - ux, point.y - uy);
      context.lineTo(point.x + ux, point.y + uy);
      context.stroke();
    }
  };
};
