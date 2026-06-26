# DriftSlider React Wrapper + Monorepo — Design

**Date:** 2026-06-25
**Status:** Approved (validated by a 5-perspective review-panel vote; hardening folded in)
**Topic:** Convert the repo to a monorepo and add an official React wrapper package.

---

## 1. Goal

Give React developers an idiomatic, typed way to use DriftSlider, and lay the
repo groundwork (workspaces) for future ecosystem packages (Vue, Web Component).

This is the first deliverable of the **ecosystem** expansion direction. Scope is
deliberately a **thin wrapper + ref** (not a controlled or data-driven component).

## 2. Decisions (locked)

| # | Decision | Choice | Vote |
|---|---|---|---|
| D1 | Wrapper ambition | **Thin wrapper + `ref`** (+ headless hook) — no controlled `activeIndex`, no data-driven slides | 5–0 |
| D2 | Repo structure | **Full monorepo** via **npm workspaces** | 4–1 |
| D3 | React package name | **`drift-slider-react`** (unscoped — matches `drift-slider`, optimal npm/Google discoverability) | 4–1 panel for scoped, **overridden by maintainer for adoption/SEO** |
| D4 | Tooling | **npm workspaces + tsup** (react), **rollup** (core) | 5–0 |
| D5 | First ecosystem target | **React wrapper**; **Web Component is the explicit NEXT milestone** | 5–0 |
| — | Core package | Stays **`drift-slider`** (unchanged name/version 0.7.0), relocated to `packages/core/` |  |
| — | Docs site | Stays at **repo root** (`docs/`, GitHub Pages) |  |
| — | React support | **React 18 & 19**, SSR-safe (client-only init), `'use client'` for Next App Router |  |
| — | Versioning | Independent per package; react starts `0.1.0` |  |

Both packages are now **unscoped** (`drift-slider`, `drift-slider-react`) — no npm
org/scope needed, no `--access` step, and the naming is consistent.

## 3. Target Monorepo Layout

```
drift-slider/                  # repo root (private, not published)
├── package.json               # { private: true, workspaces: ["packages/*"], scripts }
├── package-lock.json          # single lockfile for the workspace
├── .github/workflows/         # ci.yml, publish.yml, lighthouse.yml (REWRITTEN for workspaces)
├── docs/                      # project site (GH Pages) — STAYS AT ROOT
│   ├── assets/lib/            # built core bundle copied here by build:docs
│   ├── demos/ …
│   └── superpowers/specs/     # this spec
├── scripts/
│   └── copy-docs-lib.mjs      # NEW: copies packages/core/dist/* → docs/assets/lib/
├── packages/
│   ├── core/                  # the existing library, published as `drift-slider`
│   │   ├── package.json       # name: "drift-slider" (unchanged, 0.7.0)
│   │   ├── src/  tests/  scripts/
│   │   ├── rollup.config.mjs  vitest.config.mjs  .release-it.json  lighthouserc.cjs
│   │   └── dist/              # built here (gitignored)
│   └── react/                 # NEW, published as `drift-slider-react`
│       ├── package.json       # name: "drift-slider-react", 0.1.0
│       ├── src/index.tsx
│       ├── tsup.config.ts  vitest.config.ts
│       └── dist/              # built here (gitignored)
```

### What moves where (Phase 1)
- **Into `packages/core/`** (via `git mv` to preserve history): `src/`, `tests/`,
  `scripts/` (core's own build scripts), `rollup.config.mjs`, `vitest.config.mjs`,
  `.release-it.json`, `lighthouserc.cjs`, `types/`, and the current `package.json`
  (name stays `drift-slider`).
- **Stays at root:** `docs/` (incl. `docs/plans`, `docs/superpowers`),
  `.github/`, `README.md`, `LICENSE`, `CONTRIBUTING.md`, top-level `CHANGELOG.md`.
- **New at root:** `package.json` (`private`, `workspaces`, delegating scripts) and
  `scripts/copy-docs-lib.mjs`.

### Why two bundlers (deliberate, per panel)
Core keeps **rollup** — it already handles core's multi-entry matrix (per-module
ESM, UMD, jQuery build, and the `build-types` pass). React uses **tsup** — a
single-entry ESM + `.d.ts` + `'use client'` banner is exactly tsup's sweet spot.
Forcing one bundler to serve both would add config complexity for no gain.

