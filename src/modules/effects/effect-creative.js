export default function EffectCreative({ slider, extendParams, on }) {
  extendParams({
    creativeEffect: {
      prev: {},
      next: {},
      active: {},
      perspective: false,
    },
  });

  /**
   * Resolve a single translate value. Strings ending with '%' are resolved
   * relative to slideSize; everything else is cast to a number.
   */
  function resolveValue(val, slideSize) {
    if (typeof val === 'string' && val.endsWith('%')) {
      return (parseFloat(val) / 100) * slideSize;
    }
    return Number(val) || 0;
  }

  function setSlideTransforms() {
    const params = slider.params.creativeEffect;
    const { prev: prevCfg, next: nextCfg, active: activeCfg = {} } = params;
    const slides = slider.slides;
    const slideSize = slider.slideSize;

    if (!slideSize) return;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      const normalizedOffset =
        (slider.slidesGrid[i] + slider.translate) / slideSize;
      const absOffset = Math.abs(normalizedOffset);

      // Pick config: prev side (offset < 0), next side (offset > 0)
      const cfg = normalizedOffset < 0 ? prevCfg : nextCfg;

      // Active (center) base values
      const activeTranslate = activeCfg.translate || [0, 0, 0];
      const activeRotate = activeCfg.rotate || [0, 0, 0];
      const activeScale = activeCfg.scale ?? 1;
      const activeOpacity = activeCfg.opacity ?? 1;

      // Translate: interpolate from active toward cfg
      const translate = cfg.translate || [0, 0, 0];
      const atx = resolveValue(activeTranslate[0], slideSize);
      const aty = resolveValue(activeTranslate[1], slideSize);
      const atz = resolveValue(activeTranslate[2], slideSize);
      const tx = atx + (resolveValue(translate[0], slideSize) - atx) * absOffset;
      const ty = aty + (resolveValue(translate[1], slideSize) - aty) * absOffset;
      const tz = atz + (resolveValue(translate[2], slideSize) - atz) * absOffset;

      // Rotate: interpolate from active toward cfg
      const rotate = cfg.rotate || [0, 0, 0];
      const arx = Number(activeRotate[0]) || 0;
      const ary = Number(activeRotate[1]) || 0;
      const arz = Number(activeRotate[2]) || 0;
      const rx = arx + ((Number(rotate[0]) || 0) - arx) * absOffset;
      const ry = ary + ((Number(rotate[1]) || 0) - ary) * absOffset;
      const rz = arz + ((Number(rotate[2]) || 0) - arz) * absOffset;

      // Scale: interpolate from active toward cfg
      const targetScale = cfg.scale ?? 1;
      const s = activeScale + (targetScale - activeScale) * absOffset;

      // Opacity: interpolate from active toward cfg
      const targetOpacity = cfg.opacity ?? 1;
      const opacity = activeOpacity + (targetOpacity - activeOpacity) * absOffset;

      slide.style.transform =
        `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) ` +
        `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg) scale(${s})`;

      slide.style.opacity = String(opacity);

      // Transform origin: use applicable config's origin, falling back to active, then default
      const applicableOrigin = cfg.origin || activeCfg.origin || 'center center';
      slide.style.transformOrigin = applicableOrigin;

      // z-index: center slide on top
      slide.style.zIndex = String(
        Math.max(0, slides.length - Math.round(absOffset * 100))
      );

      // Interaction: only center slide is clickable
      slide.style.pointerEvents = absOffset < 0.5 ? 'auto' : 'none';
    }
  }

  function setupSlides() {
    slider.el.classList.add('drift-slider--creative');

    const params = slider.params.creativeEffect;
    if (params.perspective && slider.trackEl) {
      slider.trackEl.style.perspective = '1200px';
    }

    for (let i = 0; i < slider.slides.length; i++) {
      const slide = slider.slides[i];
      slide.style.transformOrigin = 'center center';
      slide.style.transitionProperty = 'transform, opacity';
      slide.style.transitionDuration = `${slider.params.speed}ms`;
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
    if (slider.params.effect !== 'creative') return;

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
      const centeringOffset =
        slider.containerSize / 2 - slider.slideSize / 2;
      const listX = translate + centeringOffset;
      slider.listEl.style.transform = `translateX(${listX}px)`;

      slider.updateProgress(translate);
      setSlideTransforms();
    };

    // Override setTransition — apply to list + each slide
    slider.setTransition = function (duration) {
      slider.listEl.style.transitionDuration = `${duration}ms`;
      for (let i = 0; i < slider.slides.length; i++) {
        slider.slides[i].style.transitionDuration = `${duration}ms`;
      }
      slider.emit('setTransition', slider, duration);
    };

    // Override getComputedTranslate — subtract centering offset
    slider.getComputedTranslate = function () {
      const raw = _coreGetComputedTranslate.call(slider);
      const centeringOffset =
        slider.containerSize / 2 - slider.slideSize / 2;
      return raw - centeringOffset;
    };

    // Override loopFix for centered creative
    if (slider.params.loop && slider._loopedSlides) {
      slider.loopFix = function () {
        if (!slider.params.loop || !slider._loopedSlides) return;

        const loopedSlides = slider._loopedSlides;
        const totalOriginal = slider.slides.length - loopedSlides * 2;

        // Guard against infinite loop if totalOriginal <= 0
        if (totalOriginal <= 0) return;

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
          // Guard against snapGrid out-of-bounds
          if (newIdx >= slider.snapGrid.length) return;
          const translate = -slider.snapGrid[newIdx];
          slider.setTranslate(translate);
        }
      };
    }

    // Apply initial translate with centering
    slider.setTranslate(slider.translate);
  }

  function onUpdate() {
    if (slider.params.effect !== 'creative') return;
    slider.setTranslate(slider.translate);
  }

  function destroy() {
    // Restore original core methods
    if (_coreSetTranslate) slider.setTranslate = _coreSetTranslate;
    if (_coreSetTransition) slider.setTransition = _coreSetTransition;
    if (_coreGetComputedTranslate) slider.getComputedTranslate = _coreGetComputedTranslate;
    if (_coreLoopFix) slider.loopFix = _coreLoopFix;

    slider.el.classList.remove('drift-slider--creative');

    if (slider.trackEl) {
      slider.trackEl.style.perspective = '';
    }

    for (let i = 0; i < slider.slides.length; i++) {
      const slide = slider.slides[i];
      slide.style.transform = '';
      slide.style.opacity = '';
      slide.style.zIndex = '';
      slide.style.transformOrigin = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
      slide.style.pointerEvents = '';
    }
  }

  on('init', init);
  on('update', onUpdate);
  on('resize', onUpdate);
  on('destroy', destroy);
}
