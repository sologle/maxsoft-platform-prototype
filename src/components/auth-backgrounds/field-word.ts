const WORD = "MaxSoft";
const MASK_WIDTH = 800;
const MASK_HEIGHT = 190;
const SAMPLE_STEP = 3;
const GOLDEN_FRACTION = 0.61803398875;

// Rasterize a small, local system-font mask once per resize, never in the animation loop.
export const createWordTargets = (width: number, height: number, count: number) => {
  const mask = document.createElement("canvas");
  mask.width = MASK_WIDTH;
  mask.height = MASK_HEIGHT;
  const context = mask.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("AUTH_WORD_UNAVAILABLE: Не удалось показать фон. Обновите страницу.");
  context.font = "700 160px system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(WORD, MASK_WIDTH / 2, MASK_HEIGHT / 2);
  const pixels = context.getImageData(0, 0, MASK_WIDTH, MASK_HEIGHT).data;
  const samples: { x: number; y: number }[] = [];
  const scale = Math.min(width * 0.76, 820) / context.measureText(WORD).width;
  for (let x = 0; x < MASK_WIDTH; x += SAMPLE_STEP) {
    for (let y = 0; y < MASK_HEIGHT; y += SAMPLE_STEP) {
      if (pixels[(y * MASK_WIDTH + x) * 4 + 3] > 128) {
        samples.push({ x: width / 2 + (x - MASK_WIDTH / 2) * scale, y: Math.min(height * 0.2, 210) + (y - MASK_HEIGHT / 2) * scale });
      }
    }
  }
  if (!samples.length) throw new Error("AUTH_WORD_EMPTY: Не удалось подготовить фон. Обновите страницу.");
  return Array.from({ length: count }, (_, index) => samples[Math.floor(((index * GOLDEN_FRACTION) % 1) * samples.length)]);
};
