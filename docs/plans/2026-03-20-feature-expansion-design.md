# DriftSlider Feature Expansion Design

**Date:** 2026-03-20
**Goal:** Enrich drift-slider with high-value features to serve both enterprise clients and the developer community.
**Strategy:** Two batches with demos for each feature.

---

## Batch 1 (v0.4.0) — Client-Facing + Developer Value

### 1. Creative Effect

Declarative custom transform API. Users define prev/next slide transforms via config, no plugin code needed.

**API:**

```js
new DriftSlider(el, {
  effect: 'creative',
  creativeEffect: {
    prev: { translate: ['-120%', 0, -500], rotate: [0, 0, -15], opacity: 0 },
    next: { translate: ['120%', 0, -500], rotate: [0, 0, 15], opacity: 0 },
    active: { translate: [0, 0, 0], rotate: [0, 0, 0], opacity: 1 },
    perspective: true,
  },
})
```

**Implementation:**
- New module: `src/modules/effects/effect-creative.js`
- `prev`/`next`/`active` each accept: `translate: [x, y, z]`, `rotate: [x, y, z]` (degrees), `scale`, `opacity`, `origin`
- Values can be numbers (px) or strings (`'100%'` = relative to slide width)
- Linear interpolation based on `normalizedOffset` (0 = active, +/-1 = adjacent)
- Reuse coverflow's rAF animation engine to avoid Mobile Safari issues
- Override `setTranslate`/`setTransition` like coverflow does

**Demos (2):**
- `demos/creative.html` — basic creative effect with interactive controls
- `demos/creative-presets.html` — showcase of 6-8 presets (flip-horizontal, zoom-out, rotate-in, slide-rotate, parallax-slide, scale-up, swing, etc.)

---

### 2. Ticker / Marquee Mode

Continuous smooth scrolling for logo walls, news tickers, partner showcases.

**API:**

```js
new DriftSlider(el, {
  modules: [DriftSlider.Autoplay],
  slidesPerView: 'auto',
  loop: true,
  speed: 5000,
  autoplay: {
    enabled: true,
    ticker: true,
    tickerSpeed: 1,
    pauseOnMouseEnter: true,
    reverseDirection: false,
  },
})
```

**Implementation:**
- Extension of existing Autoplay module (`src/modules/autoplay/autoplay.js`)
- When `ticker: true`: rAF-driven continuous `translate` movement, no CSS transitions
- Speed in px/frame, `tickerSpeed` as multiplier
- `pauseOnMouseEnter`: smooth deceleration (not instant stop), smooth acceleration on leave
- Touch drag pauses ticker, resumes from current position on release
- Loop mode: seamless cycling. Non-loop: bounce at ends.

**Demos (2):**
- `demos/ticker.html` — logo wall marquee
- `demos/ticker-dual.html` — two rows scrolling in opposite directions

---

### 3. Thumbs Sync Module

Formal main/thumbnail slider synchronization.

**API:**

```js
const thumbs = new DriftSlider(thumbsEl, {
  slidesPerView: 5,
  spaceBetween: 8,
});

const main = new DriftSlider(mainEl, {
  modules: [DriftSlider.Thumbs],
  thumbs: {
    slider: thumbs,
    slideThumbActiveClass: 'drift-thumb--active',
    autoScrollThumbs: true,
    multipleActiveThumbs: false,
  },
});
```

**Implementation:**
- New module: `src/modules/thumbs/thumbs.js`
- Bidirectional sync: main `slideChange` -> update thumb active class + auto-scroll; thumb `click` -> main `slideTo`
- `autoScrollThumbs`: when active thumb is out of view, auto-scroll thumb slider
- Loop mode: use `realIndex` for mapping, immune to clone index shifts
- Clean destroy: unbind all events without affecting thumb slider lifecycle

**Demos (2):**
- `demos/thumbs-product.html` — product image gallery with horizontal thumbnails
- `demos/thumbs-vertical.html` — vertical thumbnail navigation

---

## Batch 2 (v0.5.0) — Advanced Developer Features

### 4. Parallax Module

Attribute-based parallax on any element within slides.

**API:**

```html
<li class="drift-slide">
  <img data-drift-parallax="-30%" src="bg.jpg">
  <h2 data-drift-parallax="20%">Title</h2>
</li>
```

**Implementation:**
- New module: `src/modules/parallax/parallax.js`
- On `setTranslate`: calculate each annotated element's offset based on slide progress
- Attributes: `data-drift-parallax` (shorthand for x), `data-drift-parallax-x`, `data-drift-parallax-y`, `data-drift-parallax-scale`, `data-drift-parallax-opacity`
- Percentage values are relative to slide size

**Demo (1):**
- `demos/parallax.html` — hero slider with multi-layer parallax

### 5. CSS Custom Property (--drift-progress)

Core-level feature exposing per-slide scroll progress as a CSS variable.

**API:**

```css
.drift-slide {
  filter: grayscale(calc(abs(var(--drift-progress)) * 100%));
  transform: scale(calc(1 - abs(var(--drift-progress)) * 0.15));
}
```

**Implementation:**
- Added directly in core `setTranslate` (or via a lightweight internal hook)
- Each visible slide receives `--drift-progress` ranging from -1 to 1 (0 = centered)
- Minimal overhead: only set on slides within `slidesPerView + 2` range
- No module needed — built into core

**Demo (1):**
- `demos/css-progress.html` — pure CSS effects showcase (grayscale, scale, blur, rotation combinations)

---

## Demo Summary

| Batch | Feature | Demo Pages |
|-------|---------|-----------|
| 1 | Creative Effect | `creative.html`, `creative-presets.html` |
| 1 | Ticker | `ticker.html`, `ticker-dual.html` |
| 1 | Thumbs | `thumbs-product.html`, `thumbs-vertical.html` |
| 2 | Parallax | `parallax.html` |
| 2 | CSS Progress | `css-progress.html` |
| **Total** | | **8 new demo pages** |

---

## Technical Constraints

- All new effects must use rAF animation (not CSS transitions) to avoid Mobile Safari GPU compositor bugs
- All new modules follow existing pattern: `({ slider, extendParams, on })` factory function
- No new dependencies — zero-dependency principle
- Must pass existing 399 tests + new tests for each feature
- TypeScript definitions must be updated in `types/index.d.ts`
- Demo pages follow existing `docs/demos/` conventions (shared header/footer, i18n support)

## Release Plan

- **v0.4.0**: Creative Effect + Ticker + Thumbs + 6 demo pages
- **v0.5.0**: Parallax + CSS Progress + 2 demo pages
