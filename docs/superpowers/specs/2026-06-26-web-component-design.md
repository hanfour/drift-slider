# `<drift-slider>` Web Component — Design Spec

**Date:** 2026-06-26
**Status:** Approved (design); pending implementation plan
**Package:** `drift-slider-element` (new workspace `packages/element`)

## Goal

Ship an official `<drift-slider>` Custom Element that wraps the existing
`drift-slider` core library, giving **CDN / plain-HTML users** and **non-React
framework users** (Vue, Svelte, Angular, Astro, Lit, Solid) a first-class,
framework-agnostic integration — without a build step required.

## Positioning

The Web Component is **not** a replacement for `drift-slider-react`. React users
should keep using `drift-slider-react` (it solves React-specific concerns —
stable re-init, handler identity, imperative handle — with React's own
primitives). The Web Component is the integration path for **CDN drop-in** and
**every non-React framework**. The two are complementary peers.

## Architecture: Approach A — Light DOM thin wrapper

`<drift-slider>` is a Custom Element using **Light DOM (no Shadow Root)**. On
connect it ensures the `.drift-slider / .drift-track / .drift-list` scaffold
exists (wrapping the author's light-DOM slide children), then constructs the
core: `new DriftSlider(thisElement, options)`.

Light DOM is chosen because:
- The core's global CSS bundle and all module DOM (nav arrows, pagination
  bullets, thumbs) style the slides as-is — no per-shadow-root style injection.
- Authors style their own slide content with page CSS, which is how content
  sliders are actually used (Shadow DOM encapsulation fights this).
- Best SEO/accessibility — slides live in the real accessible tree.
- The core's `.drift-*` class namespacing already prevents style clashes.

The custom element root **is** the `.drift-slider` container (the core's
`addContainerClasses()` applies `drift-slider` to it).

## Tech Stack

- TypeScript, built with **tsup** (mirrors `packages/react`).
- Two build targets (ESM for bundlers + IIFE for CDN).
- Vitest + jsdom for unit tests; `@open-wc/testing-helpers`-style fixtures or
  hand-rolled `customElements`-defined fixtures.
- Types derived from the core package's named exports
  (`DriftSliderOptions`, `DriftSliderModule`, `DriftSliderEvents`, the
  `DriftSlider` class).

## Global Constraints

- Package name: **`drift-slider-element`** (unscoped, mirrors
  `drift-slider` / `drift-slider-react`).
- Peer dependency: **`drift-slider >= 0.7.0`**.
- Element tag name: **`drift-slider`**.
- The ESM entry must be **side-effect-free** and must **not** call
  `customElements.define`. Registration is opt-in.
- Event names: native `CustomEvent`, **`drift:` colon prefix, all lowercase**.
- Imperative API mirrors `DriftSliderHandle` from `drift-slider-react` exactly.
- Scaffold mutation must be a DOM **move** (never clone / `innerHTML`) and must
  never touch author `id` attributes.

---

## Component breakdown (`packages/element/src/`)

- `element.ts` — the `DriftSliderElement` class (lifecycle, scaffold, config,
  events, imperative API). The core unit.
- `registry.ts` — `registerModules()` + the module name→object registry and
  the `effect→module` auto-wire map.
- `attributes.ts` — observed-attribute list + string→typed coercion
  (boolean/number/enum), kebab→camel mapping.
- `events.ts` — core-event → `CustomEvent` mapping + serializable `detail`
  builders.
- `index.ts` — ESM entry: exports `DriftSliderElement`, `registerModules`,
  types. **No `define` call.**
- `define.ts` — imports the class + calls
  `customElements.define('drift-slider', DriftSliderElement)` (guarded against
  double-define). Side-effecting entry.
- `cdn.ts` — IIFE entry: registers **all** built-in modules, calls `define`,
  injects the CSS bundle once into `document.head`.
- `css.ts` — opt-in side-effect that injects `drift-slider/css/bundle` into
  `document.head` (for bundler users who want auto-CSS).
- `types/` — `HTMLElementTagNameMap` augmentation + JSX `IntrinsicElements`
  (React + Solid) typings.

---

## Lifecycle (the invariant-driven core)

**Init is deferred one microtask after `connectedCallback`** so parser-created
and framework-rendered slide children are present before the core reads them:

```
connectedCallback() {
  this._initPending = true
  queueMicrotask(() => {
    if (this.isConnected && this._initPending) this._init()
  })
}
disconnectedCallback() {
  this._initPending = false      // cancel a stale pending init
  this._slider?.destroy()
  this._slider = null
}
```

- **`_init()` reads `this.options` / `this.modules` at call time** (never a
  snapshot captured in `connectedCallback`), so properties set between append
  and the microtask flush are honoured.
- **Scaffold is an invariant of `_init`, not a setup side effect.** Before
  constructing the core, `_ensureScaffold()` guarantees a valid
  `:scope > .drift-track > .drift-list`. On failure it dispatches
  `drift:error` and bails — it never throws into the upgrade stack.

