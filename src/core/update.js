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

    // Effects that stack slides (absolute, 100% of container) declare
    // slider._managesOwnLayout so core skips the per-slide width/margin and
    // list width/height writes — otherwise they'd be overwritten with a
    // slideCount * slideSize total on every update/resize.
    const isStackedEffect = slider._managesOwnLayout === true;

    for (let i = 0; i < slides.length; i++) {
      slidesSizesGrid.push(slideSize);

      const slidePosition = i * (slideSize + spaceBetween);
      slidesGrid.push(slidePosition);

      // Snap grid (per group). In centered mode each snap is shifted by the
      // centering offset so the slide lands in the middle of the viewport
      // (offset is 0 when centeredSlides is off, leaving this a no-op).
      if (i % params.slidesPerGroup === 0) {
        snapGrid.push(slidePosition - offset);
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

    // Total list size
    const totalSize =
      slides.length * slideSize + (slides.length - 1) * spaceBetween;

    // Translate bounds. Centered mode lets the first and last slides reach the
    // viewport centre, so the bounds are shifted by the centering offset.
    if (params.centeredSlides) {
      const lastPosition = (slides.length - 1) * (slideSize + spaceBetween);
      slider.maxTranslate = offset;
      slider.minTranslate = offset - lastPosition;
      if (slider.minTranslate > slider.maxTranslate) {
        slider.minTranslate = slider.maxTranslate;
      }
    } else {
      slider.maxTranslate = 0;
      slider.minTranslate = -(totalSize - containerSize);
      if (slider.minTranslate > 0) slider.minTranslate = 0;
    }

    // Clamp trailing snap points so the final view sits flush against the end
    // instead of overscrolling into empty space. Only relevant when slides do
    // not divide evenly into the viewport (e.g. slidesPerView > 1) and when not
    // centering (centered mode intentionally lets the last slide reach center).
    if (!params.centeredSlides) {
      const maxSnap = totalSize - containerSize;
      if (maxSnap > 0) {
        for (let k = 0; k < snapGrid.length; k++) {
          if (snapGrid[k] > maxSnap) snapGrid[k] = maxSnap;
        }
        // Drop duplicate trailing snaps created by the clamp
        let w = 1;
        for (let k = 1; k < snapGrid.length; k++) {
          if (snapGrid[k] !== snapGrid[w - 1]) snapGrid[w++] = snapGrid[k];
        }
        snapGrid.length = w;
      }
    }

    slider.snapGrid = snapGrid;
    slider.slidesGrid = slidesGrid;
    slider.slidesSizesGrid = slidesSizesGrid;

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

  // Re-read the slide elements from the DOM (e.g. after clones are added/removed).
  function refreshSlides() {
    slider.slides = Array.from(
      slider.listEl.querySelectorAll(`:scope > .${slider.params.slideClass}`)
    );
  }

  slider.calcSlides = calcSlides;
  slider.update = update;
  slider.refreshSlides = refreshSlides;
}
