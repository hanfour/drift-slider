import terser from '@rollup/plugin-terser';

const banner = `/*!
 * DriftSlider v0.1.0
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