### `_ensureScaffold()` rules

- Guard: if `this.querySelector(':scope > .drift-track > .drift-list')` exists,
  **skip** (idempotent on reconnect and on already-server-rendered markup).
- Otherwise build `.drift-track > .drift-list` and **move** the element's
  current children into `.drift-list` with `appendChild` (preserves IDRefs,
  `aria-*`, event listeners, and source order).
- Slide-eligible = element-node children **except** `<template>`, `<script>`,
  and `<style>`; those are left outside the track and text/comment nodes are
  ignored. Each moved element becomes one slide.
- Never assign or rewrite `id` attributes on author children.
- Completes **synchronously** within `_init` before first paint — no waiting on
  image load or `requestAnimationFrame`.

### Reconnect / move semantics

Disconnect destroys the instance; the next connect rebuilds (a fresh
`queueMicrotask`-deferred `_init`). The scaffold guard makes the rebuild a
no-op on the DOM; the core re-initialises against the existing scaffold. No
instance is reused across a move.

### Property upgrade

In the constructor, drain any properties assigned before upgrade (the
lazy-properties pattern) for `options`, `modules`, and each reflected
attribute property, so `el.loop = true` set before `define` is not silently
shadowed.

### FOUC

The core CSS bundle includes:

```css
drift-slider:not(:defined) .drift-track { visibility: hidden; }
```

so pre-upgrade content reserves layout without flashing the untransformed
track. (This rule lives in the core CSS bundle, added as part of this work.)

---

## Configuration API

### Properties (framework / imperative path — primary)

- `options` (or `config`): full `DriftSliderOptions` object. Setter stores it
  and, if already initialised, triggers a re-init (debounced — see below).
- `modules`: `DriftSliderModule[]` array (bundler users pass imported modules
  directly).

### Attributes (CDN / declarative path)

- `config` attribute: a **JSON string** parsed as the base options object
  (coarse CDN escape hatch for rich config).
- First-class attributes (coerced from strings): `loop`, `slides-per-view`,
  `space-between`, `effect`, `direction`, `speed`, `initial-slide`,
  `centered-slides`, `autoplay`, `navigation`, `pagination`, `keyboard`.
- Boolean attributes follow the HTML convention (presence = true). Coercion is
  **`value !== null && value !== 'false'`** so Angular's `[loop]="false"`
  (which sets the string `"false"`) is correctly treated as false.
- Number attributes use `parseFloat` / `parseInt`; enums (`direction`,
  `effect`) are validated against a known set (unknown → console warning,
  ignored).
- Naming: strict kebab-case → camelCase (`slides-per-view` → `slidesPerView`),
  documented in one mapping table.

### Precedence

**Property wins over attribute.** When both a property and a conflicting
attribute are present, the property value is used; a dev-mode `console.warn`
flags the conflict. (No `mode="declarative|imperative"` switch in v1.)

### Modules (the tree-shaking-safe design)

- A `registerModules(map)` static/exported API populates a name→module
  registry. The **CDN IIFE build pre-registers all built-in modules**; bundler
  users call `registerModules({ Navigation, Pagination })` with only what they
  imported, preserving tree-shaking (the ESM entry ships **no** built-in
  module map).
- The `modules` **attribute** is a space/comma-separated list of registered
  names resolved against the registry: `modules="navigation pagination"`.
  Resolution is **case-insensitive**; unknown names emit
  `console.warn('DriftSlider: unknown module "<name>", ignoring')`.
- `effect="<name>"` auto-includes the matching effect module if it is
  registered (e.g. `effect="fade"` → `EffectFade`).

### Re-init debounce

Attribute changes and `options`/`config` property assignments that require
re-initialisation are **batched per microtask** (collect dirty keys, flush
once) so setting several attributes/props in succession triggers a single
`destroy()` + re-init, not a storm. (The core has no partial `setOptions()`;
v1 re-inits rather than diffing. A future core `setOptions()` could enable
in-place updates for safe keys.)

---

## Imperative API (mirrors `DriftSliderHandle`)

On the element instance:

- `slideTo(index, speed?, runCallbacks?)`
- `slideNext(speed?)`
- `slidePrev(speed?)`
- `update()`
- `activeIndex` — read-only getter (current `realIndex`)
- `instance` — read-only getter → the `DriftSlider | null` (advanced access)
- `destroy()` — manual teardown without DOM removal

All methods guard the null instance (no-op / return `undefined` before init or
after destroy), mirroring the React handle's guarded methods.

---

## Events

Core events are re-dispatched as native `CustomEvent`s on the element,
`bubbles: true, composed: false`:

| Core event | Custom event |
|---|---|
| `init` | `drift:init` |
| `slideChange` | `drift:slidechange` |
| `reachBeginning` | `drift:reachbeginning` |
| `reachEnd` | `drift:reachend` |
| `touchStart` | `drift:touchstart` |
| `touchEnd` | `drift:touchend` |
| `destroy` | `drift:destroy` |

