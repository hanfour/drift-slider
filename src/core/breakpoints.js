import { deepMerge } from '../shared/utils.js';

export default function breakpointsModule({ slider }) {
  let currentBreakpoint = undefined; // use undefined so first call always runs

  function getBreakpoint() {
    const breakpoints = slider.params.breakpoints;
    if (!breakpoints) return null;

    const windowWidth = window.innerWidth;
    const points = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => a - b);

    let matched = null;
    for (const point of points) {
      if (windowWidth >= point) {
        matched = point;
      }
    }
    return matched;
  }

  function setBreakpoint() {
    const breakpoints = slider.params.breakpoints;
    if (!breakpoints) return;

    const bp = getBreakpoint();
    if (bp === currentBreakpoint) return;

    currentBreakpoint = bp;

    // Reset to original params, then merge breakpoint overrides
    const baseParams = deepMerge({}, slider._originalParams);
    if (bp !== null && breakpoints[bp]) {
      deepMerge(baseParams, breakpoints[bp]);
    }

    // Apply relevant params
    const applyKeys = [
      'slidesPerView', 'spaceBetween', 'slidesPerGroup',
      'centeredSlides', 'loop', 'speed', 'grabCursor',
    ];

    // Toggling loop at a breakpoint must rebuild/remove the clones, otherwise
    // params.loop and the actual clone set fall out of sync.
    const prevLoop = slider.params.loop;
    const nextLoop = baseParams.loop;
    const realIndex = slider.realIndex;

    // Remove clones while params.loop is still true (destroyLoop guards on it)
    if (nextLoop === false && prevLoop === true) {
      slider.destroyLoop();
      slider._loopedSlides = 0;
      slider.slides = Array.from(
        slider.listEl.querySelectorAll(`:scope > .${slider.params.slideClass}`)
      );
    }

    for (const key of applyKeys) {
      if (baseParams[key] !== undefined) {
        slider.params[key] = baseParams[key];
      }
    }

    // Build clones now that params.loop is true
    if (nextLoop === true && prevLoop === false && !slider._loopedSlides) {
      slider.createLoop();
    }

    // Keep the same real slide active across the toggle
    if (nextLoop !== prevLoop) {
      slider.activeIndex = nextLoop
        ? realIndex + (slider._loopedSlides || 0)
        : realIndex;
    }

    slider.update();
    slider.slideTo(slider.activeIndex, 0, false);
    slider.emit('breakpoint', slider, bp);
  }

  slider.getBreakpoint = getBreakpoint;
  slider.setBreakpoint = setBreakpoint;
}
