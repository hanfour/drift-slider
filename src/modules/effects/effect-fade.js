export default function EffectFade({ slider, extendParams, on }) {
  extendParams({
    fadeEffect: {
      crossFade: true,
    },
  });

  function setOpacity() {
    const slides = slider.slides;
    const activeIdx = slider.activeIndex;
    const crossFade = slider.params.fadeEffect.crossFade;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      if (i === activeIdx) {
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.pointerEvents = 'auto';
      } else {
        slide.style.opacity = crossFade ? '0' : '0';
        slide.style.visibility = crossFade ? 'visible' : 'hidden';
        slide.style.pointerEvents = 'none';
      }
    }
  }

  function setupSlides() {
    const slides = slider.slides;

    // Measure the natural height of the first slide BEFORE making them absolute
    const firstSlide = slides[0];
    const slideHeight = firstSlide ? firstSlide.offsetHeight : 0;

    // Set explicit height on list so it doesn't collapse when children become absolute
    slider.listEl.style.position = 'relative';
    slider.listEl.style.height = `${slideHeight}px`;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.style.position = 'absolute';
      slide.style.top = '0';
      slide.style.left = '0';
      slide.style.width = '100%';
      slide.style.height = '100%';
      slide.style.transitionProperty = 'opacity, visibility';
      slide.style.transitionDuration = `${slider.params.speed}ms`;
    }
  }

  function init() {
    if (slider.params.effect !== 'fade') return;

    setupSlides();

    // Override setTranslate to prevent CSS transform movement
    // but preserve progress/boundary calculations
    const originalSetTranslate = slider.setTranslate.bind(slider);
    slider.setTranslate = function (translate) {
      // Update internal state (progress, isBeginning, isEnd) without moving the list
      slider.translate = translate;

      slider.progress = slider.maxTranslate === slider.minTranslate
        ? 0
        : (translate - slider.maxTranslate) /
          (slider.minTranslate - slider.maxTranslate);

      slider.isBeginning = translate >= slider.maxTranslate;
      slider.isEnd = translate <= slider.minTranslate;

      slider.emit('setTranslate', slider, translate);
      slider.emit('progress', slider, slider.progress);

      // Don't apply CSS transform — fade uses opacity
      setOpacity();
    };

    // Override setTransition to apply to slides instead of list
    slider.setTransition = function (duration) {
      for (const slide of slider.slides) {
        slide.style.transitionDuration = `${duration}ms`;
      }
      slider.emit('setTransition', slider, duration);
    };

    setOpacity();
  }

  function onSlideChange() {
    if (slider.params.effect !== 'fade') return;
    setOpacity();
  }

  function destroy() {
    for (const slide of slider.slides) {
      slide.style.opacity = '';
      slide.style.visibility = '';
      slide.style.pointerEvents = '';
      slide.style.position = '';
      slide.style.top = '';
      slide.style.left = '';
      slide.style.width = '';
      slide.style.height = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
    }
  }

  on('init', init);
  on('slideChange', onSlideChange);
  on('destroy', destroy);
}
