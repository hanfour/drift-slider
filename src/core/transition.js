export default function transitionModule({ slider }) {
  let _safetyTimer = null;

  function setTransition(duration) {
    slider.listEl.style.transitionDuration = `${duration}ms`;
    slider.emit('setTransition', slider, duration);
  }

  function transitionStart(runCallbacks = true) {
    slider.animating = true;

    // Safety timer: if CSS transitionend doesn't fire (common on mobile
    // for very short moves), force transitionEnd after the expected duration.
    clearTimeout(_safetyTimer);
    _safetyTimer = null;
    const speed = parseFloat(slider.listEl.style.transitionDuration) || 0;
    if (speed > 0) {
      _safetyTimer = setTimeout(() => {
        _safetyTimer = null;
        if (slider.animating && !slider.destroyed) {
          transitionEnd(true);
        }
      }, speed + 50); // small buffer for timing variance
    }

    if (runCallbacks) {
      slider.emit('slideChangeTransitionStart', slider);

      if (slider.activeIndex !== slider.previousIndex) {
        slider.emit('slideChange', slider);
      }
    }
  }

  function transitionEnd(runCallbacks = true) {
    if (!slider.animating) return;
    slider.animating = false;

    clearTimeout(_safetyTimer);
    _safetyTimer = null;

    // Use slider.setTransition (possibly overridden by effects like
    // coverflow) so that ALL elements (list + slides + overlays) are reset,
    // not just the listEl.
    slider.setTransition(0);

    if (runCallbacks) {
      slider.emit('slideChangeTransitionEnd', slider);
    }

    // Fix loop position after transition completes
    if (slider.params.loop) {
      slider.loopFix();
    }
  }

  function onTransitionEnd() {
    // CSS transitionend fired — clear safety timer to prevent double call
    clearTimeout(_safetyTimer);
    _safetyTimer = null;
    transitionEnd(true);
  }

  slider.setTransition = setTransition;
  slider.transitionStart = transitionStart;
  slider.transitionEnd = transitionEnd;
  slider.onTransitionEnd = onTransitionEnd;
}
