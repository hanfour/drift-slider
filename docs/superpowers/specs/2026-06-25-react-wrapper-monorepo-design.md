# DriftSlider React Wrapper + Monorepo — Design

**Date:** 2026-06-25
**Status:** Approved (pending spec review)
**Topic:** Convert the repo to a monorepo and add an official React wrapper package.

---

## 1. Goal

Give React developers an idiomatic, typed way to use DriftSlider, and lay the
repo groundwork (workspaces) for future ecosystem packages (Vue, Web Component).

This is the first deliverable of the **ecosystem** expansion direction. Scope is
deliberately a **thin wrapper + ref** (not a controlled or data-driven component).

## 2. Decisions (locked)

| Decision | Choice |
|---|---|
| Wrapper ambition | Thin wrapper + `ref` (+ headless hook) — no controlled `activeIndex`, no data-driven slides |
| Repo structure | Full **monorepo** via **npm workspaces** (already on npm + package-lock) |
| Core package | Stays published as **`drift-slider`** (unchanged name/version), relocated to `packages/core/` |
| React package name | **`@drift-slider/react`** (scoped — requires a `drift-slider` npm scope/org) |
| Docs site | Stays at **repo root** (`docs/`, GitHub Pages for the whole project) |
| React support | **React 18 & 19**, SSR-safe (client-only init), `'use client'` for Next App Router |
| React build | **tsup** (ESM + `.d.ts`), independent version starting `0.1.0` |
| Tests | **Vitest + @testing-library/react + jsdom** |
| Spec | One combined spec; implementation sequenced as Phase 1 (migrate) → Phase 2 (wrapper) |

## 3. Target Monorepo Layout

```
drift-slider/                  # repo root (private, not published)
├── package.json               # { private: true, workspaces: ["packages/*"], scripts }
├── package-lock.json          # single lockfile for the workspace
├── .github/                   # CI (updated for workspaces)
├── docs/                      # project site (GH Pages) — STAYS AT ROOT
│   ├── assets/lib/            # built core bundle copied here by build:docs
│   ├── demos/ …
│   └── superpowers/specs/     # this spec lives here
├── packages/
│   ├── core/                  # the existing library, published as `drift-slider`
│   │   ├── package.json       # name: "drift-slider" (unchanged, 0.7.0)
│   │   ├── src/  tests/  scripts/
│   │   ├── rollup.config.mjs  vitest.config.mjs  .release-it.json
│   │   └── dist/              # built here (gitignored)
│   └── react/                 # NEW, published as `@drift-slider/react`
│       ├── package.json       # name: "@drift-slider/react", 0.1.0
│       ├── src/index.tsx
│       ├── tsup.config.ts  vitest.config.ts
│       └── dist/              # built here (gitignored)
```

### What moves where (Phase 1)
- **Into `packages/core/`:** `src/`, `tests/`, `scripts/`, `rollup.config.mjs`,
  `vitest.config.mjs`, `.release-it.json`, `lighthouserc.cjs`, `types/`,
  and the current `package.json` (name stays `drift-slider`). Use `git mv` to
  preserve history.
- **Stays at root:** `docs/` (incl. `docs/plans`, `docs/superpowers`),
  `.github/`, `README.md`, `LICENSE`, `CONTRIBUTING.md`, top-level `CHANGELOG.md`.
- **New at root:** a `package.json` with `private: true`, `workspaces`, and
  convenience scripts that delegate to workspaces.

### Path/config updates required (the bulk of Phase 1 risk)
- `build:docs` becomes a **root script**: build core, then copy
  `packages/core/dist/{esm/index.mjs,css/core.css,drift-slider-bundle.css,drift-slider.umd.js,drift-slider.jquery.js}`
  → `docs/assets/lib/`.
- CI workflows: run `npm ci` at root, `npm test`/`npm run build` per workspace.
- `lighthouserc.cjs` paths (serves `docs/`) — verify still valid from root.
- `.release-it.json` stays in `packages/core` and releases `drift-slider` from
  there (`requireBranch: main` still holds).
- Regenerate `package-lock.json` for the workspace.
- Verify `drift-slider` still publishes correctly from the subdir (`files`,
  `prepublishOnly`, `exports` paths are package-relative, so unaffected).

### Root `package.json` scripts (proposed)
```jsonc
{
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build --workspaces --if-present",
    "build:docs": "npm run build -w packages/core && npm run build:css -w packages/core && node scripts/copy-docs-lib.mjs"
  }
}
```

## 4. React Package API (`@drift-slider/react`)