### CI / release path fixes (Phase 1 — MUST DO; the highest-risk gap)
Relocating an already-published package breaks root-relative automation. Phase 1
explicitly rewrites:
- **`.github/workflows/publish.yml`** — currently triggers on every release and
  runs `npm publish` from repo **root**, which post-migration is `private` (no
  publishable package). Rewrite to `npm ci` at root then **`npm publish -w packages/core`**
  (gated to the core tag/version).
- **`.github/workflows/ci.yml`** — `npm ci` at root, then build/test via
  `--workspaces` (or `-w packages/core -w packages/react`).
- **`.github/workflows/lighthouse.yml`** — build core first, then run lighthouse
  against `docs/` (`lighthouserc.cjs` `staticDistDir: ./docs` stays valid).
- **`build:docs`** — move to a root script: build core, then `node scripts/copy-docs-lib.mjs`
  copies `packages/core/dist/{esm/index.mjs,css/core.css,drift-slider-bundle.css,drift-slider.umd.js,drift-slider.jquery.js}`
  → `docs/assets/lib/`.
- **Root `package.json`** defines the missing `build` / `build:css` delegations.
- Regenerate `package-lock.json`; the global `dist/` gitignore still covers both packages.
- **Verify before merge:** `release-it --dry-run` for core + a green CI run.

### Root `package.json` scripts (proposed)
```jsonc
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "build:css": "npm run build:css -w packages/core",
    "build:docs": "npm run build -w packages/core && npm run build:css -w packages/core && node scripts/copy-docs-lib.mjs"
  }
}
```

## 4. React Package API (`drift-slider-react`)

### Dependencies
- `peerDependencies`: `react >=18`, `react-dom >=18`, `drift-slider` (workspace `*`).
- No CSS bundled — the consumer imports core CSS (`drift-slider/css/bundle` or
  per-module). Documented in the README.

### Public surface
```tsx
'use client'
import { DriftSlider, Slide, useDriftSlider } from 'drift-slider-react'
import { Navigation, Pagination } from 'drift-slider/modules'
import 'drift-slider/css/bundle'

function Carousel() {
  const ref = useRef<DriftSliderHandle>(null)
  return (
    <DriftSlider
      options={{ loop: true, navigation: true, pagination: true }}
      modules={[Navigation, Pagination]}
      onSlideChange={(s) => console.log(s.realIndex)}
      ref={ref}
    >
      <Slide><img src="/1.jpg" alt="" /></Slide>
      <Slide><img src="/2.jpg" alt="" /></Slide>
    </DriftSlider>
  )
}
```

### `<DriftSlider>` (default export)
- `forwardRef<DriftSliderHandle, DriftSliderProps>` (portable across React 18 & 19;
  `forwardRef` still works in 19 — ref-as-prop is not required for dual support).
- **Props:**
  - `options?: DriftSliderOptions` — the core's exported type, used verbatim.
  - `modules?: DriftSliderModule[]` — the core's exported module type.
  - `className?`, `style?` — applied to the `.drift-slider` container.
  - `on?: Partial<DriftSliderEvents>` — the core's exported event map (per-event
    handler signatures preserved). **Not** `Record<EventName, Handler>`.
  - Shortcut event props typed from the map: `onInit?: DriftSliderEvents['init']`,
    `onSlideChange?: DriftSliderEvents['slideChange']`, `onReachBeginning?`,
    `onReachEnd?`, `onTouchStart?`, `onTouchEnd?` (each merged into `on`). Note
    core handlers are slider-first: `(slider, ...args) => void`.
  - `children` — slides (`<Slide>` or any `<li className="drift-slide">`).
- **Renders the required scaffold:**
  `<div class="drift-slider"><div class="drift-track"><ul class="drift-list">{children}</ul></div></div>`.
- **Lifecycle:** init in `useEffect` (client only → SSR-safe); `destroy()` on
  unmount; re-init when `options`/`modules` reference changes; **`slider.update()`
  when the children's `key` set changes** (see §5).
- **Ref handle** (`useImperativeHandle`): `DriftSliderHandle =
  { slideTo; slideNext; slidePrev; update; instance: DriftSlider }`, derived from
  the core method signatures.

