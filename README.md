<p align="center">
  <img src="docs/assets/img/logo.svg" width="80" height="80" alt="DriftSlider Logo">
</p>

<h1 align="center">DriftSlider</h1>

<p align="center">
  Lightweight, modular slider/carousel with physics-based touch interaction.<br>
  4 effects · 9 modules · jQuery plugin · TypeScript — under 10KB gzipped.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/drift-slider"><img src="https://img.shields.io/npm/v/drift-slider.svg" alt="npm version"></a>
  <a href="https://github.com/hanfour/drift-slider/actions/workflows/ci.yml"><img src="https://github.com/hanfour/drift-slider/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/gzip-<10KB-brightgreen.svg" alt="< 10KB gzipped">
  <img src="https://img.shields.io/badge/dependencies-0-brightgreen.svg" alt="Zero Dependencies">
</p>

<p align="center">
  <a href="https://hanfour.github.io/drift-slider/">Documentation</a> ·
  <a href="https://hanfour.github.io/drift-slider/demos.html">Demos</a> ·
  <a href="https://hanfour.github.io/drift-slider/api.html">API Reference</a>
</p>

---

## Features

- **Lightweight** — Core under 10KB gzipped, zero production dependencies
- **Physics-Based Touch** — Velocity tracking, friction, and bounce for natural feel
- **4 Effects** — Slide, Fade, 3D Coverflow, Cards (stack/diagonal/flip)
- **9 Optional Modules** — Navigation, Pagination, Autoplay, EffectFade, EffectCoverflow, EffectCards, Keyboard, A11y, ScrollAos
- **Modular Architecture** — Only bundle what you use
- **Dual Interface** — Vanilla JS (ESM/UMD/CJS) + jQuery plugin
- **Responsive** — Breakpoint system for mobile-first adaptive designs
- **Accessible** — ARIA labels, keyboard navigation, prefers-reduced-motion
- **TypeScript Ready** — Full type definitions included

## Quick Start

### npm

```bash
npm install drift-slider
```

### CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/drift-slider/dist/drift-slider-bundle.css">
<script src="https://cdn.jsdelivr.net/npm/drift-slider/dist/drift-slider.umd.js"></script>
```

### ESM

```javascript
import DriftSlider from 'drift-slider';
import { Navigation, Pagination } from 'drift-slider/modules';
import 'drift-slider/css/bundle';

const slider = new DriftSlider('.drift-slider', {
  modules: [Navigation, Pagination],
  slidesPerView: 1,
  spaceBetween: 20,
  speed: 400,
  grabCursor: true,
});
```

### jQuery

```javascript
$('.drift-slider').driftSlider({
  slidesPerView: 1,
  loop: true,
  navigation: true,
  pagination: { type: 'bullets' },
  autoplay: { enabled: true, delay: 4000 },
});
```

## React

An official React wrapper is available as `drift-slider-react`:

```bash
npm i drift-slider drift-slider-react
```

See [`packages/react/README.md`](packages/react/README.md) for usage.

## Web Component

An official Web Component wrapper is available as `drift-slider-element`:

```bash
npm i drift-slider drift-slider-element
```

**CDN** — drop one script tag; `<drift-slider>` auto-registers and CSS is injected:

```html
<script src="https://unpkg.com/drift-slider-element"></script>

<drift-slider loop navigation pagination slides-per-view="1">
  <img src="https://picsum.photos/seed/a/800/400" alt="">
  <img src="https://picsum.photos/seed/b/800/400" alt="">
</drift-slider>
```

**Bundler** — import and register only the modules you use:

```js
import 'drift-slider-element/define';
import { registerModules } from 'drift-slider-element';
import { Navigation, Pagination } from 'drift-slider/modules';

registerModules({ Navigation, Pagination });
```

See [`packages/element/README.md`](packages/element/README.md) for the full attribute table, events, and imperative API.

## HTML Structure

```html
<section class="drift-slider" aria-label="My Slider">
  <div class="drift-track">
    <ul class="drift-list">
      <li class="drift-slide">Slide 1</li>
      <li class="drift-slide">Slide 2</li>
      <li class="drift-slide">Slide 3</li>
    </ul>
  </div>
  <button class="drift-arrow drift-arrow--prev" type="button"></button>
  <button class="drift-arrow drift-arrow--next" type="button"></button>
  <div class="drift-pagination"></div>
</section>
```

## Effects

| Effect | Module | Description |
|--------|--------|-------------|
| `slide` | *(built-in)* | Classic horizontal/vertical sliding |
| `fade` | `EffectFade` | Smooth cross-fade transition |
| `coverflow` | `EffectCoverflow` | 3D cover flow with depth, rotation, and scaling |
| `cards` | `EffectCards` | Stacked cards with stack, diagonal, and flip modes |

## Responsive Breakpoints

```javascript
new DriftSlider('.slider', {
  slidesPerView: 1,
  breakpoints: {
    768: { slidesPerView: 2, spaceBetween: 20 },
    1024: { slidesPerView: 3, spaceBetween: 24 },
  },
});
```

## Documentation

- [Getting Started](https://hanfour.github.io/drift-slider/getting-started.html)
- [API Reference](https://hanfour.github.io/drift-slider/api.html)
- [Modules](https://hanfour.github.io/drift-slider/modules.html)
- [Demo Gallery](https://hanfour.github.io/drift-slider/demos.html)
- [Changelog](https://hanfour.github.io/drift-slider/changelog.html)

## Browser Support

- Chrome / Edge (latest)
- Firefox (latest)
- Safari (latest)
- iOS Safari (latest)
- Android Chrome (latest)

## License

[MIT](LICENSE)
