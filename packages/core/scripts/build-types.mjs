import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

mkdirSync('dist/types/modules', { recursive: true });

// Copy monolithic types to dist/types/index.d.ts
// Convert from `declare module 'drift-slider' { ... }` wrapper to direct exports
let source = readFileSync('types/index.d.ts', 'utf-8');

// Remove the `declare module 'drift-slider' {` wrapper and closing `}`
// Keep the content inside, un-indented by 2 spaces
const moduleMatch = source.match(/declare module 'drift-slider' \{([\s\S]*?)\n\}/);
if (moduleMatch) {
  let inner = moduleMatch[1];
  // Un-indent by 2 spaces
  inner = inner.replace(/\n  /g, '\n').trim();
  source = inner + '\n';
}

// Remove jQuery augmentation (not relevant for dist/types/index.d.ts)
source = source.replace(/\/\/ jQuery plugin augmentation[\s\S]*$/, '').trim() + '\n';

writeFileSync('dist/types/index.d.ts', source);

// dist/types/core.d.ts — DriftSlider class only
writeFileSync('dist/types/core.d.ts', `export { DriftSlider, DriftSliderOptions, DriftSliderEvents } from './index';
export default DriftSlider;
`);

// dist/types/modules/index.d.ts — all modules
const moduleNames = [
  'Navigation', 'Pagination', 'Autoplay', 'EffectFade',
  'EffectCoverflow', 'EffectCards', 'EffectCreative', 'EffectShowcase',
  'Keyboard', 'A11y', 'ScrollAos', 'Thumbs',
];
const moduleExports = moduleNames.map(n => `export { ${n} } from '../index';`).join('\n');
writeFileSync('dist/types/modules/index.d.ts', moduleExports + '\n');

// Per-module type files
const moduleMap = {
  navigation: 'Navigation',
  pagination: 'Pagination',
  autoplay: 'Autoplay',
  'effect-fade': 'EffectFade',
  'effect-coverflow': 'EffectCoverflow',
  'effect-cards': 'EffectCards',
  'effect-creative': 'EffectCreative',
  'effect-showcase': 'EffectShowcase',
  keyboard: 'Keyboard',
  a11y: 'A11y',
  'scroll-aos': 'ScrollAos',
  thumbs: 'Thumbs',
};

for (const [file, exportName] of Object.entries(moduleMap)) {
  writeFileSync(
    `dist/types/modules/${file}.d.ts`,
    `export { ${exportName} } from '../index';\nexport default ${exportName};\n`
  );
}

console.log('Types build complete.');
