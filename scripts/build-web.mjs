// Builds the installable web app (the iOS PWA) into dist/ for GitHub Pages:
// exports the web bundle, adds the single-page fallback, and stamps the service worker with this
// build's version and file list so it can precache everything for offline use.
// Usage: npm run build:web   (BUILD_VERSION defaults to the current commit)
import { execSync } from 'node:child_process';
import { copyFileSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');

execSync('npx expo export --platform web --output-dir dist', { cwd: root, stdio: 'inherit' });

// GitHub Pages serves 404.html for unknown paths, so deep links still boot the app.
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
// Expo emits folders starting with "_" (e.g. _expo), which Jekyll would otherwise drop.
writeFileSync(join(dist, '.nojekyll'), '');

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const skip = new Set(['sw.js', '404.html', '.nojekyll']);
const files = walk(dist)
  .map((path) => relative(dist, path).split(sep).join('/'))
  .filter((path) => !skip.has(path))
  .sort();

const version =
  process.env.BUILD_VERSION ||
  execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf8' }).trim();

const swPath = join(dist, 'sw.js');
const sw = readFileSync(swPath, 'utf8')
  .replace("'__BUILD_VERSION__'", JSON.stringify(version))
  .replace('/* __PRECACHE__ */', ['./', ...files].map((file) => JSON.stringify(file)).join(', '));
if (sw.includes('__BUILD_VERSION__') || sw.includes('__PRECACHE__')) {
  throw new Error('Could not stamp dist/sw.js: placeholders not found');
}
writeFileSync(swPath, sw);

console.log(`Web build ${version}: ${files.length} files precached`);
