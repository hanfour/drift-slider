# EffectDeck — Card Deck Stack Transition Effect

## Overview

A new independent effect module (`EffectDeck`) that simulates a deck of cards. The active card is enlarged and centered, while remaining cards are scaled down and stacked in a configurable corner. Transitions animate cards moving between the deck and the active position.

Inspired by: https://case.hiyes.tw/GoodmanRuian/index.html (brand/team carousel)

## Configuration API

```js
new DriftSlider(el, {
  effect: 'deck',
  modules: [EffectDeck],
  deckEffect: {
    // Stack position
    stackOrigin: 'bottom-left',  // 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'center'

    // Sizing
    activeScale: 1,
    stackScale: 0.6,

    // Stack offset (micro-offsets between stacked cards)
    stackOffsetX: 4,       // px per layer
    stackOffsetY: 3,       // px per layer
    stackVisibleCount: 3,  // visible cards in stack

    // 3D options
    perspective: 1200,     // perspective distance, 0 = disable 3D
    depthSpacing: 30,      // translateZ gap per layer
    tiltX: 5,              // rotateX degrees for stack cards
    tiltY: -3,             // rotateY degrees for stack cards
    activeDepth: 50,       // translateZ for active card (float-up effect)

    // Visual
    overlay: true,
    overlayColor: 'rgba(0,0,0,0.15)',
    shadow: true,
    shadowColor: 'rgba(0,0,0,0.25)',
    shadowBlur: 20,
  }
})
```

## Layout Logic

### Active Card
- `scale(activeScale)`, centered in container
- `translateZ(activeDepth)` when 3D enabled
- z-index = `stackVisibleCount + 1`
- No overlay, full opacity

### Stack Cards (up to `stackVisibleCount`)
- `scale(stackScale)`, positioned at `stackOrigin` corner
- Each layer: `stackOffsetX * layer` / `stackOffsetY * layer` offset
- Each layer: `translateZ(-depthSpacing * layer)` when 3D enabled
- `rotateX(tiltX)` + `rotateY(tiltY)` when 3D enabled
- Overlay applied, decreasing opacity per layer
- z-index decreasing per layer

### Hidden Cards
- `opacity: 0`, `visibility: hidden`, `z-index: 0`

## Transition Flow

1. Current active card shrinks (`activeScale` → `stackScale`) and moves to stack top position
2. Next card grows (`stackScale` → `activeScale`) and moves from stack to center
3. Remaining stack cards shift down one layer
4. All animated via CSS transition on `transform`, `opacity`, `visibility`

## Stack Origin Positioning

| Origin | Active Position | Stack Position |
|--------|----------------|----------------|
| `bottom-left` | center | bottom-left corner |
| `bottom-right` | center | bottom-right corner |
| `top-left` | center | top-left corner |
| `top-right` | center | top-right corner |
| `center` | center | center (stacked behind) |

## File Structure

- `src/modules/effects/effect-deck.js` — module implementation
- `src/modules/index.js` — add export
- `tests/effect-deck.test.js` — unit tests
- `docs/demos/deck.html` — demo page with controls
- `docs/demos.html` — add demo card to gallery

## Module Pattern

Follows existing effect module pattern:
- `extendParams()` for default config
- Override `slider.setTranslate()` and `slider.setTransition()`
- Hook into `init`, `slideChange`, `update`, `resize`, `destroy`
- `slider.params.slidesPerView = 1` forced
- Container class: `drift-slider--deck`
- Track perspective applied when 3D enabled

## Design Decisions

- **Independent module** (not extending EffectCards): layout logic is fundamentally different — Cards uses fixed-size slides with offset, Deck uses variable-size (active enlarged, stack shrunk) with corner positioning
- **3D as progressive enhancement**: `perspective: 0` disables all 3D transforms, keeping pure 2D mode
- **stackVisibleCount**: limits DOM manipulation and visual complexity
