import { defineConfig } from 'tsup';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Plugin } from 'esbuild';

const require = createRequire(import.meta.url);

/**
 * esbuild plugin that resolves the virtual `virtual:drift-slider-bundle-css` import
 * and returns the core bundle CSS file contents as a string module.
 * This replaces the Vite-only `?inline` query-string mechanism (unsupported in tsup/esbuild).
 */
function inlineCssPlugin(): Plugin {
  return {
    name: 'inline-drift-css',
    setup(build) {
      // Intercept the virtual import before any external-check or resolution
      build.onResolve({ filter: /^virtual:drift-slider-bundle-css$/ }, () => ({
        path: 'drift-slider-bundle-css',
        namespace: 'inline-css',
      }));

      build.onLoad({ filter: /.*/, namespace: 'inline-css' }, () => {
        const cssPath = require.resolve('drift-slider/css/bundle');
        const css = readFileSync(cssPath, 'utf-8');
        // Export the CSS string as the default export
        return {
          contents: `export default ${JSON.stringify(css)};`,
          loader: 'js',
        };
      });
    },
  };
}

export default defineConfig([
  // ESM target: externalizes drift-slider (except css/bundle which is inlined via plugin)
  {
    entry: ['src/index.ts', 'src/define.ts', 'src/with-css.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    external: ['drift-slider'],
    esbuildPlugins: [inlineCssPlugin()],
  },
  // IIFE target: bundles drift-slider from source (noExternal), minified CDN bundle
  {
    entry: { 'drift-slider-element.iife': 'src/cdn.ts' },
    format: ['iife'],
    globalName: 'DriftSliderElement',
    noExternal: ['drift-slider'],
    minify: true,
    clean: false,
    esbuildPlugins: [inlineCssPlugin()],
  },
]);
