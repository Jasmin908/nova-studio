// Prints mean colours of regions of the originals (read-only). Used to tune
// the tokens in src/styles/tokens.css against the photographs.
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';
import { ORIGINALS } from './originals.mjs';

// Regions are fractions of the frame: [left, top, width, height].
const SAMPLES = [
  ['hero', 'backdrop, far left edge', [0, 0.3, 0.03, 0.4]],
  ['hero', 'backdrop, centre left', [0.3, 0.35, 0.1, 0.3]],
  ['hero', 'backdrop, bottom edge left', [0.05, 0.96, 0.4, 0.04]],
  ['hero', 'backdrop beside face (mobile crop)', [0.44, 0.7, 0.06, 0.2]],
  ['closeup', 'backdrop, right', [0.75, 0.3, 0.15, 0.4]],
  ['closeup', 'backdrop, far right edge', [0.97, 0.2, 0.03, 0.6]],
  ['studio', 'floor, bottom edge', [0, 0.97, 1, 0.03]],
  ['studio', 'floor, bottom left', [0, 0.85, 0.2, 0.15]],
  ['studio', 'ceiling, top edge', [0.5, 0, 0.5, 0.03]],
  ['studio', 'left wall', [0.02, 0.3, 0.2, 0.3]],
  ['studio', 'slit of light', [0.309, 0.2, 0.012, 0.3]],
  ['studio', 'bench', [0.76, 0.7, 0.15, 0.05]],
];
console.log('\nColour samples');
for (const [asset, label, [l, t, w, h]] of SAMPLES) {
  const source = await readFile(ORIGINALS[asset].path);
  const meta = await sharp(source).metadata();
  const region = await sharp(source)
    .extract({
      left: Math.floor(meta.width * l),
      top: Math.floor(meta.height * t),
      width: Math.max(1, Math.floor(meta.width * w)),
      height: Math.max(1, Math.floor(meta.height * h)),
    })
    .png()
    .toBuffer();
  const { channels } = await sharp(region).stats();
  const hex = channels
    .slice(0, 3)
    .map((c) => Math.round(c.mean).toString(16).padStart(2, '0'))
    .join('');
  console.log(`#${hex}  ${asset.padEnd(8)} ${label}`);
}
