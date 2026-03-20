export default function Thumbs({ slider, extendParams, on }) {
  extendParams({
    thumbs: {
      slider: null,
      slideThumbActiveClass: 'drift-thumb--active',
      autoScrollThumbs: true,
      multipleActiveThumbs: false,
    },
  });

  let thumbsSlider = null;
  const clickHandlers = [];

  function updateActiveThumb() {
    if (!thumbsSlider || thumbsSlider.destroyed) return;
    const params = slider.params.thumbs;
    const activeClass = params.slideThumbActiveClass;
    const realIndex = slider.realIndex ?? slider.activeIndex;

    // Remove active from all thumbs
    for (let i = 0; i < thumbsSlider.slides.length; i++) {
      thumbsSlider.slides[i].classList.remove(activeClass);
    }

    // Add active to matching thumb(s)
    for (let i = 0; i < thumbsSlider.slides.length; i++) {
      const thumbRealIndex = thumbsSlider._loopedSlides
        ? thumbsSlider._getRealIndex(i)
        : i;
      if (thumbRealIndex === realIndex) {
        thumbsSlider.slides[i].classList.add(activeClass);
      }
    }

    // Auto-scroll thumbs
    if (params.autoScrollThumbs) {
      thumbsSlider.slideTo(realIndex, slider.params.speed);
    }
  }

  function onThumbClick(index) {
    const realIndex = thumbsSlider._loopedSlides
      ? thumbsSlider._getRealIndex(index)
      : index;
    slider.slideTo(realIndex, slider.params.speed);
  }

  function init() {
    const params = slider.params.thumbs;
    if (!params || !params.slider) return;
    thumbsSlider = params.slider;

    for (let i = 0; i < thumbsSlider.slides.length; i++) {
      const handler = () => onThumbClick(i);
      thumbsSlider.slides[i].addEventListener('click', handler);
      clickHandlers.push({ el: thumbsSlider.slides[i], handler });
    }

    updateActiveThumb();
  }

  function destroy() {
    for (const { el, handler } of clickHandlers) {
      el.removeEventListener('click', handler);
    }
    clickHandlers.length = 0;

    if (thumbsSlider && !thumbsSlider.destroyed) {
      const activeClass = slider.params.thumbs.slideThumbActiveClass;
      for (let i = 0; i < thumbsSlider.slides.length; i++) {
        thumbsSlider.slides[i].classList.remove(activeClass);
      }
    }
    thumbsSlider = null;
  }

  on('init', init);
  on('slideChange', updateActiveThumb);
  on('destroy', destroy);
}
