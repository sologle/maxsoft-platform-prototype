import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Rebuild the animation targets from the official alpha mask; no font substitution.
const source = new URL('../src/assets/brand/maxsoft-logo-blue.png', import.meta.url);
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  const data = await page.evaluate(async (base64) => {
    const logo = new Image();
    logo.src = `data:image/png;base64,${base64}`;
    await logo.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = Math.round(canvas.width * logo.naturalHeight / logo.naturalWidth);
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('BRAND_MASK_CONTEXT_MISSING');
    context.drawImage(logo, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const samples = [];
    for (let x = 0; x < canvas.width; x += 3) {
      for (let y = 0; y < canvas.height; y += 3) {
        if (pixels[(y * canvas.width + x) * 4 + 3] > 128) samples.push([x, y]);
      }
    }
    if (!samples.length) throw new Error('BRAND_MASK_EMPTY');
    return { width: canvas.width, height: canvas.height, samples };
  }, (await readFile(source)).toString('base64'));
  await writeFile(new URL('../src/assets/brand/wordmark-mask.json', import.meta.url), JSON.stringify(data) + '\n');
  console.log(`${data.samples.length} logo targets, ${data.width}×${data.height}`);
} finally {
  await browser.close();
}
