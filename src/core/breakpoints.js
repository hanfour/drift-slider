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

    for (const key of applyKeys) {
      if (baseParams[key] !== undefined) {
        slider.params[key] = baseParams[key];
      }
    }

    slider.update();
    slider.slideTo(slider.activeIndex, 0, false);
    slider.emit('breakpoint', slider, bp);
  }

  slider.getBreakpoint = getBreakpoint;
  slider.setBreakpoint = setBreakpoint;
}
