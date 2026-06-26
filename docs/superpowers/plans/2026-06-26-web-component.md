# `<drift-slider>` Web Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an official `<drift-slider>` Custom Element (`drift-slider-element`) that wraps the `drift-slider` core for CDN and non-React framework users.

**Architecture:** Light-DOM custom element. On connect it defers one microtask, ensures the `.drift-slider/.drift-track/.drift-list` scaffold (moving author children), then `new DriftSlider(thisEl, options)`. Config via properties (rich) + attributes (CDN). Modules via a `registerModules` registry. Events re-dispatched as `drift:*` CustomEvents. Built as ESM (bundlers) + IIFE (CDN).

**Tech Stack:** TypeScript, tsup (ESM + IIFE), Vitest + jsdom, peer-depends on `drift-slider`.

**Design spec:** `docs/superpowers/specs/2026-06-26-web-component-design.md` (read it once for rationale).

## Global Constraints

- Package name: **`drift-slider-element`** (unscoped); new workspace `packages/element`.
- Peer dependency floor: **`drift-slider >= 0.7.0`**.
- Element tag: **`drift-slider`**.
- ESM entry is **side-effect-free** and must **not** call `customElements.define`. Registration is opt-in (`./define`); the CDN IIFE self-registers.
- Event names: native `CustomEvent`, **`drift:` prefix, all lowercase**, `bubbles: true, composed: false`.
- `detail` is a **serializable summary** `{ activeIndex, previousIndex, progress, isBeginning, isEnd }`; the raw instance is on the element's `.instance` getter.
- Scaffold mutation is a DOM **move** (never clone / `innerHTML`) and never touches author `id` attributes.
- Imperative API mirrors `drift-slider-react`'s `DriftSliderHandle`: `slideTo/slideNext/slidePrev/update/activeIndex/instance` + `destroy`.
- Core is imported as `CoreDriftSlider` (avoid clashing with the element class name).
- Modules registry keys are normalized: `name.toLowerCase().replace(/[^a-z0-9]/g, '')`.
- Tests run on `npm test -w packages/element` (Vitest + jsdom), real `customElements` registration, real behaviour (no mocking the core).

## Core API facts (for implementers)

- Constructor: `new CoreDriftSlider(el, options = {})` — `el` is the `.drift-slider` container; throws `Error('DriftSlider: list element (.drift-list) not found')` if `.drift-list` is absent.
- Instance methods: `slideTo(index, speed?, runCallbacks?)`, `slideNext(speed?)`, `slidePrev(speed?)`, `update()`, `destroy()`.
- Instance props: `realIndex`, `activeIndex`, `previousIndex`, `progress`, `isBeginning`, `isEnd`, `destroyed`.
- Events via `options.on`: `{ slideChange: (slider) => {}, init: (slider) => {}, ... }`. Event names: `init`, `slideChange`, `reachBeginning`, `reachEnd`, `touchStart`, `touchEnd`, `destroy`.
- Module exports (`drift-slider/modules`): `Navigation, Pagination, Autoplay, EffectFade, EffectCoverflow, EffectCards, EffectCreative, EffectShowcase, EffectDeck, Keyboard, A11y, ScrollAos, Thumbs`.
- Type exports (`drift-slider`): default `DriftSlider` class, `DriftSliderOptions`, `DriftSliderModule`, `DriftSliderEvents`.

## File Structure (`packages/element/`)

- `package.json`, `tsconfig.json`, `tsup.config.ts`, `vitest.config.ts`, `test/setup.ts` — scaffold.
- `src/registry.ts` — `registerModules`, `resolveModuleNames`, `moduleForEffect`, `clearRegistry` (test helper).
- `src/attributes.ts` — `OBSERVED_ATTRIBUTES`, option/module attr sets, `coerceAttr`, `attrToOption`.
- `src/events.ts` — `CORE_EVENTS`, `eventName`, `buildDetail`.
- `src/element.ts` — `DriftSliderElement` class (lifecycle, scaffold, config, modules, events, imperative).
- `src/index.ts` — ESM entry: re-export class + `registerModules` + types. **No define.**
- `src/define.ts` — imports class + `customElements.define` (guarded).
- `src/cdn.ts` — IIFE: `registerModules(all)`, define, inject CSS once.
- `src/with-css.ts` — opt-in CSS injection side-effect.
- `src/jsx.d.ts` — `HTMLElementTagNameMap` + JSX `IntrinsicElements` augmentation.
- `test/*.test.ts` — one per behaviour area.
- `README.md`.
- Core: `packages/core/src/styles/drift-slider.scss` (FOUC rule).
- Root: `package.json` (build:element), `.github/workflows/*` (CI/publish), `docs/demos/web-component.html`, `docs/demos.html`.

---

### Task 1: Workspace scaffold + module registry

**Files:**
- Create: `packages/element/package.json`, `packages/element/tsconfig.json`, `packages/element/vitest.config.ts`, `packages/element/test/setup.ts`
- Create: `packages/element/src/registry.ts`
- Test: `packages/element/test/registry.test.ts`
- Modify: root `package.json` (add `build:element` placeholder script wiring is added in Task 10; here only `test` already globs workspaces)

**Interfaces:**
- Produces: `registerModules(map: Record<string, DriftSliderModule>): void`; `resolveModuleNames(names: string[]): DriftSliderModule[]` (case/separator-insensitive, unknown → `console.warn`); `moduleForEffect(effect: string): DriftSliderModule | undefined`; `clearRegistry(): void`.

- [ ] **Step 1: Create the package scaffold**

`packages/element/package.json`:
```json
{
  "name": "drift-slider-element",
  "version": "0.1.0",
  "description": "Official <drift-slider> Web Component for DriftSlider",
  "type": "module",
  "scripts": {
    "build": "tsup",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "drift-slider": ">=0.7.0"
  },
  "devDependencies": {
    "drift-slider": "*",
    "tsup": "^8.0.0",
    "typescript": "^5.4.0",
    "vitest": "^4.1.0",
    "jsdom": "^29.0.0"
  },
  "keywords": ["web-component", "custom-element", "slider", "carousel", "drift-slider"],
  "license": "MIT"
}
```

`packages/element/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "esModuleInterop": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```

