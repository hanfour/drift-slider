# EffectDeck Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an `EffectDeck` module that simulates a card-deck stack transition with optional 3D perspective/tilt.

**Architecture:** New effect module at `src/modules/effects/effect-deck.js` following existing pattern (override `setTranslate`/`setTransition`, hook lifecycle events). Cards stack in a configurable corner; active card enlarges to center. 3D is progressive enhancement via `perspective`/`translateZ`/`rotateX`/`rotateY`.

**Tech Stack:** Vanilla JS ES module, CSS transforms/transitions, Vitest for tests.

---

### Task 1: Create EffectDeck module skeleton

**Files:**
- Create: `src/modules/effects/effect-deck.js`
- Modify: `src/modules/index.js` (add export line)

**Step 1: Write the module skeleton**

Create `src/modules/effects/effect-deck.js`:

```js
export default function EffectDeck({ slider, extendParams, on }) {
  const overlayEls = [];

  extendParams({
    deckEffect: {
      stackOrigin: 'bottom-left',
      activeScale: 1,
      stackScale: 0.6,
      stackOffsetX: 4,
      stackOffsetY: 3,
      stackVisibleCount: 3,
      perspective: 1200,
      depthSpacing: 30,
      tiltX: 5,
      tiltY: -3,
      activeDepth: 50,
      overlay: true,
      overlayColor: 'rgba(0,0,0,0.15)',
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.25)',
      shadowBlur: 20,
    },
  });

  function init() {
    if (slider.params.effect !== 'deck') return;
    slider.params.slidesPerView = 1;
    setupSlides();
    overrideMethods();
    slider.setTranslate(slider.translate);
  }

  function setupSlides() {
    // TODO: Task 2
  }

  function overrideMethods() {
    // TODO: Task 3
  }

  function destroy() {
    // TODO: Task 5
  }

  on('init', init);
  on('destroy', destroy);
}
```

**Step 2: Add export to `src/modules/index.js`**

Add this line after the EffectCards export:

```js
export { default as EffectDeck } from './effects/effect-deck.js';
```

**Step 3: Run build to verify no syntax errors**

Run: `cd "/Volumes/SATECHI DISK Media/UserFolders/Projects/library/jquery/drift-slider" && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/modules/effects/effect-deck.js src/modules/index.js
git commit -m "feat(effect-deck): add module skeleton with default params"
```

---

### Task 2: Implement setupSlides layout

**Files:**
- Modify: `src/modules/effects/effect-deck.js`
- Test: `tests/effect-deck.test.js`

**Step 1: Write the failing test**

Create `tests/effect-deck.test.js`:

```js
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from './helpers/create-slider.js'
import EffectDeck from '../src/modules/effects/effect-deck.js'

describe('EffectDeck', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('sets slidesPerView to 1 on init', () => {
    const s = createSlider({
      sliderOptions: { effect: 'deck', modules: [EffectDeck] },
    })
    cleanup = s.cleanup
    expect(s.slider.params.slidesPerView).toBe(1)
  })

  it('adds drift-slider--deck class to container', () => {
    const s = createSlider({
      sliderOptions: { effect: 'deck', modules: [EffectDeck] },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--deck')).toBe(true)
  })

  it('positions slides absolutely', () => {
    const s = createSlider({
      sliderOptions: { effect: 'deck', modules: [EffectDeck] },
    })
    cleanup = s.cleanup
    const slide = s.slider.slides[0]
    expect(slide.style.position).toBe('absolute')
  })

  it('active slide has highest z-index', () => {
    const s = createSlider({
      sliderOptions: { effect: 'deck', modules: [EffectDeck] },
    })
    cleanup = s.cleanup
    const activeSlide = s.slider.slides[s.slider.activeIndex]
    expect(Number(activeSlide.style.zIndex)).toBeGreaterThanOrEqual(4)
  })

  it('does nothing when effect is not deck', () => {
    const s = createSlider({
      sliderOptions: { effect: 'slide', modules: [EffectDeck] },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--deck')).toBe(false)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/effect-deck.test.js`
Expected: FAIL (setupSlides is empty)

**Step 3: Implement setupSlides**

In `effect-deck.js`, replace the `setupSlides` function:

