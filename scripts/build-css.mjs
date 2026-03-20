import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';

mkdirSync('dist/css', { recursive: true });

// Core CSS
execSync('sass src/styles/drift-slider.scss dist/css/core.css --style=compressed --no-source-map');

// Bundle CSS (core + all modules)
execSync('sass src/styles/bundle.scss dist/drift-slider-bundle.css --style=compressed --no-source-map');
// Also copy to dist/css/ for exports map
copyFileSync('dist/drift-slider-bundle.css', 'dist/css/bundle.css');

// Per-module CSS
const modules = [
  { name: 'navigation', scss: 'src/modules/navigation/navigation.scss' },
  { name: 'pagination', scss: 'src/modules/pagination/pagination.scss' },
  { name: 'autoplay', scss: 'src/modules/autoplay/autoplay.scss' },
  { name: 'effect-fade', scss: 'src/modules/effects/effect-fade.scss' },
];

for (const mod of modules) {
  if (existsSync(mod.scss)) {
    execSync(`sass ${mod.scss} dist/css/${mod.name}.css --style=compressed --no-source-map`);
  }
}

// Modules without SCSS get empty CSS files (so imports don't break)
const allModuleNames = [
  'navigation', 'pagination', 'autoplay', 'effect-fade',
  'effect-coverflow', 'effect-cards', 'effect-creative', 'effect-showcase',
  'keyboard', 'a11y', 'scroll-aos', 'thumbs',
];
for (const name of allModuleNames) {
  const path = `dist/css/${name}.css`;
  if (!existsSync(path)) {
    writeFileSync(path, `/* drift-slider/${name} — no styles needed */\n`);
  }
}

console.log('CSS build complete.');
