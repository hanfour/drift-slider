import { addClass } from '../shared/dom.js';

export default function loopModule({ slider }) {
  function createLoop() {
    if (!slider.params.loop) return;

    const slides = slider.slides;
    const perView = Math.ceil(slider.params.slidesPerView);
    const additional = slider.params.loopAdditionalSlides;
    const cloneCount = perView + additional;

    slider._loopedSlides = cloneCount;

    // Clone slides at the beginning and end
    const prependSlides = [];
    const appendSlides = [];

    for (let i = 0; i < cloneCount; i++) {
      const appendIdx = i % slides.length;
      const prependIdx = slides.length - 1 - (i % slides.length);

      const appendClone = slides[appendIdx].cloneNode(true);
      const prependClone = slides[prependIdx].cloneNode(true);

      addClass(appendClone, slider.params.slideCloneClass);
      addClass(prependClone, slider.params.slideCloneClass);

      appendClone.removeAttribute('id');
      prependClone.removeAttribute('id');

      appendClone.setAttribute('data-drift-slide-index', appendIdx);
      prependClone.setAttribute('data-drift-slide-index', prependIdx);

      appendSlides.push(appendClone);
      prependSlides.unshift(prependClone);
    }

    // Insert clones
    for (const clone of prependSlides) {
      slider.listEl.insertBefore(clone, slider.listEl.firstChild);
    }
    for (const clone of appendSlides) {
      slider.listEl.appendChild(clone);
    }

    // Re-query slides (now includes clones) — use :scope > for consistency
    slider.slides = Array.from(
      slider.listEl.querySelectorAll(`:scope > .${slider.params.slideClass}`)
    );
  }

  function destroyLoop() {
    if (!slider.params.loop) return;

    const clones = slider.listEl.querySelectorAll(
      `.${slider.params.slideCloneClass}`
    );
    clones.forEach((clone) => clone.remove());
  }

  function loopFix() {
    if (!slider.params.loop || !slider._loopedSlides) return;

    const loopedSlides = slider._loopedSlides;
    const totalOriginal = slider.slides.length - loopedSlides * 2;

    // Guard against infinite loop if totalOriginal <= 0
    if (totalOriginal <= 0) return;

    let newIdx = slider.activeIndex;

    // When loopedSlides > totalOriginal, a single jump may land in the
    // clone range again. Use a while loop to keep jumping until we reach
    // the valid original-slide range [loopedSlides, loopedSlides + totalOriginal).
    let needsJump = false;
    while (newIdx >= totalOriginal + loopedSlides) {
      newIdx = newIdx - totalOriginal;
      needsJump = true;
    }
    while (newIdx < loopedSlides) {
      newIdx = newIdx + totalOriginal;
      needsJump = true;
    }

    if (!needsJump) return;

    slider.setTransition(0);
    slider.activeIndex = newIdx;
    // Guard against snapGrid out-of-bounds
    if (newIdx >= slider.snapGrid.length) return;
    const translate = -slider.snapGrid[newIdx];
    slider.listEl.style.transform = `translate3d(${translate}px, 0, 0)`;
    slider.translate = translate;
  }

  function _getRealIndex(index) {
    if (!slider._loopedSlides) return index;
    const looped = slider._loopedSlides;
    const total = slider.slides.length - looped * 2;
    let realIndex = (index - looped) % total;
    if (realIndex < 0) realIndex += total;
    return realIndex;
  }

  slider.createLoop = createLoop;
  slider.destroyLoop = destroyLoop;
  slider.loopFix = loopFix;
  slider._getRealIndex = _getRealIndex;
}