```js
function setupSlides() {
  const slides = slider.slides;
  const params = slider.params.deckEffect;
  const firstSlide = slides[0];
  const slideHeight = firstSlide ? firstSlide.offsetHeight : 0;

  slider.listEl.style.position = 'relative';
  slider.listEl.style.height = `${slideHeight}px`;
  slider.el.classList.add('drift-slider--deck');

  // Set perspective on track if 3D enabled
  if (params.perspective && slider.trackEl) {
    slider.trackEl.style.perspective = `${params.perspective}px`;
    slider.trackEl.style.transformStyle = 'preserve-3d';
  }

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    slide.style.position = 'absolute';
    slide.style.top = '0';
    slide.style.left = '0';
    slide.style.width = '100%';
    slide.style.height = '100%';
    slide.style.transitionProperty = 'transform, opacity, visibility, box-shadow';
    slide.style.transitionDuration = `${slider.params.speed}ms`;
    slide.style.transformOrigin = getTransformOrigin(params.stackOrigin);

    // Create overlay if needed
    if (params.overlay) {
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'drift-deck-overlay';
      overlayDiv.style.position = 'absolute';
      overlayDiv.style.inset = '0';
      overlayDiv.style.borderRadius = 'inherit';
      overlayDiv.style.pointerEvents = 'none';
      overlayDiv.style.transitionProperty = 'opacity';
      overlayDiv.style.transitionDuration = `${slider.params.speed}ms`;
      slide.appendChild(overlayDiv);
      overlayEls[i] = overlayDiv;
    }
  }
}

function getTransformOrigin(origin) {
  const map = {
    'bottom-left': 'left bottom',
    'bottom-right': 'right bottom',
    'top-left': 'left top',
    'top-right': 'right top',
    'center': 'center center',
  };
  return map[origin] || 'left bottom';
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/effect-deck.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/effects/effect-deck.js tests/effect-deck.test.js
git commit -m "feat(effect-deck): implement setupSlides layout with overlays and 3D perspective"
```

---

### Task 3: Implement setSlideTransforms (core positioning logic)

**Files:**
- Modify: `src/modules/effects/effect-deck.js`
- Modify: `tests/effect-deck.test.js`

**Step 1: Add failing tests**

Append to `tests/effect-deck.test.js`:

```js
it('stack cards are visible up to stackVisibleCount', () => {
  const s = createSlider({
    slideCount: 6,
    sliderOptions: {
      effect: 'deck',
      modules: [EffectDeck],
      deckEffect: { stackVisibleCount: 2 },
    },
  })
  cleanup = s.cleanup
  // Active (0) visible, stack (1,2) visible, rest hidden
  expect(s.slider.slides[0].style.opacity).toBe('1')
  expect(s.slider.slides[1].style.visibility).toBe('visible')
  expect(s.slider.slides[2].style.visibility).toBe('visible')
  expect(s.slider.slides[3].style.visibility).toBe('hidden')
})

it('applies 3D transforms when perspective > 0', () => {
  const s = createSlider({
    sliderOptions: {
      effect: 'deck',
      modules: [EffectDeck],
      deckEffect: { perspective: 1200, tiltX: 5, tiltY: -3 },
    },
  })
  cleanup = s.cleanup
  // Stack card should have rotateX/rotateY in transform
  const stackSlide = s.slider.slides[1]
  expect(stackSlide.style.transform).toContain('rotateX')
  expect(stackSlide.style.transform).toContain('rotateY')
})

it('no 3D transforms when perspective is 0', () => {
  const s = createSlider({
    sliderOptions: {
      effect: 'deck',
      modules: [EffectDeck],
      deckEffect: { perspective: 0 },
    },
  })
  cleanup = s.cleanup
  const stackSlide = s.slider.slides[1]
  expect(stackSlide.style.transform).not.toContain('rotateX')
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/effect-deck.test.js`
Expected: FAIL

**Step 3: Implement setSlideTransforms and overrideMethods**

In `effect-deck.js`:

