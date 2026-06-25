export default function Keyboard({ slider, extendParams, on }) {
  extendParams({
    keyboard: {
      enabled: false,
      onlyInViewport: true,
    },
  });

  function onKeyDown(e) {
    if (slider.destroyed || slider.isLocked) return;

    const params = slider.params.keyboard;
    if (!params || !params.enabled) return;

    // Check if in viewport
    if (params.onlyInViewport) {
      const rect = slider.el.getBoundingClientRect();
      const inViewport =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;
      if (!inViewport) return;
    }

    const isHorizontal = slider.params.direction === 'horizontal';

    switch (e.key) {
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          slider.slidePrev();
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          slider.slideNext();
        }
        break;
      case 'ArrowUp':
        if (!isHorizontal) {
          e.preventDefault();
          slider.slidePrev();
        }
        break;
      case 'ArrowDown':
        if (!isHorizontal) {
          e.preventDefault();
          slider.slideNext();
        }
        break;
      case 'Home': {
        e.preventDefault();
        // In loop mode index 0 is a clone; target the first real slide.
        const first = slider.params.loop && slider._loopedSlides
          ? slider._loopedSlides
          : 0;
        slider.slideTo(first);
        break;
      }
      case 'End': {
        e.preventDefault();
        let last = slider.snapGrid.length - 1;
        if (slider.params.loop && slider._loopedSlides) {
          const realCount = slider.slides.length - slider._loopedSlides * 2;
          last = slider._loopedSlides + realCount - 1;
        }
        slider.slideTo(last);
        break;
      }
    }
  }

  function init() {
    const params = slider.params.keyboard;
    if (!params || !params.enabled) return;

    document.addEventListener('keydown', onKeyDown);
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
  }

  on('init', init);
  on('destroy', destroy);

  slider.keyboard = { enable: init, disable: destroy };
}
