import { debounce } from '../shared/utils.js';

export default function eventsModule({ slider }) {
  let resizeHandler;

  function onListTransitionEnd(e) {
    // Only handle transform transitions on the list element itself
    if (e.target !== slider.listEl) return;
    if (e.propertyName !== 'transform') return;
    slider.onTransitionEnd();
  }

  function attachEvents() {
    resizeHandler = debounce(() => {
      if (slider.destroyed) return;
      slider.setBreakpoint();
      slider.update();
      slider.slideTo(slider.activeIndex, 0, false);
      slider.emit('resize', slider);
    }, 200);

    window.addEventListener('resize', resizeHandler);
    slider.listEl.addEventListener('transitionend', onListTransitionEnd);
  }

  function detachEvents() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
    slider.listEl.removeEventListener('transitionend', onListTransitionEnd);
  }

  slider.attachEvents = attachEvents;
  slider.detachEvents = detachEvents;
}