```js
function getStackPosition(origin, containerW, containerH, stackScale) {
  // Returns {x, y} for where the scaled-down stack should sit
  const scaledW = containerW * stackScale;
  const scaledH = containerH * stackScale;
  const gapX = (containerW - scaledW) / 2;
  const gapY = (containerH - scaledH) / 2;

  const map = {
    'bottom-left':  { x: -gapX, y: gapY },
    'bottom-right': { x: gapX, y: gapY },
    'top-left':     { x: -gapX, y: -gapY },
    'top-right':    { x: gapX, y: -gapY },
    'center':       { x: 0, y: 0 },
  };
  return map[origin] || map['bottom-left'];
}

function setSlideTransforms() {
  const slides = slider.slides;
  const params = slider.params.deckEffect;
  const activeIdx = slider.activeIndex;
  const total = slides.length;
  const containerW = slider.el.clientWidth || 800;
  const containerH = slider.el.clientHeight || 400;
  const use3D = params.perspective > 0;

  const stackPos = getStackPosition(
    params.stackOrigin, containerW, containerH, params.stackScale
  );

  for (let i = 0; i < total; i++) {
    const slide = slides[i];
    // Calculate offset from active (considering loop)
    let offset = i - activeIdx;
    if (slider.params.loop) {
      if (offset > total / 2) offset -= total;
      if (offset < -total / 2) offset += total;
    }

    if (offset === 0) {
      // --- Active card: centered, full scale ---
      const tz = use3D ? `translateZ(${params.activeDepth}px)` : '';
      slide.style.transform =
        `translate3d(0, 0, 0) scale(${params.activeScale}) ${tz}`.trim();
      slide.style.opacity = '1';
      slide.style.visibility = 'visible';
      slide.style.zIndex = String(params.stackVisibleCount + 1);
      slide.style.pointerEvents = 'auto';

      if (params.shadow) {
        slide.style.boxShadow =
          `0 ${params.shadowBlur / 2}px ${params.shadowBlur}px ${params.shadowColor}`;
      } else {
        slide.style.boxShadow = 'none';
      }

      if (overlayEls[i]) {
        overlayEls[i].style.background = params.overlayColor;
        overlayEls[i].style.opacity = '0';
      }
    } else if (offset > 0 && offset <= params.stackVisibleCount) {
      // --- Stack cards: behind active, offset toward corner ---
      const layer = offset; // 1, 2, 3...
      const tx = stackPos.x + params.stackOffsetX * layer;
      const ty = stackPos.y + params.stackOffsetY * layer;
      const tz = use3D ? `translateZ(${-params.depthSpacing * layer}px)` : '';
      const rx = use3D ? `rotateX(${params.tiltX}deg)` : '';
      const ry = use3D ? `rotateY(${params.tiltY}deg)` : '';
      const layerOpacity = 1 - (layer * 0.15);

      slide.style.transform =
        `translate3d(${tx}px, ${ty}px, 0) scale(${params.stackScale}) ${tz} ${rx} ${ry}`.trim();
      slide.style.opacity = String(Math.max(layerOpacity, 0.4));
      slide.style.visibility = 'visible';
      slide.style.zIndex = String(params.stackVisibleCount + 1 - layer);
      slide.style.pointerEvents = 'none';
      slide.style.boxShadow = 'none';

      if (overlayEls[i]) {
        overlayEls[i].style.background = params.overlayColor;
        overlayEls[i].style.opacity = params.overlay ? String(layer * 0.3) : '0';
      }
    } else {
      // --- Hidden cards ---
      slide.style.transform =
        `translate3d(${stackPos.x}px, ${stackPos.y}px, 0) scale(${params.stackScale})`;
      slide.style.opacity = '0';
      slide.style.visibility = 'hidden';
      slide.style.zIndex = '0';
      slide.style.pointerEvents = 'none';
      slide.style.boxShadow = 'none';

      if (overlayEls[i]) {
        overlayEls[i].style.opacity = '0';
      }
    }
  }
}

function overrideMethods() {
  slider.setTranslate = function (translate) {
    slider.translate = translate;

    slider.progress = slider.maxTranslate === slider.minTranslate
      ? 0
      : (translate - slider.maxTranslate) /
        (slider.minTranslate - slider.maxTranslate);

    slider.isBeginning = translate >= slider.maxTranslate;
    slider.isEnd = translate <= slider.minTranslate;

    slider.emit('setTranslate', slider, translate);
    slider.emit('progress', slider, slider.progress);

    setSlideTransforms();
  };

  slider.setTransition = function (duration) {
    for (let i = 0; i < slider.slides.length; i++) {
      slider.slides[i].style.transitionDuration = `${duration}ms`;
      if (overlayEls[i]) {
        overlayEls[i].style.transitionDuration = `${duration}ms`;
      }
    }
    slider.emit('setTransition', slider, duration);
  };
}
```

Also add `slideChange`, `update`, `resize` handlers in `init()`:

```js
on('slideChange', onSlideChange);
on('update', onUpdate);
on('resize', onUpdate);
```

With:

```js
function onSlideChange() {
  if (slider.params.effect !== 'deck') return;
  setSlideTransforms();
}

function onUpdate() {
  if (slider.params.effect !== 'deck') return;
  slider.setTranslate(slider.translate);
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/effect-deck.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/effects/effect-deck.js tests/effect-deck.test.js
git commit -m "feat(effect-deck): implement core positioning logic with 3D transforms"
```

---

### Task 4: Implement destroy cleanup

**Files:**
- Modify: `src/modules/effects/effect-deck.js`
- Modify: `tests/effect-deck.test.js`

**Step 1: Add failing test**

```js
it('destroy cleans up styles and classes', () => {
  const s = createSlider({
    sliderOptions: { effect: 'deck', modules: [EffectDeck] },
  })
  const container = s.container
  s.slider.destroy()
  container.remove()
  cleanup = null
  expect(container.classList.contains('drift-slider--deck')).toBe(false)
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/effect-deck.test.js`

**Step 3: Implement destroy**