`detail` is a **serializable summary**, not the raw instance:

```ts
detail: { activeIndex, previousIndex, progress, isBeginning, isEnd }
```

The raw `DriftSlider` is available via the element's `.instance` getter for
advanced use. Framework bindings use `@drift:slidechange` (Vue),
`on:drift:slidechange` (Svelte), `(drift:slidechange)` (Angular),
`addEventListener` (everywhere).

---

## Accessibility

- Scaffold is a pure **move**; author `id`s and `aria-*` are never modified, so
  IDRef chains (`aria-controls`, `aria-labelledby`) keep resolving.
- The inner `.drift-slider` div is the semantic root owned by the core **A11y
  module** (role/`aria-roledescription`); the A11y module runs **after**
  scaffold completion. The host `<drift-slider>` tag adds no competing role in
  v1.
- Generated `.drift-track` / `.drift-list` carry no `tabindex` and introduce no
  focusable noise. Per-slide role is `group` (not `tabpanel`, which would
  require a full `tablist`).
- If `document.activeElement` is inside the element at upgrade, save it before
  scaffold and restore focus after, so keyboard users don't lose focus.
- No WC-owned stylesheet adds `transition`/`animation` outside a
  `prefers-reduced-motion` guard; motion stays the core's responsibility.

---

## Packaging & build

- New workspace `packages/element`, published as **`drift-slider-element`**,
  peer-depends on `drift-slider >= 0.7.0`. Not folded into core.
- **tsup**, two targets:
  - **ESM** (`index.ts`): `external: ['drift-slider']`, no `define` call,
    `dist/index.js` + `dist/index.d.ts`.
  - **IIFE CDN** (`cdn.ts`): `noExternal: ['drift-slider']` — bundles the core
    **from source** (not the 132 KB unminified `dist/esm`), includes all
    modules, self-registers, minified → `dist/drift-slider-element.iife.js`.
- `exports` map:
  - `.` → ESM class only (`"sideEffects": false`)
  - `./define` → class + `customElements.define` (side-effecting)
  - `./with-css` → opt-in CSS injection (side-effecting)
- `package.json` `"sideEffects"`: `["./dist/define.js", "./dist/cdn.js", "./dist/with-css.js", "*.css"]`; the class-only entry stays tree-shakeable.
- **CSS**: not auto-injected by the ESM entry (CSP / SSR / cascade-layer
  safety). The CDN IIFE injects the bundle once into `document.head` (guarded
  by a `data-drift-element-css` marker to dedupe). Bundler users use
  `./with-css` or import `drift-slider/css/bundle` themselves.
- Build order: core builds before element (`prebuild` runs
  `npm run build -w packages/core` so `dist/types` exists for tsup dts). Root
  `build` extended to build element after core. CI/publish workflows mirror the
  react package.
- **Size budget**: element wrapper itself < ~2 KB min+gzip (excl. core);
  enforce with `size-limit` in CI. CDN IIFE target ≈ 28 KB gzip (core + all
  modules + wrapper).

---

## Testing strategy

Unit tests (Vitest + jsdom), real custom-element registration, real behaviour:

- **Lifecycle:** init after microtask with N children present; destroy on
  disconnect; reconnect rebuilds; pending-init cancelled if disconnected before
  flush; property-upgrade drains pre-`define` properties.
- **Scaffold:** idempotent (no double-wrap on reconnect / pre-existing
  scaffold); pure move preserves author `id`/`aria-*` and order; non-slide
  nodes not swept into the list; `drift:error` + bail on scaffold failure.
- **Config:** attribute coercion incl. the `"false"` boolean gotcha; JSON
  `config` attribute; property-wins precedence + conflict warning; re-init
  debounced to a single re-init across batched changes.
- **Modules:** `registerModules` + name resolution (case-insensitive, unknown
  → warn); `effect` auto-wires its module.
- **Imperative API:** each method delegates; guards null instance pre-init /
  post-destroy; `activeIndex` / `instance` getters.
- **Events:** each `drift:*` event fires with the serializable `detail`;
  `bubbles:true, composed:false`; `drift:destroy` fires on teardown.
- **Built-package smoke test:** import the built `dist` (mirrors the core
  built-package test) and assert the exports + that `./define` registers the
  element.

---

## Out of scope (future milestones)

- Vue / Svelte / Angular dedicated wrapper packages (the WC covers them for now).
- A core partial `setOptions()` for in-place updates (v1 re-inits).
- `mode` switch, two-way `activeIndex` binding, Declarative Shadow DOM.
- Publishing `drift-slider-element` to npm (a later release step, like the
  react package's deferred publish).

---

## Demo & docs

- A `docs/demos/web-component.html` page showing the CDN `<script>` + plain
  HTML usage, with i18n (EN/ZH) for the `h1` and `p.demo-desc` per project
  convention.
- Register the demo card in `docs/demos.html`.
- Add the element to the modules/integration docs alongside the React section.
