export default function updateModule({ slider }) {
  function calcSlides() {
    const params = slider.params;
    const isHorizontal = params.direction === 'horizontal';
    const slides = slider.slides;

    if (!slides.length) return;

    // Container size
    const containerSize = isHorizontal
      ? slider.el.clientWidth
      : slider.el.clientHeight;

    slider.containerSize = containerSize;

    // Calculate slide size
    const spaceBetween = params.spaceBetween;
    const perView = params.slidesPerView;
    const slideSize =
      (containerSize - spaceBetween * (perView - 1)) / perView;

    slider.slideSize = slideSize;

    // Calculate snap grid and slide positions
    const snapGrid = [];
    const slidesGrid = [];
    const slidesSizesGrid = [];

    let offset = 0;

    if (params.centeredSlides) {
      offset = containerSize / 2 - slideSize / 2;
    }

    // Stacked effects (fade) position all slides at the same spot via opacity
    // rather than translating a track. Skip per-slide width/margin writes so
    // the effect's own sizing (100% of container) is preserved across updates.
    const isStackedEffect = params.effect === 'fade';

    for (let i = 0; i < slides.length; i++) {
      slidesSizesGrid.push(slideSize);

      const slidePosition = i * (slideSize + spaceBetween);
      slidesGrid.push(slidePosition);

      // Snap grid (per group)
      if (i % params.slidesPerGroup === 0) {
        snapGrid.push(slidePosition);
      }

      // Set slide dimensions
      if (!isStackedEffect) {
        if (isHorizontal) {
          slides[i].style.width = `${slideSize}px`;
          slides[i].style.marginRight = `${spaceBetween}px`;
        } else {
          slides[i].style.height = `${slideSize}px`;
          slides[i].style.marginBottom = `${spaceBetween}px`;
        }
      }
    }

    slider.snapGrid = snapGrid;
    slider.slidesGrid = slidesGrid;
    slider.slidesSizesGrid = slidesSizesGrid;

    // Total list size
    const totalSize =
      slides.length * slideSize + (slides.length - 1) * spaceBetween;

    // Max translate
    slider.maxTranslate = 0;
    slider.minTranslate = -(totalSize - containerSize);

    if (slider.minTranslate > 0) slider.minTranslate = 0;

    // Check overflow (not enough slides)
    slider.isLocked =
      params.watchOverflow && snapGrid.length <= 1;

    // Update list size. For stacked effects the list must remain at
    // container size — the effect module sets its own height on init.
    if (!isStackedEffect) {
      if (isHorizontal) {
        slider.listEl.style.width = `${totalSize}px`;
      } else {
        slider.listEl.style.height = `${totalSize}px`;
      }
    }
  }

  function update() {
    calcSlides();
    slider.updateSlidesClasses();
    slider.emit('update', slider);
  }

  slider.calcSlides = calcSlides;
  slider.update = update;
}
