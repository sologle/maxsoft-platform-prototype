export interface ScatterSettings {
  force: number;
  radius: number;
  spring: number;
  damping: number;
  spin: number;
  trail: number;
  variation: number;
  orbitRadius: number;
  orbitStrength: number;
}

export const defaultScatterSettings: Readonly<ScatterSettings> = Object.freeze({
  force: 0.3, radius: 0.55, spring: 20, damping: 3.8, spin: 0.8, trail: 0, variation: 1,
  orbitRadius: 60, orbitStrength: 0.6,
});

