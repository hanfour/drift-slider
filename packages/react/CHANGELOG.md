# Changelog — drift-slider-react

## 0.1.0 (2026-06-26)

First release of the official React wrapper for DriftSlider. Detailed EN/ZH
notes live in the docs changelog: https://hanfour.github.io/drift-slider/changelog.html

### Features

* **component:** `<DriftSlider>` (forwardRef) renders the slider scaffold and merges `options`, `modules`, an `on` event map, and shortcut event props (`onSlideChange`, `onReachEnd`, …)
* **hook:** `useDriftSlider(options, deps)` headless hook + `<Slide>` list-item helper
* **ref:** imperative handle exposes `slideTo` / `slideNext` / `slidePrev` / `update` / `instance`
* **ssr:** ships the `'use client'` banner and initialises only in an effect; React 18 & 19; types derived from `drift-slider`
* **children:** auto-`update()` when slides are added, removed, or reordered

### Notes

* Memoize `options` / `modules` (or define them outside render) to avoid re-initialising the slider on every render; event-handler props may change freely
* Requires `drift-slider >= 0.7.0` (peer dependency)
