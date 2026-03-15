export default function transitionModule({ slider }) {
  function setTransition(duration) {
    slider.listEl.style.transitionDuration = `${duration}ms`;
    slider.emit('setTransition', slider, duration);
  }

  function transitionStart(runCallbacks = true) {
    slider.animating = true;
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
    setTransition(0);
    if (runCallbacks) {
      slider.emit('slideChangeTransitionEnd', slider);
    }

    // Fix loop position after transition completes
    if (slider.params.loop) {
      slider.loopFix();
    }
  }

  function onTransitionEnd() {
    transitionEnd(true);
  }

  slider.setTransition = setTransition;
  slider.transitionStart = transitionStart;
  slider.transitionEnd = transitionEnd;
  slider.onTransitionEnd = onTransitionEnd;
}
