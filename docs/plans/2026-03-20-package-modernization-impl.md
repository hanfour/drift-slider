# Package Modernization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Restructure drift-slider's build output to support per-module imports, complete exports map, and `type: "module"` for modern tree-shaking.

**Architecture:** Rewrite rollup.config.mjs to produce per-module ESM files alongside existing UMD/jQuery bundles. Split TypeScript definitions into per-module files. Update package.json with complete exports map, `type: "module"`, and `sideEffects`. Remove CJS output.

**Tech Stack:** Rollup 4, Sass, Vitest, publint

**Design doc:** `docs/plans/2026-03-20-package-modernization-design.md`

---

## Task 1: Rewrite Rollup Config for Per-Module ESM

**Files:**
- Modify: `rollup.config.mjs`

**Step 1: Rewrite rollup.config.mjs**

Replace the entire file with a config that produces:
- `dist/esm/index.mjs` — full ESM (core + all modules)
- `dist/esm/core.mjs` — core only
- `dist/esm/modules/*.mjs` — 13 individual module files
- `dist/drift-slider.umd.js` — UMD bundle (retained)
- `dist/drift-slider.jquery.js` — jQuery plugin (retained)

The per-module builds use Rollup's `input` as an object to generate multiple outputs. Each module file should be standalone (no shared chunks — they're small enough).

Key config structure:

```js
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
```

**Step 2: Test the build**

Run: `npm run build`
Expected: Files created in `dist/esm/`, `dist/esm/modules/`, plus existing UMD/jQuery outputs.

Verify: `ls dist/esm/modules/` should show 13+ `.mjs` files.

**Step 3: Commit**

```bash
git add rollup.config.mjs
git commit -m "build: rewrite rollup config for per-module ESM output"
```

---

## Task 2: Per-Module CSS Build

**Files:**
- Modify: `package.json` (scripts section)

**Step 1: Update build:css script**

The current `build:css` compiles only `drift-slider.css` and `drift-slider-bundle.css`. Add per-module CSS compilation.

Update `package.json` scripts:

```json
"build:css": "node scripts/build-css.mjs"
```

**Step 2: Create `scripts/build-css.mjs`**

```js
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';

mkdirSync('dist/css', { recursive: true });

// Core CSS
execSync('sass src/styles/drift-slider.scss dist/css/core.css --style=compressed --no-source-map');

// Bundle CSS (core + all modules)
execSync('sass src/styles/bundle.scss dist/drift-slider-bundle.css --style=compressed --no-source-map');
// Also copy to dist/css/ for exports map
execSync('cp dist/drift-slider-bundle.css dist/css/bundle.css');

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
```

**Step 3: Test**

Run: `npm run build:css`
Expected: `dist/css/` contains `core.css`, `bundle.css`, `navigation.css`, `pagination.css`, etc.

**Step 4: Commit**

```bash
git add scripts/build-css.mjs package.json
git commit -m "build: add per-module CSS compilation"
```

---

## Task 3: Split TypeScript Definitions

**Files:**
- Create: `dist/types/index.d.ts`
- Create: `dist/types/core.d.ts`
- Create: `dist/types/modules/index.d.ts`
- Create: `dist/types/modules/*.d.ts` (per module)
- Modify: `package.json` (scripts section)

**Step 1: Create `scripts/build-types.mjs`**

This script reads the current monolithic `types/index.d.ts` and generates split type files.

Rather than parsing the existing file, write the split types directly. Each module gets its own `.d.ts`:

```js
import { mkdirSync, writeFileSync } from 'node:fs';

mkdirSync('dist/types/modules', { recursive: true });

// Core types (DriftSlider class, options, events)
// Read from types/index.d.ts and extract core portions
// For now, copy the full types as index.d.ts and create re-export stubs

// dist/types/index.d.ts — full types (re-export everything)
// Just copy the existing monolithic file and add module declarations

// dist/types/core.d.ts — DriftSlider class only
writeFileSync('dist/types/core.d.ts', `
export { DriftSlider, DriftSliderOptions, DriftSliderEvents } from './index';
export default DriftSlider;
`.trim() + '\n');

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
```

**Step 2: Copy monolithic types to dist**

Add to the script: copy `types/index.d.ts` to `dist/types/index.d.ts`, replacing the `declare module 'drift-slider'` wrapper with direct exports (so subpath imports work).

**Step 3: Update package.json scripts**

```json
"build:types": "node scripts/build-types.mjs",
"build": "rollup -c rollup.config.mjs && npm run build:types",
"prepublishOnly": "npm run build && npm run build:css"
```

**Step 4: Test**

