import { readFileSync, readdirSync } from 'node:fs';
import { basename } from 'node:path';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const banner = `/*! DriftSlider v${pkg.version} | MIT License */`;

// Discover all module files dynamically
const moduleFiles = readdirSync('src/modules/effects')
  .filter(f => f.endsWith('.js'))
  .map(f => `src/modules/effects/${f}`);
// Add non-effect modules
const otherModules = [
  'src/modules/navigation/navigation.js',
  'src/modules/pagination/pagination.js',
  'src/modules/autoplay/autoplay.js',
  'src/modules/keyboard/keyboard.js',
  'src/modules/a11y/a11y.js',
  'src/modules/scroll-aos/scroll-aos.js',
  'src/modules/thumbs/thumbs.js',
];
const allModules = [...moduleFiles, ...otherModules];

// Build per-module input map: { 'navigation': 'src/modules/navigation/navigation.js', ... }
const moduleInputs = {};
for (const file of allModules) {
  const name = basename(file, '.js');
  moduleInputs[name] = file;
}

export default [
  // 1. Full ESM (core + all modules)
  {
    input: 'src/index.js',
    output: { file: 'dist/esm/index.mjs', format: 'es', banner },
  },
  // 2. Core only ESM
  {
    input: 'src/drift-slider.js',
    output: { file: 'dist/esm/core.mjs', format: 'es', banner },
  },
  // 3. Per-module ESM
  {
    input: { 'modules/index': 'src/modules/index.js', ...Object.fromEntries(
      Object.entries(moduleInputs).map(([name, path]) => [`modules/${name}`, path])
    )},
    output: { dir: 'dist/esm', format: 'es', banner, entryFileNames: '[name].mjs' },
  },
  // 4. UMD bundle (minified)
  {
    input: 'src/index.js',
    output: {
      file: 'dist/drift-slider.umd.js',
      format: 'umd', name: 'DriftSlider', banner, exports: 'named',
    },
    plugins: [terser()],
  },
  // 5. jQuery plugin
  {
    input: 'src/jquery/jquery-plugin.js',
    output: {
      file: 'dist/drift-slider.jquery.js',
      format: 'umd', name: 'DriftSliderJQuery', banner, exports: 'default',
      globals: { jquery: 'jQuery' },
    },
    external: ['jquery'],
    plugins: [terser()],
  },
];
