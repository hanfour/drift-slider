import { prefersReducedMotion } from '../../shared/support.js';

export default function A11y({ slider, extendParams, on }) {
  extendParams({
    a11y: {
      enabled: true,
      prevSlideMessage: 'Previous slide',
      nextSlideMessage: 'Next slide',
      firstSlideMessage: 'This is the first slide',
      lastSlideMessage: 'This is the last slide',
      paginationBulletMessage: 'Go to slide {{index}}',
      containerMessage: null,
      containerRoleDescription: 'carousel',
      slideRole: 'group',
      slideRoleDescription: 'slide',
      liveRegion: true,
    },
  });

  let liveRegionEl = null;

  function initSlides() {
    const params = slider.params.a11y;
    const slides = slider.slides;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.setAttribute('role', params.slideRole);
      slide.setAttribute('aria-roledescription', params.slideRoleDescription);
      slide.setAttribute('aria-label', `${i + 1} / ${slides.length}`);
    }
  }

  function initContainer() {
    const params = slider.params.a11y;

    slider.el.setAttribute('role', 'region');
    slider.el.setAttribute('aria-roledescription', params.containerRoleDescription);

    if (params.containerMessage) {
      slider.el.setAttribute('aria-label', params.containerMessage);
    }

    // Tab index for keyboard focus
    slider.el.setAttribute('tabindex', '0');
  }

  function createLiveRegion() {
    const params = slider.params.a11y;
    if (!params.liveRegion) return;

    liveRegionEl = document.createElement('div');
    liveRegionEl.setAttribute('aria-live', 'polite');
    liveRegionEl.setAttribute('aria-atomic', 'true');
    liveRegionEl.className = 'drift-sr-only';
    liveRegionEl.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    slider.el.appendChild(liveRegionEl);
  }

  function updateLiveRegion() {
    if (!liveRegionEl) return;

    const index = slider.realIndex + 1;
    const total = slider.params.loop && slider._loopedSlides
      ? slider.slides.length - slider._loopedSlides * 2
      : slider.snapGrid.length;

    liveRegionEl.textContent = `Slide ${index} of ${total}`;
  }

  function handleReducedMotion() {
    if (prefersReducedMotion()) {
      slider.params.speed = 0;
      if (slider.params.autoplay && slider.params.autoplay.enabled) {
        slider.params.autoplay.delay = Math.max(slider.params.autoplay.delay, 5000);
      }
    }
  }

  function updateAria() {
    const slides = slider.slides;
    const activeIdx = slider.activeIndex;

    for (let i = 0; i < slides.length; i++) {
      slides[i].setAttribute('aria-hidden', i !== activeIdx ? 'true' : 'false');
    }

    updateLiveRegion();
  }

  function init() {
    const params = slider.params.a11y;
    if (!params || !params.enabled) return;

    handleReducedMotion();
    initContainer();
    initSlides();
    createLiveRegion();
    updateAria();
  }

  function destroy() {
    if (liveRegionEl) {
      liveRegionEl.remove();
      liveRegionEl = null;
    }
  }

  on('init', init);
  on('slideChange', updateAria);
  on('destroy', destroy);

  slider.a11y = { updateAria, initSlides };
}
