# drift-slider-element

Official `<drift-slider>` Web Component for [DriftSlider](https://github.com/hanfour/drift-slider).

## Install

```bash
npm i drift-slider drift-slider-element
```

## CDN Usage

Drop in the CDN script — it self-registers `<drift-slider>` and injects the core CSS bundle automatically. No build step required.

```html
<link rel="stylesheet" href="https://unpkg.com/drift-slider/dist/css/bundle.css">
<script src="https://unpkg.com/drift-slider-element"></script>

<drift-slider loop navigation pagination slides-per-view="1">
  <img src="https://picsum.photos/seed/a/800/400" alt="">
  <img src="https://picsum.photos/seed/b/800/400" alt="">
  <img src="https://picsum.photos/seed/c/800/400" alt="">
</drift-slider>
```

The CDN IIFE exposes `window.DriftSliderElement = { DriftSliderElement, registerModules }` and pre-registers all built-in modules.

## Bundler Usage

### Auto-register (simplest)

```js
import 'drift-slider-element/define';
import { Navigation, Pagination } from 'drift-slider/modules';
import 'drift-slider/css/bundle';

// registerModules must be called before <drift-slider> connects to the DOM
import { registerModules } from 'drift-slider-element';
registerModules({ Navigation, Pagination });
```

```html
<drift-slider loop navigation pagination slides-per-view="1">
  <div>Slide 1</div>
  <div>Slide 2</div>
</drift-slider>
```

### Manual class registration (tree-shaking)

```js
import { DriftSliderElement, registerModules } from 'drift-slider-element';
import { Navigation, Pagination, Autoplay } from 'drift-slider/modules';
import 'drift-slider/css/bundle';

registerModules({ Navigation, Pagination, Autoplay });
customElements.define('drift-slider', DriftSliderElement);
```

### With CSS injection

```js
import 'drift-slider-element/with-css';
// Imports the element AND injects the core CSS bundle — no separate stylesheet needed
```

## Entry Points

| Import | What it provides |
|--------|-----------------|
| `drift-slider-element` | `DriftSliderElement` class + `registerModules` (no auto-register) |
| `drift-slider-element/define` | Auto-registers `<drift-slider>` custom element |
| `drift-slider-element/with-css` | Auto-registers + injects core CSS bundle into `<head>` |

## Attribute Reference

| Attribute | Type | Description |
|-----------|------|-------------|
| `loop` | boolean | Enable infinite loop mode |
| `slides-per-view` | number | Number of slides visible at once |
| `space-between` | number | Gap between slides in px |
| `effect` | string | `slide` \| `fade` \| `coverflow` \| `cards` |
| `direction` | string | `horizontal` \| `vertical` |
| `speed` | number | Transition duration in ms |
| `initial-slide` | number | Index of the initially active slide |
| `centered-slides` | boolean | Center the active slide |
| `navigation` | boolean | Show prev/next arrow buttons |
| `pagination` | boolean | Show pagination dots |
| `keyboard` | boolean | Enable keyboard navigation |
| `autoplay` | boolean | Enable autoplay |
| `modules` | string | Space/comma-separated registered module names (e.g. `"navigation pagination"`) |
| `config` | JSON string | Full `DriftSliderOptions` object as JSON (property `.config` wins on conflict) |

## Property API

```js
const el = document.querySelector('drift-slider');

// Set full options object — property wins over attributes on conflict
el.config = { loop: true, slidesPerView: 2, spaceBetween: 20 };

// Set module array — imported directly from drift-slider/modules
import { Navigation, Pagination } from 'drift-slider/modules';
el.modules = [Navigation, Pagination];
```

## Imperative API

```js
const el = document.querySelector('drift-slider');

el.slideTo(2);             // slide to index, optional speed + runCallbacks
el.slideNext();            // advance one slide
el.slidePrev();            // go back one slide
el.update();               // recalculate layout (call after DOM changes)
el.destroy();              // tear down the slider

el.activeIndex;            // current real index (read-only)
el.instance;               // raw DriftSlider instance (or null before init)
```

## Events

All events bubble and are composed: false. Listen on the element or any ancestor.

| Event | Fired when |
|-------|-----------|
| `drift:init` | Slider has initialised |
| `drift:slidechange` | Active slide changed |
| `drift:reachbeginning` | Reached the first slide |
| `drift:reachend` | Reached the last slide |
| `drift:touchstart` | Touch/pointer drag started |
| `drift:touchend` | Touch/pointer drag ended |
| `drift:destroy` | Slider destroyed |

Every event carries a serializable `detail` object:

```js
el.addEventListener('drift:slidechange', (e) => {
  const { activeIndex, previousIndex, progress, isBeginning, isEnd } = e.detail;
  console.log('Now on slide', activeIndex);
});
```

For advanced callbacks, access the raw core instance:

```js
el.instance.on('progress', (slider, progress) => {
  console.log('progress', progress);
});
```

## Notes

- **registerModules** — Bundler users must call `registerModules({ Navigation, … })` (modules imported from `drift-slider/modules`) before the element connects to the DOM. Only the CDN build pre-registers all modules. This preserves tree-shaking.
- **Property wins** — When both a `config` property and an attribute exist for the same option, the property value wins (a warning is logged).
- **Memoize modules** — Avoid passing a new array reference on every update; the element re-initialises when `.modules` identity changes.
- **Peer dependency** — `drift-slider >= 0.7.0` is a peer dependency; install it alongside this package.
