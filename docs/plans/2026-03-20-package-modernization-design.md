# Package Modernization Design

**Date:** 2026-03-20
**Goal:** Modernize drift-slider's npm package structure to match/exceed Swiper's distribution quality while being leaner and more developer-friendly.

---

## 1. Per-Module Independent Builds

### Output Structure

```
dist/
  # Bundle (CDN / script tag)
  drift-slider.umd.js
  drift-slider-bundle.css
  drift-slider.jquery.js

  # ESM (modern bundlers, tree-shakable)
  esm/
    index.mjs                     # re-export core + all modules
    core.mjs                      # core only (~8KB)
    modules/
      index.mjs                   # re-export all modules
      navigation.mjs
      pagination.mjs
      autoplay.mjs
      thumbs.mjs
      effect-fade.mjs
      effect-coverflow.mjs
      effect-cards.mjs
      effect-creative.mjs
      effect-showcase.mjs
      keyboard.mjs
      a11y.mjs
      scroll-aos.mjs

  # CSS (per-module)
  css/
    core.css
    navigation.css
    pagination.css
    effect-fade.css
    effect-cards.css
    ...

  # Types (per-module)
  types/
    index.d.ts
    core.d.ts
    modules/
      index.d.ts
      navigation.d.ts
      ...
```

### What We Don't Build (vs Swiper)

- No `.min.mjs` — user's bundler handles minification
- No `.min.js.map` — source maps not needed for production dist
- No CJS per-module — `type: "module"` eliminates the need
- No `-element.css` — no Web Component variant

---

## 2. Exports Map + type: "module"

### package.json

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

### Usage Patterns

```js
// Full import (simplest, unchanged)
import { DriftSlider, Navigation } from 'drift-slider';

// Precise import (tree-shake friendly, smallest bundle)
import { DriftSlider } from 'drift-slider/core';
import { Navigation } from 'drift-slider/modules/navigation';
import 'drift-slider/css';
import 'drift-slider/css/navigation';

// CDN (script tag, unchanged)
// <script src="https://esm.sh/drift-slider/bundle"></script>
```

---

## 3. Rollup Build Strategy

### Entry Points

| # | Input | Output | Purpose |
|---|-------|--------|---------|
| 1 | `src/index.js` | `dist/esm/index.mjs` | Full ESM |
| 2 | `src/drift-slider.js` | `dist/esm/core.mjs` | Core only |
| 3 | `src/modules/*.js` (13) | `dist/esm/modules/*.mjs` | Per-module |
| 4 | `src/modules/index.js` | `dist/esm/modules/index.mjs` | Module re-exports |
| 5 | `src/index.js` | `dist/drift-slider.umd.js` | UMD bundle |
| 6 | `src/jquery/...` | `dist/drift-slider.jquery.js` | jQuery plugin |

### Removed Outputs

- `dist/drift-slider.cjs.js` — replaced by ESM with `type: "module"`
- `dist/drift-slider.esm.js` — replaced by `dist/esm/index.mjs`

### CSS Build

- Sass compiles each module's `.scss` to `dist/css/*.css`
- `dist/css/core.css` = core styles only
- `dist/drift-slider-bundle.css` = core + all module CSS (retained)

### TypeScript

- Split current `types/index.d.ts` into `dist/types/` with per-module files
- Each module type file exports only that module's interfaces

---

## 4. Quality Gates

- `npx publint` in prepublish script — enforces exports map correctness
- `sideEffects: ["*.css"]` enables tree-shaking for JS, preserves CSS
- `type: "module"` signals ESM-first to all tooling

---

## 5. Breaking Changes

- Removed: CJS format (`dist/drift-slider.cjs.js`)
- Moved: `types/index.d.ts` to `dist/types/index.d.ts`
- Changed: `main` field now points to ESM (was CJS)

Existing UMD bundle, jQuery plugin, CSS bundle, and `import from 'drift-slider'` all continue to work unchanged.