`packages/element/vitest.config.ts` (mirrors the react package's core-src alias):
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

`packages/element/test/setup.ts`:
```ts
// jsdom provides customElements + CustomEvent. No extra globals needed yet.
export {};
```

- [ ] **Step 2: Install so the workspace links** — Run: `npm install` (from repo root). Expected: `node_modules/drift-slider-element` symlink created, root `package-lock.json` updated.

- [ ] **Step 3: Write the failing registry test**

`packages/element/test/registry.test.ts`:
```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { Navigation, EffectFade } from 'drift-slider/modules';
import { registerModules, resolveModuleNames, moduleForEffect, clearRegistry } from '../src/registry';

afterEach(() => clearRegistry());

describe('module registry', () => {
  it('resolves registered names case/separator-insensitively', () => {
    registerModules({ Navigation, EffectFade });
    expect(resolveModuleNames(['navigation'])).toEqual([Navigation]);
    expect(resolveModuleNames(['Navigation', 'effect-fade'])).toEqual([Navigation, EffectFade]);
  });

  it('warns and skips unknown names', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveModuleNames(['nope'])).toEqual([]);
    expect(warn).toHaveBeenCalledWith('DriftSlider: unknown module "nope", ignoring');
    warn.mockRestore();
  });

  it('maps an effect name to its module', () => {
    registerModules({ EffectFade });
    expect(moduleForEffect('fade')).toBe(EffectFade);
    expect(moduleForEffect('nonesuch')).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run it, verify it fails** — Run: `npm test -w packages/element`. Expected: FAIL ("Cannot find module '../src/registry'").

- [ ] **Step 5: Implement `src/registry.ts`**

```ts
import type { DriftSliderModule } from 'drift-slider';

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const registry = new Map<string, DriftSliderModule>();

export function registerModules(map: Record<string, DriftSliderModule>): void {
  for (const [name, mod] of Object.entries(map)) registry.set(norm(name), mod);
}

export function resolveModuleNames(names: string[]): DriftSliderModule[] {
  const out: DriftSliderModule[] = [];
  for (const raw of names) {
    const key = norm(raw);
    if (!key) continue;
    const mod = registry.get(key);
    if (mod) out.push(mod);
    else console.warn(`DriftSlider: unknown module "${raw}", ignoring`);
  }
  return out;
}

// 'fade' -> the EffectFade module (registered as 'effectfade')
export function moduleForEffect(effect: string): DriftSliderModule | undefined {
  return registry.get(`effect${norm(effect)}`);
}

export function clearRegistry(): void {
  registry.clear();
}
```

- [ ] **Step 6: Run tests, verify pass** — Run: `npm test -w packages/element`. Expected: PASS (3 tests).

- [ ] **Step 7: Commit**
```bash
git add packages/element package-lock.json
git commit -m "feat(element): scaffold drift-slider-element workspace + module registry"
```

---

### Task 2: Attribute coercion + maps

**Files:**
- Create: `packages/element/src/attributes.ts`
- Test: `packages/element/test/attributes.test.ts`

**Interfaces:**
- Produces: `OBSERVED_ATTRIBUTES: string[]`; `OPTION_ATTRS: Set<string>`; `MODULE_ATTRS: Record<string,string>` (attr name → registered module name); `coerceAttr(name: string, value: string | null): unknown`; `attrToOption(name: string): string`.

- [ ] **Step 1: Write the failing test**

`packages/element/test/attributes.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { coerceAttr, attrToOption, OBSERVED_ATTRIBUTES, MODULE_ATTRS } from '../src/attributes';

describe('attribute coercion', () => {
  it('treats boolean attrs by presence, with the Angular "false" string guard', () => {
    expect(coerceAttr('loop', '')).toBe(true);     // <drift-slider loop>
    expect(coerceAttr('loop', 'false')).toBe(false); // [loop]="false" -> "false"
    expect(coerceAttr('loop', null)).toBe(false);    // absent
  });

  it('coerces number attrs, dropping NaN', () => {
    expect(coerceAttr('slides-per-view', '3')).toBe(3);
    expect(coerceAttr('space-between', '12.5')).toBe(12.5);
    expect(coerceAttr('speed', 'abc')).toBeUndefined();
  });

  it('passes string enums through', () => {
    expect(coerceAttr('direction', 'vertical')).toBe('vertical');
    expect(coerceAttr('effect', 'fade')).toBe('fade');
  });

  it('maps kebab attr names to camelCase option keys', () => {
    expect(attrToOption('slides-per-view')).toBe('slidesPerView');
    expect(attrToOption('loop')).toBe('loop');
  });

  it('lists module-toggle attrs and the full observed set', () => {
    expect(MODULE_ATTRS).toMatchObject({ navigation: 'navigation', pagination: 'pagination', keyboard: 'keyboard', autoplay: 'autoplay' });
    expect(OBSERVED_ATTRIBUTES).toContain('config');
    expect(OBSERVED_ATTRIBUTES).toContain('modules');
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- attributes`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/attributes.ts`**

```ts
// Attrs that map to a module toggle (presence = include that registered module)
export const MODULE_ATTRS: Record<string, string> = {
  navigation: 'navigation',
  pagination: 'pagination',
  keyboard: 'keyboard',
  autoplay: 'autoplay',
};

// Attrs that map to a core option key (after attrToOption)
export const OPTION_ATTRS = new Set<string>([
  'loop', 'slides-per-view', 'space-between', 'effect', 'direction',
  'speed', 'initial-slide', 'centered-slides',
]);

const BOOLEAN_ATTRS = new Set<string>([
  'loop', 'centered-slides', ...Object.keys(MODULE_ATTRS),
]);
const NUMBER_ATTRS = new Set<string>([
  'slides-per-view', 'space-between', 'speed', 'initial-slide',
]);

export const OBSERVED_ATTRIBUTES: string[] = [
  'config', 'modules', 'effect', 'direction',
  ...OPTION_ATTRS, ...Object.keys(MODULE_ATTRS),
].filter((v, i, a) => a.indexOf(v) === i);

export function coerceAttr(name: string, value: string | null): unknown {
  if (BOOLEAN_ATTRS.has(name)) return value !== null && value !== 'false';
  if (NUMBER_ATTRS.has(name)) {
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
  }
  return value ?? undefined;
}

export function attrToOption(name: string): string {
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- attributes`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/attributes.ts packages/element/test/attributes.test.ts
git commit -m "feat(element): attribute coercion + option/module attr maps"
```

---

### Task 3: Event mapping (pure)

**Files:**
- Create: `packages/element/src/events.ts`
- Test: `packages/element/test/events.test.ts`

**Interfaces:**
- Produces: `CORE_EVENTS: string[]` (the 7 core event names); `eventName(core: string): string` (`'slideChange'` → `'drift:slidechange'`); `buildDetail(slider: { realIndex: number; previousIndex: number; progress: number; isBeginning: boolean; isEnd: boolean }): { activeIndex: number; previousIndex: number; progress: number; isBeginning: boolean; isEnd: boolean }`.

- [ ] **Step 1: Write the failing test**

`packages/element/test/events.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { CORE_EVENTS, eventName, buildDetail } from '../src/events';

describe('event mapping', () => {
  it('covers the core events and lowercases with a drift: prefix', () => {
    expect(CORE_EVENTS).toEqual([
      'init', 'slideChange', 'reachBeginning', 'reachEnd', 'touchStart', 'touchEnd', 'destroy',
    ]);
    expect(eventName('slideChange')).toBe('drift:slidechange');
    expect(eventName('reachBeginning')).toBe('drift:reachbeginning');
  });

  it('builds a serializable detail from instance state', () => {
    const slider = { realIndex: 2, previousIndex: 1, progress: 0.4, isBeginning: false, isEnd: false };
    expect(buildDetail(slider)).toEqual({
      activeIndex: 2, previousIndex: 1, progress: 0.4, isBeginning: false, isEnd: false,
    });
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- events`. Expected: FAIL.

- [ ] **Step 3: Implement `src/events.ts`**

```ts
export const CORE_EVENTS = [
  'init', 'slideChange', 'reachBeginning', 'reachEnd', 'touchStart', 'touchEnd', 'destroy',
] as const;

export function eventName(core: string): string {
  return `drift:${core.toLowerCase()}`;
}

interface SliderState {
  realIndex: number;
  previousIndex: number;
  progress: number;
  isBeginning: boolean;
  isEnd: boolean;
}

export function buildDetail(s: SliderState) {
  return {
    activeIndex: s.realIndex,
    previousIndex: s.previousIndex,
    progress: s.progress,
    isBeginning: s.isBeginning,
    isEnd: s.isEnd,
  };
}
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- events`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/events.ts packages/element/test/events.test.ts
git commit -m "feat(element): core->CustomEvent name map + serializable detail"
```

---

### Task 4: Element lifecycle (init / destroy / upgrade)

Builds the element class with the deferred-init lifecycle, operating on an **already-valid scaffold** (tests provide `.drift-track>.drift-list` markup). Scaffold generation is Task 5.

**Files:**
- Create: `packages/element/src/element.ts`
- Test: `packages/element/test/lifecycle.test.ts`

**Interfaces:**
- Produces: `class DriftSliderElement extends HTMLElement` with `config`/`modules` properties, `connectedCallback`/`disconnectedCallback`/`attributeChangedCallback`, and a private `_init()` that constructs `new CoreDriftSlider(this, this._buildOptions())`. `_buildOptions()` in this task returns `{ ...this._config, modules: this._modules }` (config/attr/module wiring arrive in Tasks 6-8). Exposes `instance` getter.
- Consumes: `OBSERVED_ATTRIBUTES` (Task 2).

- [ ] **Step 1: Write the failing test**

`packages/element/test/lifecycle.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

// Markup with a valid pre-built scaffold (Task 5 makes this optional).
function mountWithScaffold(): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  el.innerHTML = `<div class="drift-track"><ul class="drift-list">
    <li class="drift-slide">a</li><li class="drift-slide">b</li></ul></div>`;
  document.body.appendChild(el);
  return el;
}

describe('element lifecycle', () => {
  it('initialises a core instance one microtask after connect', async () => {
    const el = mountWithScaffold();
    expect(el.instance).toBeNull();           // not yet (deferred)
    await Promise.resolve();                    // flush microtask
    expect(el.instance).toBeTruthy();
    expect(el.instance!.destroyed).toBe(false);
  });

  it('destroys the instance on disconnect', async () => {
    const el = mountWithScaffold();
    await Promise.resolve();
    const inst = el.instance!;
    el.remove();
    expect(inst.destroyed).toBe(true);
    expect(el.instance).toBeNull();
  });

  it('cancels a pending init if disconnected before the microtask flush', async () => {
    const el = mountWithScaffold();
    el.remove();                                // disconnect before flush
    await Promise.resolve();
    expect(el.instance).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- lifecycle`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/element.ts` (lifecycle skeleton)**

```ts
import CoreDriftSlider from 'drift-slider';
import type { DriftSliderOptions, DriftSliderModule } from 'drift-slider';
import { OBSERVED_ATTRIBUTES } from './attributes';

const UPGRADE_PROPS = ['config', 'modules'] as const;

export class DriftSliderElement extends HTMLElement {
  static get observedAttributes(): string[] {
    return OBSERVED_ATTRIBUTES;
  }

  private _slider: CoreDriftSlider | null = null;
  private _config: DriftSliderOptions = {};
  private _modules: DriftSliderModule[] = [];
  private _initPending = false;

  constructor() {
    super();
    // property-upgrade: route any props set before define through the setters
    for (const prop of UPGRADE_PROPS) {
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = (this as Record<string, unknown>)[prop];
        delete (this as Record<string, unknown>)[prop];
        (this as Record<string, unknown>)[prop] = value;
      }
    }
  }

  get instance(): CoreDriftSlider | null {
    return this._slider;
  }

  get config(): DriftSliderOptions {
    return this._config;
  }
  set config(value: DriftSliderOptions) {
    this._config = value ?? {};
  }

  get modules(): DriftSliderModule[] {
    return this._modules;
  }
  set modules(value: DriftSliderModule[]) {
    this._modules = value ?? [];
  }

  connectedCallback(): void {
    this._initPending = true;
    queueMicrotask(() => {
      if (this.isConnected && this._initPending) this._init();
    });
  }

  disconnectedCallback(): void {
    this._initPending = false;
    this._slider?.destroy();
    this._slider = null;
  }

  attributeChangedCallback(): void {
    // re-init wiring lands in Task 6
  }

  private _buildOptions(): DriftSliderOptions {
    return { ...this._config, modules: this._modules };
  }

  private _init(): void {
    this._initPending = false;
    this._slider = new CoreDriftSlider(this, this._buildOptions());
  }
}
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- lifecycle`. Expected: PASS (3 tests).

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/element.ts packages/element/test/lifecycle.test.ts
git commit -m "feat(element): deferred init/destroy lifecycle + property upgrade"
```

---

### Task 5: Scaffold generation

Make the element build the `.drift-track>.drift-list` scaffold from light children so authors write plain slide children. Idempotent, move-not-clone, focus-safe, `drift:error` on failure.

**Files:**
- Modify: `packages/element/src/element.ts` (add `_ensureScaffold`, call it in `_init`)
- Test: `packages/element/test/scaffold.test.ts`

**Interfaces:**
- Produces: `_init()` now calls `_ensureScaffold()` (wrapped in try/catch → `drift:error`) before constructing the core.

- [ ] **Step 1: Write the failing test**

`packages/element/test/scaffold.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

function mount(html: string): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

describe('scaffold generation', () => {
  it('wraps plain children into .drift-track>.drift-list and inits', async () => {
    const el = mount('<div id="keep">a</div><div>b</div>');
    await Promise.resolve();
    expect(el.querySelector(':scope > .drift-track > .drift-list')).toBeTruthy();
    expect(el.querySelectorAll('.drift-list > *').length).toBe(2);
    expect(el.querySelector('#keep')).toBeTruthy();           // author id preserved
    expect(el.instance).toBeTruthy();
  });

  it('is idempotent when a valid scaffold already exists', async () => {
    const el = mount('<div class="drift-track"><ul class="drift-list"><li>a</li></ul></div>');
    await Promise.resolve();
    expect(el.querySelectorAll(':scope > .drift-track').length).toBe(1);  // not double-wrapped
  });

  it('leaves <template> and <script> outside the list', async () => {
    const el = mount('<div>a</div><template>t</template>');
    await Promise.resolve();
    expect(el.querySelector('.drift-list > template')).toBeNull();
    expect(el.querySelector('template')).toBeTruthy();
  });

  it('restores focus if an author child was focused at upgrade', async () => {
    const el = mount('<button id="b">x</button>');
    el.querySelector<HTMLButtonElement>('#b')!.focus();
    await Promise.resolve();
    expect(document.activeElement).toBe(el.querySelector('#b'));
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- scaffold`. Expected: FAIL (children not wrapped).

- [ ] **Step 3: Implement scaffold in `src/element.ts`**

Add the method and call it from `_init` (replace the existing `_init` body's first line area):
```ts
  private _ensureScaffold(): void {
    if (this.querySelector(':scope > .drift-track > .drift-list')) return;

    const active = document.activeElement;
    const restoreFocus = active instanceof HTMLElement && this.contains(active) ? active : null;

    const list = document.createElement('ul');
    list.className = 'drift-list';

    const SKIP = new Set(['TEMPLATE', 'SCRIPT', 'STYLE']);
    const leaveOutside: Node[] = [];
    const children = Array.from(this.childNodes);
    for (const node of children) {
      if (node.nodeType === Node.ELEMENT_NODE && !SKIP.has((node as Element).tagName)) {
        list.appendChild(node); // move (preserves ids, aria, listeners)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        leaveOutside.push(node);
      }
      // text/comment nodes are dropped from the slide area
    }

    const track = document.createElement('div');
    track.className = 'drift-track';
    track.appendChild(list);
    this.replaceChildren(track, ...leaveOutside);

    if (restoreFocus) restoreFocus.focus();
  }
```

And update `_init` to call it inside try/catch:
```ts
  private _init(): void {
    this._initPending = false;
    try {
      this._ensureScaffold();
    } catch (error) {
      this.dispatchEvent(new CustomEvent('drift:error', { detail: { error }, bubbles: true }));
      return;
    }
    this._slider = new CoreDriftSlider(this, this._buildOptions());
  }
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- scaffold lifecycle`. Expected: PASS (lifecycle still green — its markup already has a scaffold, so `_ensureScaffold` no-ops).

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/element.ts packages/element/test/scaffold.test.ts
git commit -m "feat(element): idempotent light-DOM scaffold (move, focus-safe, drift:error)"
```

---

### Task 6: Config resolution (attributes + property + precedence + debounce)

**Files:**
- Modify: `packages/element/src/element.ts` (`_buildOptions`, `attributeChangedCallback`, re-init debounce)
- Test: `packages/element/test/config.test.ts`

**Interfaces:**
- Produces: `_buildOptions()` merges, in order: JSON `config` attribute → option attributes → `.config` property (property wins). `attributeChangedCallback` triggers a microtask-debounced re-init when already initialised. A dev `console.warn` fires when an attribute conflicts with a property-provided key.
- Consumes: `OPTION_ATTRS`, `coerceAttr`, `attrToOption` (Task 2).

- [ ] **Step 1: Write the failing test**

`packages/element/test/config.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

function mount(attrs: Record<string, string>): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = '<div>a</div><div>b</div><div>c</div>';
  document.body.appendChild(el);
  return el;
}

describe('config resolution', () => {
  it('applies option attributes to the core options', async () => {
    const el = mount({ loop: '', 'slides-per-view': '2' });
    await Promise.resolve();
    expect(el.instance!.params.loop).toBe(true);
    expect(el.instance!.params.slidesPerView).toBe(2);
  });

  it('parses the JSON config attribute as the base', async () => {
    const el = mount({ config: '{"speed":800}' });
    await Promise.resolve();
    expect(el.instance!.params.speed).toBe(800);
  });

  it('lets the .config property win over a conflicting attribute', async () => {
    const el = mount({ 'slides-per-view': '2' });
    el.config = { slidesPerView: 4 };
    await Promise.resolve();
    expect(el.instance!.params.slidesPerView).toBe(4);
  });

  it('re-inits once for several attribute changes in a tick', async () => {
    const el = mount({});
    await Promise.resolve();
    const first = el.instance;
    el.setAttribute('loop', '');
    el.setAttribute('speed', '500');
    await Promise.resolve();
    expect(el.instance).not.toBe(first);          // re-initialised
    expect(el.instance!.params.loop).toBe(true);
    expect(el.instance!.params.speed).toBe(500);
  });
});
```

> Note: the core stores resolved options on `instance.params`. If a different property holds them, the implementer adjusts the assertions to the real accessor after reading `packages/core/src/drift-slider.js`.

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- config`. Expected: FAIL.

- [ ] **Step 3: Implement config in `src/element.ts`**

Add a re-init scheduler field and method, rewrite `_buildOptions`, and wire `attributeChangedCallback`:
```ts
  private _reinitQueued = false;

  private _scheduleReinit(): void {
    if (this._reinitQueued) return;
    this._reinitQueued = true;
    queueMicrotask(() => {
      this._reinitQueued = false;
      if (this._slider) {
        this._slider.destroy();
        this._slider = null;
        this._init();
      }
    });
  }
```
Update the setters to schedule a re-init:
```ts
  set config(value: DriftSliderOptions) {
    this._config = value ?? {};
    this._scheduleReinit();
  }
  set modules(value: DriftSliderModule[]) {
    this._modules = value ?? [];
    this._scheduleReinit();
  }
```
Replace `attributeChangedCallback`:
```ts
  attributeChangedCallback(): void {
    if (this._slider) this._scheduleReinit();
  }
```
Replace `_buildOptions` (imports: add `OPTION_ATTRS, coerceAttr, attrToOption` from `./attributes`):
```ts
  private _attrOptions(): DriftSliderOptions {
    const out: Record<string, unknown> = {};
    const json = this.getAttribute('config');
    if (json) {
      try { Object.assign(out, JSON.parse(json)); }
      catch { console.warn('DriftSlider: invalid JSON in config attribute'); }
    }
    for (const attr of OPTION_ATTRS) {
      if (!this.hasAttribute(attr) && coerceAttr(attr, null) === undefined) continue;
      const value = coerceAttr(attr, this.getAttribute(attr));
      if (value !== undefined) out[attrToOption(attr)] = value;
    }
    return out as DriftSliderOptions;
  }

  private _buildOptions(): DriftSliderOptions {
    const fromAttrs = this._attrOptions();
    // property wins; warn on conflict
    for (const key of Object.keys(this._config)) {
      if (key in fromAttrs) {
        console.warn(`DriftSlider: property config.${key} overrides the conflicting attribute`);
      }
    }
    return { ...fromAttrs, ...this._config, modules: this._modules };
  }
```

> Boolean option attrs: `coerceAttr('loop', null)` returns `false`, so an absent `loop` would set `loop:false`. Guard: only apply boolean option attrs when the attribute is present. Implement the loop so absent boolean attrs are skipped — the `if (!this.hasAttribute(attr) ...)` line above skips absent attrs because for non-boolean absent attrs `coerceAttr(name,null)` is `undefined`; for booleans, add `&& !BOOLEAN guard`. Concretely, change the continue condition to: `if (!this.hasAttribute(attr)) continue;` for ALL option attrs (presence required), which is correct for booleans and harmless for others.

Final loop condition (use this):
```ts
    for (const attr of OPTION_ATTRS) {
      if (!this.hasAttribute(attr)) continue;
      const value = coerceAttr(attr, this.getAttribute(attr));
      if (value !== undefined) out[attrToOption(attr)] = value;
    }
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- config lifecycle scaffold`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/element.ts packages/element/test/config.test.ts
git commit -m "feat(element): config from attrs+property, precedence, debounced re-init"
```

---

### Task 7: Modules wiring (property + attribute + toggles + effect)

**Files:**
- Modify: `packages/element/src/element.ts` (`_buildModules`, used by `_buildOptions`)
- Test: `packages/element/test/modules-wiring.test.ts`

**Interfaces:**
- Produces: `_buildOptions()` modules = dedupe of `[...this._modules, ...resolveModuleNames(modules-attr), ...MODULE_ATTRS toggles present, ...moduleForEffect(effect)]`.
- Consumes: `resolveModuleNames`, `moduleForEffect` (Task 1); `MODULE_ATTRS` (Task 2).

- [ ] **Step 1: Write the failing test**

`packages/element/test/modules-wiring.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';
import { registerModules, clearRegistry } from '../src/registry';
import { Navigation, Pagination, EffectFade } from 'drift-slider/modules';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; clearRegistry(); });

function mount(attrs: Record<string, string>): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = '<div>a</div><div>b</div>';
  document.body.appendChild(el);
  return el;
}

describe('modules wiring', () => {
  it('resolves the modules attribute via the registry', async () => {
    registerModules({ Navigation, Pagination });
    const el = mount({ modules: 'navigation pagination' });
    await Promise.resolve();
    expect(el.instance!.params.modules).toEqual(expect.arrayContaining([Navigation, Pagination]));
  });

  it('treats boolean module attrs as toggles', async () => {
    registerModules({ Navigation });
    const el = mount({ navigation: '' });
    await Promise.resolve();
    expect(el.instance!.params.modules).toContain(Navigation);
  });

  it('auto-wires the effect module', async () => {
    registerModules({ EffectFade });
    const el = mount({ effect: 'fade' });
    await Promise.resolve();
    expect(el.instance!.params.modules).toContain(EffectFade);
  });

  it('merges and dedupes the .modules property with attribute sources', async () => {
    registerModules({ Navigation });
    const el = mount({ navigation: '' });
    el.modules = [Navigation];
    await Promise.resolve();
    const mods = el.instance!.params.modules as unknown[];
    expect(mods.filter((m) => m === Navigation).length).toBe(1);
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- modules-wiring`. Expected: FAIL.

- [ ] **Step 3: Implement `_buildModules` in `src/element.ts`**

Add imports `resolveModuleNames, moduleForEffect` from `./registry` and `MODULE_ATTRS` from `./attributes`. Add:
```ts
  private _buildModules(): DriftSliderModule[] {
    const mods = new Set<DriftSliderModule>(this._modules);

    const attr = this.getAttribute('modules');
    if (attr) for (const m of resolveModuleNames(attr.split(/[\s,]+/))) mods.add(m);

    for (const [attrName, regName] of Object.entries(MODULE_ATTRS)) {
      if (this.hasAttribute(attrName) && coerceAttr(attrName, this.getAttribute(attrName))) {
        for (const m of resolveModuleNames([regName])) mods.add(m);
      }
    }

    const effect = this.getAttribute('effect') ?? (this._config as { effect?: string }).effect;
    if (effect) { const m = moduleForEffect(effect); if (m) mods.add(m); }

    return [...mods];
  }
```
Update `_buildOptions` to use it:
```ts
    return { ...fromAttrs, ...this._config, modules: this._buildModules() };
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- modules-wiring config`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/element.ts packages/element/test/modules-wiring.test.ts
git commit -m "feat(element): wire modules from property, attribute, toggles, effect"
```

---

### Task 8: Events re-dispatch

**Files:**
- Modify: `packages/element/src/element.ts` (inject `on` handlers in `_buildOptions`)
- Test: `packages/element/test/events-element.test.ts`

**Interfaces:**
- Produces: `_buildOptions().on` registers a forwarder per `CORE_EVENTS` that dispatches `eventName(core)` as a `CustomEvent` (`bubbles:true, composed:false`) with `buildDetail(slider)` (except `destroy`, whose detail is `{}`), while still invoking any user-provided `this._config.on[core]`.
- Consumes: `CORE_EVENTS`, `eventName`, `buildDetail` (Task 3).

- [ ] **Step 1: Write the failing test**

`packages/element/test/events-element.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

function mount(): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  el.innerHTML = '<div>a</div><div>b</div><div>c</div>';
  document.body.appendChild(el);
  return el;
}

describe('events re-dispatch', () => {
  it('fires drift:init with a serializable detail', async () => {
    const el = mount();
    const seen: CustomEvent[] = [];
    el.addEventListener('drift:init', (e) => seen.push(e as CustomEvent));
    await Promise.resolve();
    expect(seen.length).toBe(1);
    expect(seen[0].bubbles).toBe(true);
    expect(seen[0].composed).toBe(false);
    expect(typeof seen[0].detail.activeIndex).toBe('number');
    expect(seen[0].detail.slider).toBeUndefined();  // not the raw instance
  });

  it('fires drift:slidechange on navigation', async () => {
    const el = mount();
    await Promise.resolve();
    const seen: CustomEvent[] = [];
    el.addEventListener('drift:slidechange', (e) => seen.push(e as CustomEvent));
    el.instance!.slideNext(0);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0].detail.activeIndex).toBe(1);
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- events-element`. Expected: FAIL.

- [ ] **Step 3: Implement event forwarders in `src/element.ts`**

Add imports `CORE_EVENTS, eventName, buildDetail` from `./events`. Add a helper and call it in `_buildOptions`:
```ts
  private _buildOn(): Record<string, (...args: unknown[]) => void> {
    const userOn = (this._config.on ?? {}) as Record<string, ((...a: unknown[]) => void) | undefined>;
    const on: Record<string, (...args: unknown[]) => void> = {};
    for (const core of CORE_EVENTS) {
      on[core] = (slider: unknown, ...rest: unknown[]) => {
        const detail = core === 'destroy'
          ? {}
          : buildDetail(slider as Parameters<typeof buildDetail>[0]);
        this.dispatchEvent(new CustomEvent(eventName(core), { detail, bubbles: true, composed: false }));
        userOn[core]?.(slider, ...rest);
      };
    }
    return on;
  }
```
Update `_buildOptions` to drop the raw `on` from the merge and inject forwarders:
```ts
  private _buildOptions(): DriftSliderOptions {
    const fromAttrs = this._attrOptions();
    for (const key of Object.keys(this._config)) {
      if (key !== 'on' && key in fromAttrs) {
        console.warn(`DriftSlider: property config.${key} overrides the conflicting attribute`);
      }
    }
    const { on: _omit, ...configRest } = this._config as DriftSliderOptions & { on?: unknown };
    return {
      ...fromAttrs,
      ...configRest,
      modules: this._buildModules(),
      on: this._buildOn(),
    } as DriftSliderOptions;
  }
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- events-element config`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/element.ts packages/element/test/events-element.test.ts
git commit -m "feat(element): re-dispatch core events as drift:* CustomEvents"
```

---

### Task 9: Imperative API

**Files:**
- Modify: `packages/element/src/element.ts` (add `slideTo/slideNext/slidePrev/update/activeIndex/destroy`)
- Test: `packages/element/test/imperative.test.ts`

**Interfaces:**
- Produces: `slideTo(index, speed?, runCallbacks?)`, `slideNext(speed?)`, `slidePrev(speed?)`, `update()`, `destroy()`, `get activeIndex(): number`. All guard a null instance (return `undefined` / `-1` for `activeIndex`).

- [ ] **Step 1: Write the failing test**

`packages/element/test/imperative.test.ts`:
```ts
import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

function mount(): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  el.innerHTML = '<div>a</div><div>b</div><div>c</div>';
  document.body.appendChild(el);
  return el;
}

describe('imperative API', () => {
  it('delegates navigation to the core and reflects activeIndex', async () => {
    const el = mount();
    await Promise.resolve();
    el.slideNext(0);
    expect(el.activeIndex).toBe(1);
    el.slideTo(2, 0);
    expect(el.activeIndex).toBe(2);
    el.slidePrev(0);
    expect(el.activeIndex).toBe(1);
  });

  it('guards methods when not initialised', () => {
    const el = document.createElement('drift-slider') as DriftSliderElement;
    expect(() => el.slideNext(0)).not.toThrow();
    expect(el.slideNext(0)).toBeUndefined();
    expect(el.activeIndex).toBe(-1);
  });

  it('destroy() tears down without removing from the DOM', async () => {
    const el = mount();
    await Promise.resolve();
    el.destroy();
    expect(el.instance).toBeNull();
    expect(el.isConnected).toBe(true);
  });
});
```

- [ ] **Step 2: Run it, verify it fails** — Run: `npm test -w packages/element -- imperative`. Expected: FAIL.

- [ ] **Step 3: Implement the imperative API in `src/element.ts`**

```ts
  get activeIndex(): number {
    return this._slider ? this._slider.realIndex : -1;
  }

  slideTo(index: number, speed?: number, runCallbacks?: boolean): void {
    this._slider?.slideTo(index, speed, runCallbacks);
  }
  slideNext(speed?: number): void {
    this._slider?.slideNext(speed);
  }
  slidePrev(speed?: number): void {
    this._slider?.slidePrev(speed);
  }
  update(): void {
    this._slider?.update();
  }
  destroy(): void {
    this._slider?.destroy();
    this._slider = null;
  }
```

- [ ] **Step 4: Run tests, verify pass** — Run: `npm test -w packages/element -- imperative`. Expected: PASS. Then run the full element suite: `npm test -w packages/element`. Expected: all green.

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/element.ts packages/element/test/imperative.test.ts
git commit -m "feat(element): imperative slideTo/slideNext/slidePrev/update/destroy + activeIndex"
```

---

### Task 10: Entry points, build targets, FOUC CSS, built-package smoke

**Files:**
- Create: `packages/element/src/index.ts`, `packages/element/src/define.ts`, `packages/element/src/cdn.ts`, `packages/element/src/with-css.ts`
- Create: `packages/element/tsup.config.ts`
- Modify: `packages/element/package.json` (exports, sideEffects, build script already present)
- Modify: `packages/core/src/styles/drift-slider.scss` (FOUC rule)
- Test: `packages/element/test/built-package.test.ts`

**Interfaces:**
- Produces: `drift-slider-element` (class + `registerModules`, no define), `drift-slider-element/define` (registers), CDN IIFE bundle (all modules + define + CSS). FOUC rule in the core bundle.

- [ ] **Step 1: Implement the entry files**

`packages/element/src/index.ts`:
```ts
export { DriftSliderElement } from './element';
export { registerModules } from './registry';
```
(Task 11 prepends `import './jsx';` here to ship the JSX/global type augmentation.)

`packages/element/src/define.ts`:
```ts
import { DriftSliderElement } from './element';

if (typeof customElements !== 'undefined' && !customElements.get('drift-slider')) {
  customElements.define('drift-slider', DriftSliderElement);
}

export { DriftSliderElement, registerModules } from './index';
```

`packages/element/src/cdn.ts`:
```ts
import * as modules from 'drift-slider/modules';
import { DriftSliderElement } from './element';
import { registerModules } from './registry';
import './with-css';

registerModules(modules as unknown as Record<string, import('drift-slider').DriftSliderModule>);

if (typeof customElements !== 'undefined' && !customElements.get('drift-slider')) {
  customElements.define('drift-slider', DriftSliderElement);
}
```

`packages/element/src/with-css.ts`:
```ts
import css from 'drift-slider/css/bundle?inline';

if (typeof document !== 'undefined' && !document.querySelector('style[data-drift-element-css]')) {
  const style = document.createElement('style');
  style.setAttribute('data-drift-element-css', '');
  style.textContent = css as unknown as string;
  document.head.appendChild(style);
}
```
> If `?inline` import is unavailable in the tsup pipeline, the implementer instead reads the bundle path at build time via a tsup `loader`/`esbuildOptions` or inlines it with a small esbuild `text` loader on `.css`. The deliverable is: a single `<style data-drift-element-css>` injected once. Confirm the chosen mechanism in the task report.

- [ ] **Step 2: Add the tsup config (two targets)**

`packages/element/tsup.config.ts`:
```ts
import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/define.ts', 'src/with-css.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    external: ['drift-slider'],
  },
  {
    entry: { 'drift-slider-element.iife': 'src/cdn.ts' },
    format: ['iife'],
    globalName: 'DriftSliderElement',
    noExternal: ['drift-slider'],
    minify: true,
    clean: false,
  },
]);
```

- [ ] **Step 3: Set exports + sideEffects in `packages/element/package.json`**

Add these keys:
```json
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./define": { "types": "./dist/define.d.ts", "import": "./dist/define.js" },
    "./with-css": { "import": "./dist/with-css.js" }
  },
  "files": ["dist", "src"],
  "sideEffects": ["./dist/define.js", "./dist/with-css.js", "./dist/drift-slider-element.iife.global.js", "*.css"],
```

- [ ] **Step 4: Add the FOUC rule to the core stylesheet**

In `packages/core/src/styles/drift-slider.scss`, after the `@use` lines and before `.drift-slider {`, add:
```scss
// Web Component: avoid a flash of un-transformed slides before upgrade.
drift-slider:not(:defined) .drift-track {
  visibility: hidden;
}
```

- [ ] **Step 5: Build core (for FOUC CSS + types) then the element**

Run:
```bash
npm run build -w packages/core
npm run build -w packages/element
```
Expected: core CSS contains `drift-slider:not(:defined)`; element `dist/` has `index.js`, `index.d.ts`, `define.js`, `with-css.js`, and `drift-slider-element.iife.global.js`. Verify the IIFE is self-contained (does not `import` `drift-slider`) and `dist/index.js` has no `customElements.define`.

- [ ] **Step 6: Write + run the built-package smoke test**

`packages/element/test/built-package.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

function loadBuilt(spec: string) {
  return import(/* @vite-ignore */ spec).catch(() => null);
}

const main = await loadBuilt('../dist/index.js');
const def = await loadBuilt('../dist/define.js');

describe('built drift-slider-element', () => {
  it.skipIf(!main)('main entry exports the class + registerModules, no define', () => {
    expect(typeof main.DriftSliderElement).toBe('function');
    expect(typeof main.registerModules).toBe('function');
  });
  it.skipIf(!def)('the /define entry registers the element', () => {
    expect(typeof def.DriftSliderElement).toBe('function');
    // import side-effect registered the tag
    expect(customElements.get('drift-slider')).toBeTruthy();
  });
});
```
Run: `npm test -w packages/element -- built-package`. Expected: PASS (runs because dist was built in Step 5).

- [ ] **Step 7: Commit**
```bash
git add packages/element packages/core/src/styles/drift-slider.scss
git commit -m "feat(element): ESM + CDN IIFE build targets, exports map, FOUC CSS"
```

---

### Task 11: Ambient TypeScript types (HTMLElementTagNameMap + JSX)

**Files:**
- Create: `packages/element/src/jsx.ts` (a real module with `declare global`, so tsup bundles the augmentation into `dist/index.d.ts`)
- Modify: `packages/element/src/index.ts` (prepend `import './jsx';`)
- Test: `packages/element/test/types.test-d.ts` (type-level)
- Modify: `packages/element/package.json` (add a `typecheck` script), `packages/element/tsconfig.json` (include `test`)

**Interfaces:**
- Produces: global `HTMLElementTagNameMap['drift-slider']` typed as `DriftSliderElement`; JSX `IntrinsicElements['drift-slider']` for React and Solid with the documented attributes.

- [ ] **Step 1: Implement `src/jsx.ts`** (a `.ts`, not `.d.ts`, so `index.ts` can import it and tsup emits the augmentation into the published `.d.ts`)

```ts
import type { DriftSliderElement } from './element';

declare global {
  interface HTMLElementTagNameMap {
    'drift-slider': DriftSliderElement;
  }
}

type DriftSliderAttributes = {
  config?: string;
  modules?: string;
  loop?: boolean | '';
  'slides-per-view'?: number | string;
  'space-between'?: number | string;
  effect?: string;
  direction?: 'horizontal' | 'vertical';
  speed?: number | string;
  'initial-slide'?: number | string;
  'centered-slides'?: boolean | '';
  navigation?: boolean | '';
  pagination?: boolean | '';
  keyboard?: boolean | '';
  autoplay?: boolean | '';
};

// React (JSX namespace)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'drift-slider': React.DetailedHTMLProps<
        React.HTMLAttributes<DriftSliderElement> & DriftSliderAttributes,
        DriftSliderElement
      >;
    }
  }
}

export {};
```
> Solid consumers augment `solid-js`'s `JSX.IntrinsicElements` themselves; document the same `DriftSliderAttributes` shape in the README. The React JSX block is guarded by `React` being available; if a non-React TS project errors on the `React` reference, the implementer wraps it so the map augmentation still applies without the React dependency (e.g. a minimal local `HTMLAttributes` fallback). Confirm the approach in the report.

- [ ] **Step 2: Wire the import + typecheck script + include `test`**

Prepend to `packages/element/src/index.ts` (so the augmentation ships in `dist/index.d.ts`):
```ts
import './jsx';
```
In `packages/element/package.json` scripts add: `"typecheck": "tsc --noEmit"`.
In `packages/element/tsconfig.json`, change `"include"` to `["src", "test"]`.

- [ ] **Step 3: Write the type-level test**

`packages/element/test/types.test-d.ts`:
```ts
import type { DriftSliderElement } from '../src/element';

// HTMLElementTagNameMap augmentation resolves the element type
const el = document.createElement('drift-slider');
const _check: DriftSliderElement = el;
void _check;
// methods are typed
el.slideNext(0);
const _idx: number = el.activeIndex;
void _idx;
```

- [ ] **Step 4: Run the typecheck** — Run: `npm run typecheck -w packages/element`. Expected: no type errors. Then `npm test -w packages/element`. Expected: full suite green.

- [ ] **Step 5: Commit**
```bash
git add packages/element/src/jsx.d.ts packages/element/src/index.ts packages/element/package.json packages/element/tsconfig.json packages/element/test/types.test-d.ts
git commit -m "feat(element): ambient HTMLElementTagNameMap + JSX typings"
```

---

### Task 12: Docs, demo page, root + CI integration

**Files:**
- Create: `packages/element/README.md`
- Create: `docs/demos/web-component.html`
- Modify: `docs/demos.html` (gallery card), root `README.md` (Web Component section)
- Modify: root `package.json` (`build:element`, extend `build`)
- Modify: `.github/workflows/ci.yml` (already runs `npm test --workspaces`); `.github/workflows/publish.yml` (note element publish is deferred — add a comment placeholder only)

**Interfaces:** none (docs/integration).

- [ ] **Step 1: Root build wiring**

In root `package.json` scripts, extend `build` and add `build:element`:
```json
    "build": "npm run build -w packages/core && npm run build -w packages/react && npm run build -w packages/element",
    "build:element": "npm run build -w packages/core && npm run build -w packages/element",
```

- [ ] **Step 2: Add a `prebuild` to the element package** so a standalone `npm run build -w packages/element` builds core first (dts re-export needs `dist/types`).

In `packages/element/package.json` scripts add:
```json
    "prebuild": "npm run build -w packages/core",
```
> Because `prebuild` runs in the element workspace, reference core via the workspace flag from the repo root path is not available; instead set it to `"prebuild": "cd ../core && npm run build"`. Confirm which form works in this monorepo in the task report (the root `build:element` already guarantees ordering for CI).

- [ ] **Step 3: Write the README**

`packages/element/README.md` — document: install (`npm i drift-slider drift-slider-element`), CDN `<script>` usage with attributes, bundler usage with `import 'drift-slider-element/define'` + `registerModules`, the attribute table, events (`drift:*`), the imperative API, and the memoize/peer notes. Include a runnable CDN snippet:
```html
<link rel="stylesheet" href="https://unpkg.com/drift-slider/dist/css/bundle.css">
<script src="https://unpkg.com/drift-slider-element"></script>
<drift-slider loop navigation pagination slides-per-view="1">
  <img src="https://picsum.photos/seed/a/800/400" alt="">
  <img src="https://picsum.photos/seed/b/800/400" alt="">
</drift-slider>
```

- [ ] **Step 4: Create the demo page**

`docs/demos/web-component.html` — follow the demo conventions: `data-include` header/footer, i18n (`data-i18n-en`/`data-i18n-zh`) on the `h1` and `p.demo-desc`, picsum seed images, a `<drift-slider>` configured via attributes loading the local built bundle from `docs/assets/lib/` (so it works offline) or unpkg. Mirror an existing demo page's structure (e.g. `docs/demos/basic.html`).

- [ ] **Step 5: Register the demo card** in `docs/demos.html` gallery grid (copy an existing `<a class="demo-card">` and point it at `web-component.html`, with i18n title/description).

- [ ] **Step 6: Add a Web Component section to the root `README.md`** after the React section, linking to `packages/element/README.md`.

- [ ] **Step 7: Verify the whole repo**

Run:
```bash
npm test
npm run build
```
Expected: all workspace tests pass (core + react + element); full build succeeds.

- [ ] **Step 8: Commit**
```bash
git add packages/element/README.md packages/element/package.json docs/demos/web-component.html docs/demos.html README.md package.json
git commit -m "docs(element): README, web-component demo page, root build + gallery wiring"
```

---

## Notes for the implementer

- The element class grows across Tasks 4-9; always read the current `src/element.ts` before editing, and keep the imports in sync (`attributes`, `registry`, `events`).
- `instance.params` is assumed to hold resolved core options for assertions; if the core exposes them under a different name, adjust the test assertions to the real accessor (read `packages/core/src/drift-slider.js`) — the production code is unaffected.
- Publishing `drift-slider-element` to npm is **out of scope** (a later release step, like the react package's deferred publish).
