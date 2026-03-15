import { readFileSync } from 'node:fs';
import terser from '@rollup/plugin-terser';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));
const banner = `/*!
 * DriftSlider v${pkg.version}
 * A lightweight, modular slider/carousel library
 * MIT License
 */`;

export default [
  // ESM
  {
    input: 'src/index.js',
    output: {
      file: 'dist/drift-slider.esm.js',
      format: 'es',
      banner,
    },
  },
  // CJS
  {
    input: 'src/index.js',
    output: {
      file: 'dist/drift-slider.cjs.js',
      format: 'cjs',
      banner,
      exports: 'named',
    },
  },
  // UMD
  {
    input: 'src/index.js',
    output: {
      file: 'dist/drift-slider.umd.js',
      format: 'umd',
      name: 'DriftSlider',
      banner,
      exports: 'named',
    },
    plugins: [terser()],
  },
  // jQuery plugin UMD
  {
    input: 'src/jquery/jquery-plugin.js',
    output: {
      file: 'dist/drift-slider.jquery.js',
      format: 'umd',
      name: 'DriftSliderJQuery',
      banner,
      globals: {
        jquery: 'jQuery',
      },
      exports: 'default',
    },
    external: ['jquery'],
    plugins: [terser()],
  },
];
