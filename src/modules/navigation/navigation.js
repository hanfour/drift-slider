import { $, createElement, addClass, removeClass } from '../../shared/dom.js';

export default function Navigation({ slider, extendParams, on }) {
  extendParams({
    navigation: {
      nextEl: null,
      prevEl: null,
      disabledClass: 'drift-arrow--disabled',
      hiddenClass: 'drift-arrow--hidden',
      prevStyle: null,
      nextStyle: null,
    },
  });

  let nextEl = null;
  let prevEl = null;

  function onNextClick(e) {
    e.preventDefault();
    if (slider.isLocked) return;
    slider.slideNext();
  }

  function onPrevClick(e) {
    e.preventDefault();
    if (slider.isLocked) return;
    slider.slidePrev();
  }

  function update() {
    const params = slider.params.navigation;
    if (!nextEl || !prevEl) return;

    if (slider.params.loop) {
      removeClass(prevEl, params.disabledClass);
      removeClass(nextEl, params.disabledClass);
      return;
    }

    if (slider.isBeginning) {
      addClass(prevEl, params.disabledClass);
      prevEl.setAttribute('aria-disabled', 'true');
    } else {
      removeClass(prevEl, params.disabledClass);
      prevEl.setAttribute('aria-disabled', 'false');
    }

    if (slider.isEnd) {
      addClass(nextEl, params.disabledClass);
      nextEl.setAttribute('aria-disabled', 'true');
    } else {
      removeClass(nextEl, params.disabledClass);
      nextEl.setAttribute('aria-disabled', 'false');
    }
  }

  function init() {
    const params = slider.params.navigation;
    if (!params) return;

    // Find or create elements
    if (params.nextEl) {
      nextEl = typeof params.nextEl === 'string' ? $(params.nextEl, slider.el) : params.nextEl;
    }
    if (params.prevEl) {
      prevEl = typeof params.prevEl === 'string' ? $(params.prevEl, slider.el) : params.prevEl;
    }

    // Auto-find by class if not specified
    if (!nextEl) nextEl = $('.drift-arrow--next', slider.el);
    if (!prevEl) prevEl = $('.drift-arrow--prev', slider.el);

    // Create if still not found and navigation is truthy
    if (!nextEl && params !== false) {
      nextEl = createElement('button', {
        className: 'drift-arrow drift-arrow--next',
        'aria-label': 'Next slide',
        type: 'button',
      });
      slider.el.appendChild(nextEl);
    }
    if (!prevEl && params !== false) {
      prevEl = createElement('button', {
        className: 'drift-arrow drift-arrow--prev',
        'aria-label': 'Previous slide',
        type: 'button',
      });
      slider.el.appendChild(prevEl);
    }

    if (prevEl && params.prevStyle) {
      Object.assign(prevEl.style, params.prevStyle);
    }
    if (nextEl && params.nextStyle) {
      Object.assign(nextEl.style, params.nextStyle);
    }

    if (nextEl) nextEl.addEventListener('click', onNextClick);
    if (prevEl) prevEl.addEventListener('click', onPrevClick);

    update();
  }

  function destroy() {
    if (nextEl) nextEl.removeEventListener('click', onNextClick);
    if (prevEl) prevEl.removeEventListener('click', onPrevClick);
    nextEl = null;
    prevEl = null;
  }

  on('init', init);
  on('slideChange', update);
  on('destroy', destroy);

  slider.navigation = { update, enable: init, disable: destroy };
}
