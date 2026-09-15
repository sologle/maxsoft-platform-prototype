import mask from "../../assets/brand/wordmark-mask.json";

const GOLDEN_FRACTION = 0.61803398875;

// Coordinates are sampled from the official PNG by scripts/generate-brand-mask.mjs.
// The same scale on both axes preserves the brand's proportions.
export const createWordTargets = (
  width: number,
  centerY: number,
  count: number,
) => {
  const scale = Math.min(width * 0.76, 820) / mask.width;
  return Array.from({ length: count }, (_, index) => {
    const [x, y] =
      mask.samples[
        Math.floor(((index * GOLDEN_FRACTION) % 1) * mask.samples.length)
      ];
    return {
      x: width / 2 + (x - mask.width / 2) * scale,
      y: centerY + (y - mask.height / 2) * scale,
    };
  });
};
