import { addClass, removeClass } from '../shared/dom.js';

export default function classesModule({ slider }) {
  function updateSlidesClasses() {
    const params = slider.params;
    const slides = slider.slides;
    const activeIdx = slider.activeIndex;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      removeClass(
        slide,
        params.slideActiveClass,
        params.slidePrevClass,
        params.slideNextClass,
        params.slideVisibleClass
      );
    }

    if (!slides[activeIdx]) return;

    addClass(slides[activeIdx], params.slideActiveClass);

    // Prev
    if (slides[activeIdx - 1]) {
      addClass(slides[activeIdx - 1], params.slidePrevClass);
    }
    // Next
    if (slides[activeIdx + 1]) {
      addClass(slides[activeIdx + 1], params.slideNextClass);
    }

    // Visible slides
    const perView = params.slidesPerView;
    for (let i = activeIdx; i < activeIdx + perView && i < slides.length; i++) {
      addClass(slides[i], params.slideVisibleClass);
    }
  }

  function addContainerClasses() {
    const params = slider.params;
    addClass(
      slider.el,
      'drift-slider--initialized',
      params.direction === 'horizontal'
        ? 'drift-slider--horizontal'
        : 'drift-slider--vertical'
    );
  }

  function removeContainerClasses() {
    removeClass(
      slider.el,
      'drift-slider--initialized',
      'drift-slider--horizontal',
      'drift-slider--vertical',
      'drift-slider--locked',
      'drift-slider--dragging'
    );
  }

  slider.updateSlidesClasses = updateSlidesClasses;
  slider.addContainerClasses = addContainerClasses;
  slider.removeContainerClasses = removeContainerClasses;
}
