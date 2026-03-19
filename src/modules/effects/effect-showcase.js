export default function EffectShowcase({ slider, extendParams, on }) {
  extendParams({
    showcaseEffect: {
      scale: 0.8,
      overlay: true,
      overlayColor: 'rgba(255, 255, 255, 0.2)',
    },
  });

  const overlayEls = [];

  function setSlideTransforms() {
    const params = slider.params.showcaseEffect;
    const { scale, overlay, overlayColor } = params;
    const slides = slider.slides;

    if (!slider.slideSize) return;

    const halfView = Math.max(0, (slider.params.slidesPerView - 1) / 2);
    // Gap compensation: scale from center creates slideSize*(1-scale)/2 gap per side
    const gapCompensation = slider.slideSize * (1 - scale) / 2;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      const normalizedOffset =
        (slider.slidesGrid[i] + slider.translate) / slider.slideSize;
      const absOffset = Math.abs(normalizedOffset);

      // Scale: active = 1, sides interpolate toward target scale
      const s = Math.max(0, 1 - (1 - scale) * absOffset);

      // Pull sides inward to close the gap created by scaling
      const tx = -normalizedOffset * gapCompensation;

      slide.style.transform = `translateX(${tx}px) scale(${s})`;

      // Interaction: only center slide is clickable
      slide.style.pointerEvents = absOffset < 0.5 ? 'auto' : 'none';

      // z-index: center slide on top
      slide.style.zIndex = String(
        Math.max(0, slides.length - Math.round(absOffset * 100))
      );

      // Overlay: visible on non-active slides
      if (overlay && overlayEls[i]) {
        if (absOffset < 0.01) {
          // Center slide: hide overlay completely (not just opacity:0)
          // to prevent rendering interference on Mobile Safari
          overlayEls[i].style.display = 'none';
        } else {
          overlayEls[i].style.display = '';
          const overlayOpacity =
            Math.min(absOffset / Math.max(halfView, 1), 1);
          overlayEls[i].style.background = overlayColor;
          overlayEls[i].style.opacity = String(overlayOpacity);
        }
      }
    }
  }

  function applySlideStyles(slide, index) {
    const params = slider.params.showcaseEffect;

    slide.style.transformOrigin = 'center center';
    slide.style.transitionProperty = 'transform, opacity';
    slide.style.transitionDuration = `${slider.params.speed}ms`;

    // Create overlay div if needed
    if (params.overlay && !overlayEls[index]) {
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'drift-showcase-overlay';
      overlayDiv.style.position = 'absolute';
      overlayDiv.style.inset = '0';
      overlayDiv.style.pointerEvents = 'none';
      overlayDiv.style.zIndex = '2';
      overlayDiv.style.transitionProperty = 'opacity';
      overlayDiv.style.transitionDuration = `${slider.params.speed}ms`;
      slide.style.position = 'relative';
      slide.appendChild(overlayDiv);
      overlayEls[index] = overlayDiv;
    }
  }

  function setupSlides() {
    // The list needs no 3D — showcase is flat
    slider.el.classList.add('drift-slider--showcase');

    for (let i = 0; i < slider.slides.length; i++) {
      applySlideStyles(slider.slides[i], i);
    }
  }

  // Reorder loop clones so the last original slide is adjacent to the first
  function reorderLoopClones() {
    const looped = slider._loopedSlides;
    const prependClones = slider.slides.slice(0, looped);
    const firstReal = slider.slides[looped];

    prependClones.forEach((clone) => clone.remove());

    for (let i = prependClones.length - 1; i >= 0; i--) {
      slider.listEl.insertBefore(prependClones[i], firstReal);
    }

    slider.slides = Array.from(
      slider.listEl.querySelectorAll(
        `:scope > .${slider.params.slideClass}`
      )
    );
  }

  // Store original methods for cleanup on destroy
  let _coreSetTranslate = null;
  let _coreSetTransition = null;
  let _coreGetComputedTranslate = null;
  let _coreLoopFix = null;

  function init() {
    if (slider.params.effect !== 'showcase') return;

    if (slider.params.slidesPerView < 1) {
      slider.params.slidesPerView = 1;
    }

    if (slider.params.loop && slider._loopedSlides) {
      reorderLoopClones();
    }

    // Save original methods before overriding
    _coreSetTranslate = slider.setTranslate;
    _coreSetTransition = slider.setTransition;
    _coreGetComputedTranslate = slider.getComputedTranslate;
    _coreLoopFix = slider.loopFix;

    setupSlides();

    // Override setTranslate — translate list with centering offset, then per-slide transforms
    slider.setTranslate = function (translate) {
      slider.translate = translate;

      slider.progress =
        slider.maxTranslate === slider.minTranslate
          ? 0
          : (translate - slider.maxTranslate) /
            (slider.minTranslate - slider.maxTranslate);

      slider.isBeginning = slider.activeIndex === 0;
      slider.isEnd = slider.activeIndex === slider.snapGrid.length - 1;

      // Centering offset
      const centeringOffset =
        slider.containerSize / 2 - slider.slideSize / 2;
      const listX = translate + centeringOffset;
      slider.listEl.style.transform = `translateX(${listX}px)`;

      slider.emit('setTranslate', slider, translate);
      slider.emit('progress', slider, slider.progress);

      setSlideTransforms();
    };

    // Override setTransition — apply to list + each slide + overlay
    slider.setTransition = function (duration) {
      slider.listEl.style.transitionDuration = `${duration}ms`;
      for (let i = 0; i < slider.slides.length; i++) {
        slider.slides[i].style.transitionDuration = `${duration}ms`;
        if (overlayEls[i]) {
          overlayEls[i].style.transitionDuration = `${duration}ms`;
        }
      }
      slider.emit('setTransition', slider, duration);
    };

    // Override getComputedTranslate — subtract centering offset
    // so callers get the logical translate value
    slider.getComputedTranslate = function () {
      const raw = _coreGetComputedTranslate.call(slider);
      const centeringOffset =
        slider.containerSize / 2 - slider.slideSize / 2;
      return raw - centeringOffset;
    };

    // Override loopFix for centered showcase
    if (slider.params.loop && slider._loopedSlides) {
      slider.loopFix = function () {
        if (!slider.params.loop || !slider._loopedSlides) return;

        const loopedSlides = slider._loopedSlides;
        const totalOriginal = slider.slides.length - loopedSlides * 2;

        let newIdx = slider.activeIndex;
        let needsJump = false;

        while (newIdx >= totalOriginal + loopedSlides) {
          newIdx = newIdx - totalOriginal;
          needsJump = true;
        }
        while (newIdx < loopedSlides) {
          newIdx = newIdx + totalOriginal;
          needsJump = true;
        }

        if (needsJump) {
          slider.setTransition(0);
          slider.activeIndex = newIdx;
          const translate = -slider.snapGrid[newIdx];
          slider.setTranslate(translate);
        }
      };
    }

    // Apply initial translate with centering
    slider.setTranslate(slider.translate);
  }

  function onUpdate() {
    if (slider.params.effect !== 'showcase') return;
    slider.setTranslate(slider.translate);
  }

  function destroy() {
    // Restore original core methods
    if (_coreSetTranslate) slider.setTranslate = _coreSetTranslate;
    if (_coreSetTransition) slider.setTransition = _coreSetTransition;
    if (_coreGetComputedTranslate) slider.getComputedTranslate = _coreGetComputedTranslate;
    if (_coreLoopFix) slider.loopFix = _coreLoopFix;

    slider.el.classList.remove('drift-slider--showcase');

    for (let i = 0; i < slider.slides.length; i++) {
      const slide = slider.slides[i];
      slide.style.transform = '';
      slide.style.zIndex = '';
      slide.style.transformOrigin = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
      slide.style.pointerEvents = '';
      slide.style.position = '';

      if (overlayEls[i] && overlayEls[i].parentNode) {
        overlayEls[i].parentNode.removeChild(overlayEls[i]);
      }
    }
    overlayEls.length = 0;
  }

  on('init', init);
  on('update', onUpdate);
  on('resize', onUpdate);
  on('destroy', destroy);
}
