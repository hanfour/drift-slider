# React Wrapper + Monorepo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the repo into an npm-workspaces monorepo and ship an official thin React wrapper, `drift-slider-react`, without changing the published `drift-slider` package.

**Architecture:** Phase 1 relocates the existing library into `packages/core/` (still published as `drift-slider`), adds a private workspace root, and rewrites CI/release/docs automation for the new paths. Phase 2 adds `packages/react/` — a thin `forwardRef` `<DriftSlider>` component + `<Slide>` + a headless `useDriftSlider` hook — built with tsup and tested with Vitest + Testing Library.

**Tech Stack:** npm workspaces, rollup (core, unchanged), tsup (react ESM + `.d.ts` + `'use client'`), React 18/19, Vitest, @testing-library/react, jsdom.

## Global Constraints

- Core package stays **`drift-slider`**, version **`0.7.0`**, **unscoped**, relocated to `packages/core/`. **Phase 1 must not change any published-core behavior** (same build outputs, same tests pass).
- React package is **`drift-slider-react`**, **unscoped**, version **`0.1.0`**.
- Support **React 18 & 19**. **SSR-safe**: never touch the DOM during render; create the slider only inside `useEffect`. Build output must carry the **`'use client'`** directive.
- **npm workspaces** only (no pnpm/turbo). Core builds with **rollup**; react builds with **tsup**. The react build is **gated on the core build** (core `dist/types` must exist before tsup's `dts` pass re-exports it).
- Tests run with **Vitest**. React tests use **@testing-library/react** + **jsdom**.
- **`lighthouserc.cjs` stays at the repo root** (it serves the root `docs/` site).
- Wrapper is **thin + ref**: no controlled `activeIndex`, no data-driven `slides` array.
- Core's exported types (already shipped): `DriftSliderOptions`, `DriftSliderEvents` (event-name → handler map), `DriftSliderModule`, and the default-exported `DriftSlider` class (`slideTo/slideNext/slidePrev(): DriftSlider`, `update(): void`).

---

# Phase 1 — Monorepo Migration

> Phase 1 is restructuring, not feature code; its "tests" are: core still builds, all 493 core tests pass, the docs bundle still copies, `release-it --dry-run` is clean, and CI is green. Do Phase 1 on a feature branch and verify before starting Phase 2.

### Task 1: Create the workspace and relocate core

**Files:**
- Create: `package.json` (new root), `packages/core/` (moved tree)
- Move: everything below into `packages/core/` via `git mv`
- Keep at root: `docs/`, `.github/`, `scripts/copy-docs-lib.mjs` (created in Task 2), `README.md`, `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`, `lighthouserc.cjs`, `.gitignore`

**Interfaces:**
- Produces: workspace root with `packages/core` containing the unchanged `drift-slider` package; root scripts `test`/`build`/`build:css` that delegate to workspaces.

- [ ] **Step 1: Branch**

```bash
git checkout -b feat/monorepo-react-wrapper
```

- [ ] **Step 2: Move the core package into `packages/core/` (preserve history)**

```bash
mkdir -p packages/core
git mv src tests scripts rollup.config.mjs vitest.config.mjs .release-it.json package.json package-lock.json types coverage packages/core/ 2>/dev/null || true
# If `coverage/` is gitignored/untracked it will be skipped — that's fine.
```

- [ ] **Step 3: Keep the docs-only configs at root**

`lighthouserc.cjs` must stay at root (it serves `./docs`). If Step 2 moved it, move it back:

```bash
git mv packages/core/lighthouserc.cjs ./ 2>/dev/null || true
```

- [ ] **Step 4: Create the root workspace `package.json`**

Create `package.json` (root):

```json
{
  "name": "drift-slider-monorepo",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "workspaces": ["packages/*"],
  "scripts": {
    "test": "npm run test --workspaces --if-present",
    "build": "npm run build -w packages/core && npm run build -w packages/react --if-present",
    "build:css": "npm run build:css -w packages/core",
    "build:docs": "npm run build -w packages/core && npm run build:css -w packages/core && node scripts/copy-docs-lib.mjs"
  },
  "devDependencies": {}
}
```

- [ ] **Step 5: Regenerate the lockfile at root**

```bash
rm -f packages/core/package-lock.json
npm install
```

Expected: a single root `package-lock.json` is created; `node_modules/drift-slider` is symlinked to `packages/core`.

- [ ] **Step 6: Verify core still builds and tests from its new home**

```bash
npm run build -w packages/core
npm test -w packages/core
```

Expected: build succeeds; **493 tests pass** (unchanged).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(repo): move core into packages/core, add npm workspace root"
```

### Task 2: Fix the docs bundle copy

**Files:**
- Create: `scripts/copy-docs-lib.mjs` (root)
- Verify: `docs/assets/lib/*` regenerates

**Interfaces:**
- Consumes: `packages/core/dist/` build outputs.
- Produces: root `build:docs` that copies the core bundle into `docs/assets/lib/`.

- [ ] **Step 1: Create `scripts/copy-docs-lib.mjs`**

```js
import { copyFileSync, mkdirSync } from 'node:fs';

const DEST = 'docs/assets/lib';
mkdirSync(DEST, { recursive: true });

const files = [
  'packages/core/dist/esm/index.mjs',
  'packages/core/dist/css/core.css',
  'packages/core/dist/drift-slider-bundle.css',
  'packages/core/dist/drift-slider.umd.js',
  'packages/core/dist/drift-slider.jquery.js',
];

for (const src of files) {
  const name = src.split('/').pop();
  copyFileSync(src, `${DEST}/${name}`);
}
console.log(`Copied ${files.length} files to ${DEST}`);
```

- [ ] **Step 2: Run build:docs from root**

```bash
npm run build:docs
```

Expected: "Copied 5 files to docs/assets/lib"; `git status` shows `docs/assets/lib/*` unchanged or regenerated identically.

- [ ] **Step 3: Commit**

```bash
git add scripts/copy-docs-lib.mjs docs/assets/lib
git commit -m "build(docs): copy core bundle to docs/assets/lib from packages/core"
```

### Task 3: Rewrite CI / publish / lighthouse workflows for workspaces

**Files:**
- Modify: `.github/workflows/ci.yml`, `.github/workflows/publish.yml`, `.github/workflows/lighthouse.yml`

**Interfaces:**
- Produces: CI that builds/tests via the root workspace scripts; publish that targets `packages/core`.

- [ ] **Step 1: Rewrite `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20, 22]

    steps:
      - uses: actions/checkout@v4

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: npm

      - run: npm ci
      - run: npm run build
      - run: npm run build:css
      - run: npm test

      - name: Upload coverage
        if: matrix.node-version == 20
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: packages/core/coverage/
```

(Only the coverage `path` changed — the root scripts now delegate `build`/`build:css`/`test` to the workspaces.)

- [ ] **Step 2: Rewrite `.github/workflows/publish.yml`**

```yaml
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: https://registry.npmjs.org
          cache: npm

      - run: npm ci
      - run: npm test -w packages/core
      - run: npm publish -w packages/core --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

(Publishes only the core package. The react package gets its own publish path in a later release once it has a tag convention.)

- [ ] **Step 3: Rewrite `.github/workflows/lighthouse.yml`**

```yaml
name: Lighthouse CI

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - 'lighthouserc.*'
  workflow_dispatch:

jobs:
  lighthouse:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci
      - run: npm run build:docs

      - name: Run Lighthouse CI
        run: npx @lhci/cli autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

      - name: Upload Lighthouse results
        uses: actions/upload-artifact@v4
        with:
          name: lighthouse-results
          path: .lighthouseci/
```

(`build:docs` now both builds core and refreshes `docs/assets/lib`, so Lighthouse tests the real bundle. `lighthouserc.cjs` stays at root.)

- [ ] **Step 4: Commit**

```bash
git add .github/workflows
git commit -m "ci: target packages/core for build/test/publish under workspaces"
```

### Task 4: Verify the release path is intact

**Files:** none (verification only)

- [ ] **Step 1: Dry-run the core release from its package dir**

```bash
npm run release:dry -w packages/core
```

Expected: release-it computes a version and changelog with no errors; `requireBranch: main` is satisfied (or note you are on the feature branch — re-run on main before a real release).

- [ ] **Step 2: Full workspace test + build**

```bash
npm test
npm run build
npm run build:docs
```

Expected: all green; `git status` clean except intended changes.

- [ ] **Step 3: Commit any remaining changes and open Phase 1 for review**

```bash
git add -A
git commit -m "chore(repo): verify monorepo build/test/release paths" --allow-empty
```

**CHECKPOINT:** Do not start Phase 2 until Phase 1 CI is green on the PR.

---

# Phase 2 — `drift-slider-react`

### Task 5: Scaffold the react package

**Files:**
- Create: `packages/react/package.json`, `packages/react/tsconfig.json`, `packages/react/tsup.config.ts`, `packages/react/vitest.config.ts`, `packages/react/test/setup.ts`, `packages/react/src/index.tsx`, `packages/react/test/smoke.test.tsx`

**Interfaces:**
- Produces: a buildable/testable empty package importing `drift-slider`.

- [ ] **Step 1: Create `packages/react/package.json`**

```json
{
  "name": "drift-slider-react",
  "version": "0.1.0",
  "description": "Official React wrapper for DriftSlider",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" }
  },
  "files": ["dist", "src"],
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18",
    "drift-slider": "*"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "drift-slider": "*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^4.1.0",
    "jsdom": "^29.0.0"
  },
  "keywords": ["react", "slider", "carousel", "drift-slider"],
  "license": "MIT"
}
```

- [ ] **Step 2: Create `packages/react/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/react/tsup.config.ts`**

```ts
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'drift-slider'],
  banner: { js: "'use client';" },
});
```

- [ ] **Step 4: Create `packages/react/vitest.config.ts`** (alias `drift-slider` to core source so tests need no core build)

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const coreSrc = fileURLToPath(new URL('../core/src', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'drift-slider/modules': `${coreSrc}/modules/index.js`,
      'drift-slider': `${coreSrc}/index.js`,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
});
```

- [ ] **Step 5: Create `packages/react/test/setup.ts`**

```ts
import '@testing-library/react';
```

- [ ] **Step 6: Create a placeholder `packages/react/src/index.tsx`**

```tsx
export const VERSION = '0.1.0';
```

- [ ] **Step 7: Create `packages/react/test/smoke.test.tsx`**

```tsx
import { describe, it, expect } from 'vitest';
import { VERSION } from '../src/index';

describe('package', () => {
  it('exports a version', () => {
    expect(VERSION).toBe('0.1.0');
  });
});
```

- [ ] **Step 8: Install + run the smoke test**

```bash
npm install
npm test -w packages/react
```

Expected: 1 test passes.

- [ ] **Step 9: Commit**

```bash
git add packages/react
git commit -m "feat(react): scaffold drift-slider-react package"
```

### Task 6: `useDriftSlider` hook

**Files:**
- Modify: `packages/react/src/index.tsx`
- Test: `packages/react/test/use-drift-slider.test.tsx`

**Interfaces:**
- Produces: `useDriftSlider(options?, deps?) => readonly [RefObject<HTMLDivElement>, RefObject<DriftSlider | null>]`. Creates the slider on the container ref in `useEffect`, destroys on unmount, re-inits when `deps` change.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach } from 'vitest';
import { useDriftSlider } from '../src/index';

afterEach(cleanup);

function Harness({ onReady }: { onReady: (s: unknown) => void }) {
  const [containerRef, sliderRef] = useDriftSlider({});
  // expose the slider once mounted
  const ref = useRef(false);
  if (!ref.current) { ref.current = true; queueMicrotask(() => onReady(sliderRef.current)); }
  return (
    <div className="drift-slider" ref={containerRef}>
      <div className="drift-track"><ul className="drift-list">
        <li className="drift-slide">A</li>
        <li className="drift-slide">B</li>
      </ul></div>
    </div>
  );
}

describe('useDriftSlider', () => {
  it('creates a slider instance on mount and destroys it on unmount', async () => {
    const onReady = vi.fn();
    const { unmount } = render(<Harness onReady={onReady} />);
    await vi.waitFor(() => expect(onReady).toHaveBeenCalled());
    const slider = onReady.mock.calls[0][0] as { destroyed: boolean };
    expect(slider).toBeTruthy();
    expect(slider.destroyed).toBe(false);
    unmount();
    expect(slider.destroyed).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w packages/react -- use-drift-slider`
Expected: FAIL — `useDriftSlider is not exported`.

- [ ] **Step 3: Implement the hook in `src/index.tsx`**

Replace the file contents with:

```tsx
import { useEffect, useRef } from 'react';
import DriftSlider, { type DriftSliderOptions } from 'drift-slider';

export function useDriftSlider(
  options?: DriftSliderOptions,
  deps: unknown[] = [],
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<DriftSlider | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slider = new DriftSlider(el, options);
    sliderRef.current = slider;
    return () => {
      slider.destroy();
      sliderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [containerRef, sliderRef] as const;
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w packages/react -- use-drift-slider`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/index.tsx packages/react/test/use-drift-slider.test.tsx
git commit -m "feat(react): add useDriftSlider hook"
```

### Task 7: `<Slide>` component

**Files:**
- Modify: `packages/react/src/index.tsx`
- Test: `packages/react/test/slide.test.tsx`

**Interfaces:**
- Produces: `Slide(props: SlideProps)` rendering `<li className="drift-slide ...">`. `SlideProps extends LiHTMLAttributes<HTMLLIElement>`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Slide } from '../src/index';

afterEach(cleanup);

describe('Slide', () => {
  it('renders an li.drift-slide and merges className', () => {
    const { container } = render(<Slide className="x">hi</Slide>);
    const li = container.querySelector('li')!;
    expect(li.classList.contains('drift-slide')).toBe(true);
    expect(li.classList.contains('x')).toBe(true);
    expect(li.textContent).toBe('hi');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w packages/react -- slide`
Expected: FAIL — `Slide is not exported`.

- [ ] **Step 3: Add `cx` + `Slide` to `src/index.tsx`**

Add these exports (keep the existing hook):

```tsx
import type { LiHTMLAttributes, ReactNode } from 'react';

export function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface SlideProps extends LiHTMLAttributes<HTMLLIElement> {
  children?: ReactNode;
}

export function Slide({ className, children, ...rest }: SlideProps) {
  return (
    <li className={cx('drift-slide', className)} {...rest}>
      {children}
    </li>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w packages/react -- slide`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/index.tsx packages/react/test/slide.test.tsx
git commit -m "feat(react): add Slide component"
```

### Task 8: `<DriftSlider>` — scaffold + init/destroy lifecycle

**Files:**
- Modify: `packages/react/src/index.tsx`
- Test: `packages/react/test/drift-slider.test.tsx`

**Interfaces:**
- Consumes: `useDriftSlider`, `cx`.
- Produces: `DriftSlider` (forwardRef component) rendering the `.drift-slider/.drift-track/.drift-list` scaffold; props `options?`, `className?`, `style?`, `children?` (more props added in Task 9–10). Default export is the component.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { DriftSlider, Slide } from '../src/index';

afterEach(cleanup);

describe('DriftSlider', () => {
  it('renders the slider scaffold with slides', () => {
    const { container } = render(
      <DriftSlider className="x">
        <Slide>A</Slide>
        <Slide>B</Slide>
      </DriftSlider>,
    );
    expect(container.querySelector('.drift-slider.x')).toBeTruthy();
    expect(container.querySelector('.drift-track')).toBeTruthy();
    expect(container.querySelectorAll('.drift-list > .drift-slide').length).toBe(2);
  });

  it('calls onInit on mount', async () => {
    const onInit = vi.fn();
    render(
      <DriftSlider options={{ on: { init: onInit } }}>
        <Slide>A</Slide>
      </DriftSlider>,
    );
    await vi.waitFor(() => expect(onInit).toHaveBeenCalled());
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w packages/react -- drift-slider`
Expected: FAIL — `DriftSlider is not exported`.

- [ ] **Step 3: Implement the component in `src/index.tsx`**

Add the import of `forwardRef` and the component (the ref handle is fleshed out in Task 9, here it forwards a minimal handle):

```tsx
import { forwardRef } from 'react';
import type { CSSProperties } from 'react';
import type { DriftSliderModule, DriftSliderEvents } from 'drift-slider';

export interface DriftSliderProps {
  options?: DriftSliderOptions;
  modules?: DriftSliderModule[];
  on?: Partial<DriftSliderEvents>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export const DriftSlider = forwardRef<unknown, DriftSliderProps>(
  function DriftSlider({ options, className, style, children }, _ref) {
    const [containerRef] = useDriftSlider(options, [options]);
    return (
      <div className={cx('drift-slider', className)} style={style} ref={containerRef}>
        <div className="drift-track">
          <ul className="drift-list">{children}</ul>
        </div>
      </div>
    );
  },
);

export default DriftSlider;
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w packages/react -- drift-slider`
Expected: PASS (both tests).

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/index.tsx packages/react/test/drift-slider.test.tsx
git commit -m "feat(react): add DriftSlider component scaffold + lifecycle"
```

### Task 9: `<DriftSlider>` — modules, event shortcuts, ref handle

**Files:**
- Modify: `packages/react/src/index.tsx`
- Test: `packages/react/test/drift-slider-handle.test.tsx`

**Interfaces:**
- Produces: `DriftSliderHandle = { slideTo; slideNext; slidePrev; update(): void; instance: DriftSlider | null }`; `modules` prop merged into `options.modules`; shortcut event props `onInit/onSlideChange/onReachBeginning/onReachEnd/onTouchStart/onTouchEnd` merged into `options.on`.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { DriftSlider, Slide, type DriftSliderHandle } from '../src/index';

afterEach(cleanup);

describe('DriftSlider ref + events', () => {
  it('exposes slideNext via ref and fires onSlideChange', async () => {
    const onSlideChange = vi.fn();
    let handle: DriftSliderHandle | null = null;
    function App() {
      const ref = useRef<DriftSliderHandle>(null);
      // capture after mount
      queueMicrotask(() => { handle = ref.current; });
      return (
        <DriftSlider ref={ref} onSlideChange={onSlideChange}>
          <Slide>A</Slide>
          <Slide>B</Slide>
          <Slide>C</Slide>
        </DriftSlider>
      );
    }
    render(<App />);
    await vi.waitFor(() => expect(handle).toBeTruthy());
    handle!.slideNext(0);
    expect(handle!.instance).toBeTruthy();
    expect(handle!.instance!.activeIndex).toBe(1);
    expect(onSlideChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w packages/react -- drift-slider-handle`
Expected: FAIL — `handle.slideNext is not a function` / `DriftSliderHandle` not exported.

- [ ] **Step 3: Replace the component to merge props and expose the handle**

Replace the `DriftSliderProps`/`DriftSlider` block from Task 8 with:

```tsx
import { useEffect, useImperativeHandle, useRef } from 'react';

export interface DriftSliderHandle {
  slideTo: DriftSlider['slideTo'];
  slideNext: DriftSlider['slideNext'];
  slidePrev: DriftSlider['slidePrev'];
  update: () => void;
  instance: DriftSlider | null;
}

type EventShortcuts = {
  onInit?: DriftSliderEvents['init'];
  onSlideChange?: DriftSliderEvents['slideChange'];
  onReachBeginning?: DriftSliderEvents['reachBeginning'];
  onReachEnd?: DriftSliderEvents['reachEnd'];
  onTouchStart?: DriftSliderEvents['touchStart'];
  onTouchEnd?: DriftSliderEvents['touchEnd'];
};

const SHORTCUTS: Record<keyof EventShortcuts, keyof DriftSliderEvents> = {
  onInit: 'init',
  onSlideChange: 'slideChange',
  onReachBeginning: 'reachBeginning',
  onReachEnd: 'reachEnd',
  onTouchStart: 'touchStart',
  onTouchEnd: 'touchEnd',
};

export interface DriftSliderProps extends EventShortcuts {
  options?: DriftSliderOptions;
  modules?: DriftSliderModule[];
  on?: Partial<DriftSliderEvents>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export const DriftSlider = forwardRef<DriftSliderHandle, DriftSliderProps>(
  function DriftSlider(props, ref) {
    const { options, modules, on, className, style, children, ...shortcuts } = props;

    const mergedOn: Partial<DriftSliderEvents> = { ...on };
    (Object.keys(SHORTCUTS) as (keyof EventShortcuts)[]).forEach((key) => {
      const handler = (shortcuts as EventShortcuts)[key];
      if (handler) {
        // each shortcut maps 1:1 to its event; signatures already match
        (mergedOn as Record<string, unknown>)[SHORTCUTS[key]] = handler;
      }
    });

    const mergedOptions: DriftSliderOptions = {
      ...options,
      modules: [...(options?.modules ?? []), ...(modules ?? [])],
      on: mergedOn,
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<DriftSlider | null>(null);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const slider = new DriftSlider(el, mergedOptions);
      sliderRef.current = slider;
      return () => {
        slider.destroy();
        sliderRef.current = null;
      };
      // re-init only when options/modules identity changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, modules]);

    useImperativeHandle(ref, () => ({
      slideTo: (...args) => sliderRef.current!.slideTo(...args),
      slideNext: (...args) => sliderRef.current!.slideNext(...args),
      slidePrev: (...args) => sliderRef.current!.slidePrev(...args),
      update: () => sliderRef.current?.update(),
      get instance() {
        return sliderRef.current;
      },
    }), []);

    return (
      <div className={cx('drift-slider', className)} style={style} ref={containerRef}>
        <div className="drift-track">
          <ul className="drift-list">{children}</ul>
        </div>
      </div>
    );
  },
);

export default DriftSlider;
```

(Remove the Task-8 version of `DriftSliderProps`/`DriftSlider`; this supersedes it. The hook `useDriftSlider` from Task 6 stays exported for headless use.)

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w packages/react`
Expected: all tests pass (smoke, hook, slide, scaffold, handle).

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/index.tsx packages/react/test/drift-slider-handle.test.tsx
git commit -m "feat(react): merge modules/events and expose ref handle"
```

### Task 10: `<DriftSlider>` — key-based children update

**Files:**
- Modify: `packages/react/src/index.tsx`
- Test: `packages/react/test/children-update.test.tsx`

**Interfaces:**
- Produces: the component calls `slider.update()` whenever the children's key signature changes (add / remove / reorder), not merely the count.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { DriftSlider, Slide, type DriftSliderHandle } from '../src/index';

afterEach(cleanup);

describe('DriftSlider children update', () => {
  it('calls update() when the children key set changes', async () => {
    let handle: DriftSliderHandle | null = null;
    function App({ keys }: { keys: string[] }) {
      const ref = useRef<DriftSliderHandle>(null);
      queueMicrotask(() => { handle = ref.current; });
      return (
        <DriftSlider ref={ref}>
          {keys.map((k) => <Slide key={k}>{k}</Slide>)}
        </DriftSlider>
      );
    }
    const { rerender } = render(<App keys={['a', 'b']} />);
    await vi.waitFor(() => expect(handle).toBeTruthy());
    const spy = vi.spyOn(handle!.instance!, 'update');
    rerender(<App keys={['a', 'b', 'c']} />); // add
    expect(spy).toHaveBeenCalledTimes(1);
    rerender(<App keys={['c', 'b', 'a']} />); // reorder (same count)
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -w packages/react -- children-update`
Expected: FAIL — `update` called 0 times (or only on add, not on reorder).

- [ ] **Step 3: Add a `childrenKeys` helper and the key-effect**

Add near `cx`:

```tsx
import { Children, isValidElement } from 'react';

function childrenKeys(children: ReactNode): string {
  return Children.toArray(children)
    .map((c, i) => (isValidElement(c) && c.key != null ? String(c.key) : `__i${i}`))
    .join('|');
}
```

Inside the component body, after the init `useEffect`, add:

```tsx
    const keySig = childrenKeys(children);
    const didMount = useRef(false);
    useEffect(() => {
      if (!didMount.current) {
        didMount.current = true;
        return; // initial render already built the right DOM
      }
      sliderRef.current?.update();
    }, [keySig]);
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm test -w packages/react`
Expected: all tests pass; `update()` fires on add and on reorder, not on initial mount.

- [ ] **Step 5: Commit**

```bash
git add packages/react/src/index.tsx packages/react/test/children-update.test.tsx
git commit -m "feat(react): update slider on children key changes"
```

### Task 11: Build with tsup (types + 'use client'), gated on core build

**Files:**
- Verify: `packages/react/dist/index.js`, `packages/react/dist/index.d.ts`

**Interfaces:**
- Produces: ESM build with `.d.ts` that re-exports core types, and a `'use client'` first line.

- [ ] **Step 1: Build core first (provides dist/types for the dts re-export)**

```bash
npm run build -w packages/core
```

Expected: `packages/core/dist/types/index.d.ts` exists.

- [ ] **Step 2: Build the react package**

```bash
npm run build -w packages/react
```

Expected: `packages/react/dist/index.js` and `packages/react/dist/index.d.ts` are produced with no type errors.

- [ ] **Step 3: Verify the `'use client'` directive and type re-export**

```bash
head -1 packages/react/dist/index.js
grep -c "DriftSliderProps" packages/react/dist/index.d.ts
```

Expected: first line is `'use client';`; the `.d.ts` contains `DriftSliderProps` (and imports types from `drift-slider`).

- [ ] **Step 4: Wire the root build order**

Confirm the root `package.json` `build` script builds core before react (already `npm run build -w packages/core && npm run build -w packages/react --if-present` from Task 1). Run the whole thing:

```bash
npm run build
```

Expected: both packages build, in order.

- [ ] **Step 5: Commit**

```bash
git add packages/react
git commit -m "build(react): tsup ESM + d.ts with 'use client', gated on core build"
```

### Task 12: README + docs example

**Files:**
- Create: `packages/react/README.md`
- Modify: `README.md` (root) — add a short "React" section linking to the package

**Interfaces:** none (documentation).

- [ ] **Step 1: Create `packages/react/README.md`**

```markdown
# drift-slider-react

Official React wrapper for [DriftSlider](https://github.com/hanfour/drift-slider).

## Install

```bash
npm i drift-slider drift-slider-react
```

## Usage

```tsx
'use client';
import { DriftSlider, Slide } from 'drift-slider-react';
import { Navigation, Pagination } from 'drift-slider/modules';
import 'drift-slider/css/bundle';

export function Carousel() {
  return (
    <DriftSlider
      options={{ loop: true, navigation: true, pagination: true }}
      modules={[Navigation, Pagination]}
      onSlideChange={(s) => console.log(s.realIndex)}
    >
      <Slide>Slide 1</Slide>
      <Slide>Slide 2</Slide>
    </DriftSlider>
  );
}
```

### Imperative control (ref)

```tsx
const ref = useRef<DriftSliderHandle>(null);
// ref.current.slideNext(); ref.current.slideTo(2); ref.current.update();
<DriftSlider ref={ref}>…</DriftSlider>
```

### Headless hook

```tsx
const [containerRef] = useDriftSlider({ loop: true });
return <div className="drift-slider" ref={containerRef}>…your scaffold…</div>;
```

## Notes
- SSR-safe: the slider initialises in `useEffect` (client only); add `'use client'` in Next.js App Router.
- Slides should carry stable `key`s; changing the key set re-runs `update()`.
- Dynamic per-slide add/remove without recompute is not supported (use `ref.update()`).
```

- [ ] **Step 2: Add a "React" section to the root `README.md`** (append under the existing usage docs)

```markdown
## React

An official React wrapper is available as `drift-slider-react`:

```bash
npm i drift-slider drift-slider-react
```

See [`packages/react/README.md`](packages/react/README.md) for usage.
```

- [ ] **Step 3: Commit**

```bash
git add packages/react/README.md README.md
git commit -m "docs(react): add usage README for drift-slider-react"
```

---

## Self-Review (completed)

- **Spec coverage:** Monorepo layout (Tasks 1–2), CI/publish/lighthouse rewrite incl. the `publish.yml` gap (Task 3), release verification (Task 4), thin component + hook + Slide (Tasks 6–10), type derivation from core's named types (Tasks 6/9, verified in 11), key-based update (Task 10), two-bundler split (rollup core / tsup react, Task 11), `'use client'` + SSR (Tasks 5/11), README + docs (Task 12). Web Component is explicitly out of scope (§8 of spec). All covered.
- **Spec correction applied:** `lighthouserc.cjs` stays at **root** (Task 1 Step 3), not in `packages/core` — it serves the root `docs/` site.
- **Placeholders:** none — every code/command step has concrete content.
- **Type consistency:** `DriftSliderHandle`, `DriftSliderProps`, `useDriftSlider`, `Slide`, `cx`, `childrenKeys` are defined once and reused with consistent signatures; imports use the verified core exports (`DriftSliderOptions`, `DriftSliderEvents`, `DriftSliderModule`, default `DriftSlider`).