### Dependencies
- `peerDependencies`: `react >=18`, `react-dom >=18`, `drift-slider` (workspace `*`).
- No CSS bundled — the consumer imports core CSS (`drift-slider/css/bundle` or
  per-module). Documented in the README.

### Public surface
```tsx
'use client'
import { DriftSlider, Slide, useDriftSlider } from '@drift-slider/react'
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
- `forwardRef<DriftSliderHandle, DriftSliderProps>`.
- **Props:**
  - `options?: DriftSliderOptions` — typed from core types.
  - `modules?: Module[]` — array of module functions (same as core).
  - `className?`, `style?` — applied to the `.drift-slider` container.
  - `on?: Partial<Record<EventName, Handler>>` — full event map (merged into `options.on`).
  - Shortcut event props: `onInit`, `onSlideChange`, `onReachBeginning`,
    `onReachEnd`, `onTouchStart`, `onTouchEnd` (merged into `on`).
  - `children` — slides (use `<Slide>` or any `<li className="drift-slide">`).
- **Renders the required scaffold:**
  `<div class="drift-slider"><div class="drift-track"><ul class="drift-list">{children}</ul></div></div>`.
- **Lifecycle:** init in `useEffect` (client only → SSR-safe); `destroy()` on
  unmount; re-init when `options`/`modules` reference changes; `slider.update()`
  in a `useEffect` keyed on `React.Children.count(children)`.
- **Ref handle** (`useImperativeHandle`):
  `{ slideTo, slideNext, slidePrev, update, instance }` where `instance` is the
  raw `DriftSlider`.

### `<Slide>` helper
- Renders `<li className={cx('drift-slide', className)} {...rest}>{children}</li>`.
  Purely ergonomic; users can also pass raw `<li className="drift-slide">`.

### `useDriftSlider(options, deps?)` hook (headless)
- Returns `[containerRef, sliderRef] as const`.
- Creates the instance in `useEffect` on the container ref, destroys on cleanup,
  re-inits when `deps` change.
- `<DriftSlider>` is implemented on top of this hook.

### Types
- Re-export core option/event/instance types; export `DriftSliderProps`,
  `DriftSliderHandle`, `SlideProps`.

## 5. Children / update semantics (thin)
- Mount: init with the children already in the DOM.
- Slide add/remove: `useEffect` on `React.Children.count(children)` calls
  `slider.update()` (recomputes sizes/snapGrid). For correct identity, document
  that slides should carry stable `key`s.
- **Out of scope:** true dynamic `addSlide/removeSlide` without recompute (core
  C14), controlled `activeIndex`, data-driven `slides` array. Documented as
  limitations with the recommended pattern (re-render children + `ref.update()`).

## 6. Build & Publish
- React package built with **tsup**: entry `src/index.tsx`, `format: ['esm']`
  (CJS optional later), `dts: true`, `external: ['react','react-dom','drift-slider']`,
  preserve the `'use client'` directive at the top of the output (tsup banner/
  directive handling — verified in Phase 2).
- **Versioning:** independent per package; React package starts at `0.1.0`.
- **npm scope prerequisite:** publishing `@drift-slider/react` requires creating
  the public `drift-slider` scope/org on npm (free). Noted for the release step.

## 7. Testing
- **Vitest + jsdom + @testing-library/react** in `packages/react`.
- Cases: renders the `.drift-slider/.drift-track/.drift-list` scaffold; an
  instance is created on mount and `destroy()` called on unmount; `ref.slideNext()`
  advances; `onSlideChange` fires on `slideTo`; `<Slide>` renders `li.drift-slide`;
  changing children count triggers `update()`.
- Core package keeps its existing 493-test suite (relocated, unchanged).

## 8. Out of scope (future, separate specs)
- Controlled / data-driven React API.
- Vue wrapper, Web Component, RTL core support.
- Dynamic slide manipulation in core (C14).

## 9. Implementation phases (for the plan)
- **Phase 1 — Monorepo migration:** create workspace, `git mv` core into
  `packages/core`, add root `package.json`, fix `build:docs`/CI/lighthouse/release
  paths, regenerate lockfile, confirm `drift-slider` still builds/tests/publishes
  and docs bundle still copies. No behaviour change to the published core.
- **Phase 2 — React package:** scaffold `packages/react` (`@drift-slider/react`),
  implement `useDriftSlider`, `<DriftSlider>`, `<Slide>`, types; tsup build;
  Vitest tests; README + a docs example; do NOT npm-publish in this work (left to
  a later release step once the npm scope exists).