### `<Slide>` helper
- Renders `<li className={['drift-slide', className].filter(Boolean).join(' ')} {...rest}>{children}</li>`.
  Ergonomic only; raw `<li className="drift-slide">` also works.

### `useDriftSlider(options, deps?)` hook (headless)
- Returns `[containerRef, sliderRef] as const`.
- Creates the instance in `useEffect` on the container ref, destroys on cleanup,
  re-inits when `deps` change. `<DriftSlider>` is built on this hook.

### Type derivation (per panel — derive, don't hand-write)
- `options` → `DriftSliderOptions`; `modules` → `DriftSliderModule[]`;
  `on` → `Partial<DriftSliderEvents>`; shortcut props → `DriftSliderEvents['<event>']`;
  `DriftSliderHandle` from the `DriftSlider` method signatures.
- **Build-ordering dependency:** tsup's `dts` pass re-exports core types via
  `import('drift-slider')` (because `external: ['drift-slider']`), which resolves
  through the workspace symlink to core's `exports["."].types` (`dist/types`).
  Therefore the react build MUST be gated on **`npm run build -w packages/core`**
  first (core's `dist/types` must exist). Encode this in the react build script
  and CI ordering. If core types prove too thin during implementation, extend the
  core's `.d.ts` rather than hand-authoring shadow types in react.

## 5. Children / update semantics (thin, key-based — per panel)
- Mount: init with the children already in the DOM.
- **Track the children's `key` list, not just the count.** A `useEffect` compares
  the current key array to the previous; on any add / remove / **reorder /
  middle-insert**, call `slider.update()` (counting alone silently misses reorders
  and same-count swaps).
- Prominently document the **controlled-via-ref** pattern (`ref.current.slideTo(...)`,
  `ref.current.update()`) as the supported escape hatch.
- **Out of scope:** true dynamic `addSlide/removeSlide` without recompute (core
  C14), controlled `activeIndex`, data-driven `slides` array.

## 6. Build & Publish
- React package built with **tsup**: entry `src/index.tsx`, `format: ['esm']`
  (CJS optional later), `dts: true`, `external: ['react','react-dom','drift-slider']`,
  preserve the `'use client'` directive at the top of the JS output (tsup
  banner/directive handling — verify in Phase 2).
- **Versioning:** independent per package; react starts at `0.1.0`.
- Both packages unscoped → standard `npm publish`, no scope/org, no `--access`.

## 7. Testing
- **Vitest + jsdom + @testing-library/react** in `packages/react`.
- Cases: renders the `.drift-slider/.drift-track/.drift-list` scaffold; an instance
  is created on mount and `destroy()` called on unmount; `ref.slideNext()` advances;
  `onSlideChange` fires on `slideTo`; `<Slide>` renders `li.drift-slide`; changing
  the children **key set** (add, remove, **reorder**) triggers `update()`.
- Core package keeps its existing 493-test suite (relocated, unchanged).

## 8. Out of scope (future, sequenced)
- **Web Component (`<drift-slider>`) — explicit NEXT ecosystem milestone** (one
  artifact serves React/Vue/Svelte/vanilla; closes competitor gaps #21/#22).
- Vue wrapper; RTL core support (C17) — recommended before any broad launch push.
  (TypeScript declarations C18 are already shipped.)
- Controlled / data-driven React API; dynamic slide manipulation in core (C14).

## 9. Implementation phases (for the plan)
- **Phase 1 — Monorepo migration (no behaviour change to published core):**
  create workspace; `git mv` core into `packages/core`; add root `package.json` +
  `scripts/copy-docs-lib.mjs`; **rewrite `publish.yml` / `ci.yml` / `lighthouse.yml`
  for workspaces**; fix `build:docs`; regenerate lockfile; verify `drift-slider`
  still builds/tests, the docs bundle still copies, `release-it --dry-run` is clean,
  and CI is green.
- **Phase 2 — React package:** scaffold `packages/react` (`drift-slider-react`);
  implement `useDriftSlider`, `<DriftSlider>`, `<Slide>`; derive all types from core;
  key-based `update()`; tsup build gated on core's `dist/types`; Vitest tests;
  README + a docs example. Do NOT npm-publish in this work (left to a later release).
