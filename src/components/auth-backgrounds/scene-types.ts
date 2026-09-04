export interface ScenePointer {
  x: number;
  y: number;
  active: boolean;
}

export interface SceneFrame {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  delta: number;
  time: number;
  pointer: ScenePointer;
  dark: boolean;
  motion: boolean;
}

export type DrawScene = (frame: SceneFrame) => void;

export const drawHalo = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  opacity: number,
) => {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color},${opacity})`);
  gradient.addColorStop(0.45, `rgba(${color},${opacity * 0.35})`);
  gradient.addColorStop(1, `rgba(${color},0)`);
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
};

export const TAU = Math.PI * 2;
