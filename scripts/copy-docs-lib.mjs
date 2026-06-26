import { copyFileSync, mkdirSync } from 'node:fs';

const DEST = 'docs/assets/lib';
mkdirSync(DEST, { recursive: true });

const files = [
  'packages/core/dist/esm/index.mjs',
  'packages/core/dist/css/core.css',
  'packages/core/dist/drift-slider-bundle.css',
  'packages/core/dist/drift-slider.umd.js',
  'packages/core/dist/drift-slider.jquery.js',
  'packages/element/dist/drift-slider-element.iife.global.js',
];

for (const src of files) {
  const name = src.split('/').pop();
  copyFileSync(src, `${DEST}/${name}`);
}
console.log(`Copied ${files.length} files to ${DEST}`);