Run: `npm run build:types`
Expected: `dist/types/` with `index.d.ts`, `core.d.ts`, `modules/index.d.ts`, `modules/navigation.d.ts`, etc.

**Step 5: Commit**

```bash
git add scripts/build-types.mjs package.json
git commit -m "build: add per-module TypeScript definition generation"
```

---

## Task 4: Update package.json (exports, type, sideEffects)

**Files:**
- Modify: `package.json`

**Step 1: Apply all package.json changes**

```json
{
  "type": "module",
  "sideEffects": ["*.css"],
  "main": "./dist/esm/index.mjs",
  "module": "./dist/esm/index.mjs",
  "types": "./dist/types/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/types/index.d.ts",
      "default": "./dist/esm/index.mjs"
    },
    "./core": {
      "types": "./dist/types/core.d.ts",
      "default": "./dist/esm/core.mjs"
    },
    "./modules": {
      "types": "./dist/types/modules/index.d.ts",
      "default": "./dist/esm/modules/index.mjs"
    },
    "./modules/*": {
      "types": "./dist/types/modules/*.d.ts",
      "default": "./dist/esm/modules/*.mjs"
    },
    "./css": "./dist/css/core.css",
    "./css/*": "./dist/css/*.css",
    "./css/bundle": "./dist/drift-slider-bundle.css",
    "./bundle": "./dist/drift-slider.umd.js",
    "./jquery": "./dist/drift-slider.jquery.js",
    "./package.json": "./package.json"
  },
  "files": ["dist/", "src/", "package.json"]
}
```

Remove: `"types": "types/index.d.ts"` (old path)

**Step 2: Verify vitest still works with `type: "module"`**

Run: `npm test`
Expected: All 425 tests pass. Vitest natively supports ESM.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: add type:module, sideEffects, and complete exports map"
```

---

## Task 5: Add publint Quality Gate

**Files:**
- Modify: `package.json`

**Step 1: Install publint**

Run: `npm install --save-dev publint`

**Step 2: Add script**

```json
"publint": "publint",
"prepublishOnly": "npm run build && npm run build:css && npm run publint"
```

**Step 3: Full build + lint**

Run: `npm run build && npm run build:css && npm run build:types && npx publint`
Expected: No errors. Warnings about missing CJS are acceptable (we intentionally dropped it).

**Step 4: Fix any publint errors**

Common issues:
- `EXPORTS_TYPES_SHOULD_BE_FIRST`: types must be first in each exports condition
- `EXPORTS_MODULE_SHOULD_PRECEDE_REQUIRE`: module before require
- `FILE_DOES_NOT_EXIST`: verify all paths in exports actually exist after build

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add publint quality gate to prepublish"
```

---

## Task 6: Clean Up Old Outputs + Update .gitignore

**Files:**
- Modify: `.gitignore`
- Delete: `types/index.d.ts` (moved to dist/types/)

**Step 1: Move types source**

The monolithic `types/index.d.ts` is the source of truth. Keep it in `types/` as the build input, but `dist/types/` is what gets published.

Update `.gitignore` — `dist/` is already ignored.

Update `files` in package.json: `["dist/", "src/", "package.json"]`

Note: `types/` no longer in `files` — only `dist/types/` is published.

**Step 2: Full build verification**

Run:
```bash
npm run build && npm run build:css && npm run build:types
npm test
npx publint
```

Expected: All pass.

**Step 3: Verify package contents**

Run: `npm pack --dry-run`
Expected: dist/ files present, no `types/index.d.ts` at root.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: clean up build outputs and finalize package structure"
```

---

## Task 7: Version Bump + Release

**Step 1: Final full test**

Run: `npm test`
Expected: 425 tests pass.

**Step 2: Full build**

Run: `npm run build && npm run build:css && npm run build:types`

**Step 3: publint**

Run: `npx publint`
Expected: Clean (0 errors).

**Step 4: Version bump**

Run: `npm version minor --no-git-tag-version` (bumps to 0.5.0)

**Step 5: Commit and tag**

```bash
git add -A
git commit -m "chore: release v0.5.0 — per-module ESM, exports map, type:module"
git tag v0.5.0
```

**Step 6: Publish**

```bash
git push origin main --tags
npm publish
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Rollup per-module ESM | `rollup.config.mjs` |
| 2 | Per-module CSS | `scripts/build-css.mjs`, `package.json` |
| 3 | Split TypeScript defs | `scripts/build-types.mjs`, `package.json` |
| 4 | package.json exports | `package.json` |
| 5 | publint gate | `package.json` |
| 6 | Cleanup | `.gitignore`, old files |
| 7 | Release v0.5.0 | Version bump + publish |
