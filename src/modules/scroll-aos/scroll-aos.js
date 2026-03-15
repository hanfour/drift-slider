export default function ScrollAos({ slider, extendParams, on }) {
  extendParams({
    scrollAos: {
      enabled: true,
      animation: 'fade-up',
      duration: 800,
      offset: 120,
      once: true,
      setContainerAos: false,
      slideAnimation: null,
      slideDelay: 100,
      refreshOnChange: true,
    },
  });

  const AOS_ATTRS = [
    'data-aos',
    'data-aos-duration',
    'data-aos-offset',
    'data-aos-once',
    'data-aos-delay',
  ];

  let containerAosWasSet = false;
  const slideAosIndexes = [];

  function getAOS() {
    if (typeof window !== 'undefined' && typeof window.AOS !== 'undefined') {
      return window.AOS;
    }
    return null;
  }

  function init() {
    const params = slider.params.scrollAos;
    if (!params || params.enabled === false) return;

    // Only set container data-aos if explicitly opted in
    if (params.setContainerAos && !slider.el.hasAttribute('data-aos')) {
      slider.el.setAttribute('data-aos', params.animation);
      slider.el.setAttribute('data-aos-duration', String(params.duration));
      slider.el.setAttribute('data-aos-offset', String(params.offset));
      slider.el.setAttribute('data-aos-once', String(params.once));
      containerAosWasSet = true;
    }

    // Per-slide AOS attributes
    if (params.slideAnimation) {
      for (let i = 0; i < slider.slides.length; i++) {
        const slide = slider.slides[i];
        slide.setAttribute('data-aos', params.slideAnimation);
        slide.setAttribute('data-aos-delay', String(i * params.slideDelay));
        slideAosIndexes.push(i);
      }
    }

    const aos = getAOS();
    if (aos) {
      aos.refresh();
    }
  }

  function onSlideChange() {
    const params = slider.params.scrollAos;
    if (!params || params.enabled === false) return;
    if (!params.refreshOnChange) return;

    const aos = getAOS();
    if (aos) {
      aos.refresh();
    }
  }

  function destroy() {
    // Only remove container attrs if we set them
    if (containerAosWasSet) {
      AOS_ATTRS.forEach(function (attr) {
        slider.el.removeAttribute(attr);
      });
      containerAosWasSet = false;
    }

    // Remove AOS attributes from slides we modified
    for (let i = 0; i < slideAosIndexes.length; i++) {
      const idx = slideAosIndexes[i];
      if (slider.slides[idx]) {
        AOS_ATTRS.forEach(function (attr) {
          slider.slides[idx].removeAttribute(attr);
        });
      }
    }
    slideAosIndexes.length = 0;
  }

  on('init', init);
  on('slideChange', onSlideChange);
  on('destroy', destroy);
}
