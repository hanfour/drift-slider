# Migration Guide

## Pre-1.0 Versioning

DriftSlider follows [Semantic Versioning](https://semver.org/). While the version is below 1.0.0, minor versions (0.x.0) may include breaking changes. Patch versions (0.0.x) are backward-compatible bug fixes.

We recommend pinning to a specific minor version in your `package.json`:

```json
"drift-slider": "~0.1.0"
```

## API Stability

| API | Status | Notes |
|-----|--------|-------|
| `new DriftSlider(el, options)` | Stable | Core constructor |
| `slideTo()` / `slideNext()` / `slidePrev()` | Stable | Navigation API |
| `destroy()` | Stable | Cleanup |
| `on()` / `off()` / `emit()` | Stable | Event system |
| `enable()` / `disable()` | Stable | Toggle interaction |
| Navigation module | Stable | Prev/next buttons |
| Pagination module | Stable | Bullets, fraction, progressbar |
| Autoplay module | Stable | Auto-advance |
| Keyboard module | Stable | Arrow key navigation |
| A11y module | Stable | Accessibility features |
| EffectFade module | Stable | Fade transition |
| EffectCoverflow module | Experimental | 3D coverflow effect |
| EffectCards module | Experimental | Card stacking effect |
| ScrollAos module | Experimental | Scroll animations |
| Breakpoints | Stable | Responsive configuration |
| Loop mode | Stable | Infinite loop |
| Physics config | May Change | `physics.friction`, `physics.attraction`, `physics.bounceRate` |
| CSS class names | Stable | `drift-slider`, `drift-slide`, etc. |
| jQuery plugin | Stable | `$('.el').driftSlider()` |

### Status Definitions

- **Stable** — API is locked. Breaking changes only in major versions.
- **Experimental** — Fully functional but API details may evolve in minor versions.
- **May Change** — Working but subject to redesign. Pin your version if you depend on these.

## v0.1.0 (Initial Release)

This is the first public release. No migration is needed. Future breaking changes will be documented here.
