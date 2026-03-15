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
      case 'Home':
        e.preventDefault();
        slider.slideTo(0);
        break;
      case 'End':
        e.preventDefault();
        slider.slideTo(slider.snapGrid.length - 1);
        break;
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