```js
function destroy() {
  slider.el.classList.remove('drift-slider--deck');

  if (slider.trackEl) {
    slider.trackEl.style.perspective = '';
    slider.trackEl.style.transformStyle = '';
  }

  for (let i = 0; i < slider.slides.length; i++) {
    const slide = slider.slides[i];
    slide.style.position = '';
    slide.style.top = '';
    slide.style.left = '';
    slide.style.width = '';
    slide.style.height = '';
    slide.style.transform = '';
    slide.style.opacity = '';
    slide.style.visibility = '';
    slide.style.zIndex = '';
    slide.style.pointerEvents = '';
    slide.style.boxShadow = '';
    slide.style.transitionProperty = '';
    slide.style.transitionDuration = '';
    slide.style.transformOrigin = '';

    if (overlayEls[i] && overlayEls[i].parentNode) {
      overlayEls[i].parentNode.removeChild(overlayEls[i]);
    }
  }
  overlayEls.length = 0;

  slider.listEl.style.height = '';
  slider.listEl.style.position = '';
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/effect-deck.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/modules/effects/effect-deck.js tests/effect-deck.test.js
git commit -m "feat(effect-deck): implement destroy cleanup"
```

---

### Task 5: Build and copy to docs

**Files:**
- Modify: `docs/assets/lib/drift-slider.umd.js` (auto-generated)
- Modify: `docs/assets/lib/drift-slider-bundle.css` (auto-generated)

**Step 1: Build**

Run: `npm run build`
Expected: Build succeeds

**Step 2: Copy built files to docs**

Run: `cp dist/drift-slider.umd.js docs/assets/lib/ && cp dist/drift-slider-bundle.css docs/assets/lib/`

**Step 3: Run all tests**

Run: `npm test`
Expected: All pass

**Step 4: Commit**

```bash
git add dist/ docs/assets/lib/
git commit -m "build: update dist and docs lib with EffectDeck"
```

---

### Task 6: Create deck.html demo page

**Files:**
- Create: `docs/demos/deck.html`

**Step 1: Create the demo page**

Create `docs/demos/deck.html` following the exact pattern from `docs/demos/cards.html`. Key differences:
- Title: "DriftSlider — Deck Effect"
- i18n: EN "Deck Effect" / ZH "牌堆效果"
- Description: EN "Card deck stack transition with optional 3D perspective and tilt." / ZH "卡片堆疊過場效果，可選 3D 透視與傾斜角度。"
- Use `EffectDeck` instead of `EffectCards`
- Effect name: `'deck'`
- Controls for: `stackOrigin`, `activeScale`, `stackScale`, `stackOffsetX`, `stackOffsetY`, `stackVisibleCount`, `perspective`, `depthSpacing`, `tiltX`, `tiltY`, `activeDepth`, `overlay`, `shadow`
- 6 slides using picsum.photos with seed URLs: `https://picsum.photos/seed/deck1/800/500` through `deck6`
- Slide content should use `<img>` tags for visual appeal instead of plain color blocks

**Step 2: Verify page loads**

Open in browser, check:
- Slider renders with deck effect
- Controls update slider in real-time
- i18n toggle works
- No console errors

**Step 3: Commit**

```bash
git add docs/demos/deck.html
git commit -m "feat(demo): add deck effect demo page with interactive controls"
```

---

### Task 7: Register demo in gallery

**Files:**
- Modify: `docs/demos.html`

**Step 1: Add deck card to Effects section**

In `docs/demos.html`, inside the "Effects" `<div class="demo-grid">` section (after the Creative Presets card, before the closing `</div>`), add:

```html
<a href="demos/deck.html" class="demo-card">
  <div class="demo-preview" style="background:linear-gradient(135deg,#2FB8A1,#B3F0E4);"><span class="icon icon-layers" aria-hidden="true"></span></div>
  <div class="demo-info">
    <h3>Deck</h3>
    <p data-i18n-en>Card deck stack with 3D perspective and tilt.</p>
    <p data-i18n-zh>卡片牌堆堆疊效果，3D 透視與傾斜角度。</p>
  </div>
</a>
```

**Step 2: Verify gallery page**

Open `docs/demos.html`, confirm the Deck card appears in the Effects section.

**Step 3: Commit**

```bash
git add docs/demos.html
git commit -m "feat(demo): register deck effect in demo gallery"
```

---

### Task 8: Final verification

**Step 1: Run full test suite**

Run: `npm test`
Expected: All tests pass

**Step 2: Build clean**

Run: `npm run build`
Expected: No errors

**Step 3: Manual verification checklist**

- [ ] `docs/demos/deck.html` loads without console errors
- [ ] Deck effect shows active card centered, stack in corner
- [ ] Arrow/pagination navigation works
- [ ] 3D perspective visible (cards have depth)
- [ ] Tilt visible on stack cards
- [ ] Setting perspective to 0 disables 3D
- [ ] All 5 stackOrigin options work
- [ ] Controls update slider in real time
- [ ] i18n toggle switches EN/ZH
- [ ] Demo gallery shows Deck card
