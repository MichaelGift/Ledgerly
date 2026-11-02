// Renders every app icon and splash asset from the "Bar L" mark: an L whose base sprouts two
// rising bars. Edit the geometry or colors here, then run `npm run icons`.
import { Resvg } from '@resvg/resvg-js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const INDIGO = '#0E1022';
const LIME = '#C6F432';

// The mark in its own 88 × 104 box: stem, base, short bar, tall bar.
const MARK_WIDTH = 88;
const MARK_HEIGHT = 104;
const MARK_RECTS = [
  { x: 0, y: 0, w: 30, h: 104, r: 10 },
  { x: 0, y: 74, w: 88, h: 30, r: 10 },
  { x: 44, y: 44, w: 18, h: 22, r: 6 },
  { x: 70, y: 20, w: 18, h: 46, r: 6 },
];

/** The mark scaled to `height` px and centered on a `size` px square canvas. */
function mark(size, height, fill) {
  const scale = height / MARK_HEIGHT;
  const x = (size - MARK_WIDTH * scale) / 2;
  const y = (size - height) / 2;
  const rects = MARK_RECTS.map(
    (r) => `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="${r.r}" fill="${fill}"/>`
  ).join('');
  return `<g transform="translate(${x} ${y}) scale(${scale})">${rects}</g>`;
}

function svg(size, body, background) {
  const bg = background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${bg}${body}</svg>`;
}

const outputs = [
  // Full-bleed square; iOS and Android apply their own corner masks. The mark fills ~58% of the height.
  { file: 'assets/images/icon.png', svg: svg(1024, mark(1024, 592, LIME), INDIGO) },
  // Android adaptive layers (108dp canvas). The mark's diagonal stays inside the 66dp safe circle.
  { file: 'assets/images/android-icon-foreground.png', svg: svg(512, mark(512, 228, LIME)) },
  { file: 'assets/images/android-icon-background.png', svg: svg(512, '', INDIGO) },
  { file: 'assets/images/android-icon-monochrome.png', svg: svg(432, mark(432, 192, '#FFFFFF')) },
  // Splash: the mark alone; app.json supplies the indigo background.
  { file: 'assets/images/splash-icon.png', svg: svg(512, mark(512, 480, LIME)) },
  { file: 'assets/images/favicon.png', svg: svg(48, mark(48, 30, LIME), INDIGO) },
  // PWA (iOS home screen and Android install). Maskable icons keep the mark inside the central 80%.
  { file: 'public/icons/apple-touch-icon.png', svg: svg(180, mark(180, 104, LIME), INDIGO) },
  { file: 'public/icons/icon-192.png', svg: svg(192, mark(192, 111, LIME), INDIGO) },
  { file: 'public/icons/icon-512.png', svg: svg(512, mark(512, 296, LIME), INDIGO) },
  { file: 'public/icons/maskable-512.png', svg: svg(512, mark(512, 236, LIME), INDIGO) },
  // Editable vector copy of the full icon.
  { file: 'assets/icon/icon.svg', svg: svg(1024, mark(1024, 592, LIME), INDIGO), raw: true },
];

for (const output of outputs) {
  const path = join(root, output.file);
  mkdirSync(dirname(path), { recursive: true });
  const data = output.raw ? output.svg : new Resvg(output.svg).render().asPng();
  writeFileSync(path, data);
  console.log(`wrote ${output.file}`);
}
