export default function EffectCoverflow({ slider, extendParams, on }) {
  extendParams({
    coverflowEffect: {
      depth: 200,
      rotate: 30,
      scale: 0.85,
      stretch: 0,
      modifier: 1,
      overlay: true,
      overlayColor: 'rgba(0,0,0,0.4)',
      opacity: 0.6,
      activeOpacity: 1,
      align: 'center',
      fillCenter: false,
      cropSides: false,
      staggerY: 0,
      visibleSides: 'both',
    },
  });

  const overlayEls = [];
  let _use3D = false;

  function computeUse3D() {
    const p = slider.params.coverflowEffect;
    return p.modifier !== 0 && (p.depth !== 0 || p.rotate !== 0);
  }

  // ────────────────────────────────────────────────────
  // Pure rAF animation — NO CSS transitions anywhere.
  // Mobile Safari's compositor has bugs with CSS transitions
  // on elements inside overflow:hidden + transformed ancestors.
  // Driving everything via rAF eliminates the compositor entirely.
  // ────────────────────────────────────────────────────
  let _rafId = null;
  let _rafTranslateStart = 0;
  let _rafTranslateEnd = 0;
  let _rafStartTime = 0;
  let _rafDuration = 0;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function applyVisualState(translate) {
    const centeringOffset = slider.containerSize / 2 - slider.slideSize / 2;
    const listX = translate + centeringOffset;
    slider.listEl.style.transform = _use3D
      ? `translate3d(${listX}px, 0, 0)`
      : `translateX(${listX}px)`;
    const saved = slider.translate;
    slider.translate = translate;
    setSlideTransforms();
    slider.translate = saved;
  }

  function rafTick(now) {
    _rafId = null;
    if (slider.destroyed) return;

    const elapsed = now - _rafStartTime;
    const progress = _rafDuration > 0 ? Math.min(elapsed / _rafDuration, 1) : 1;
    const eased = easeOutCubic(progress);
    const current = _rafTranslateStart + (_rafTranslateEnd - _rafTranslateStart) * eased;

    applyVisualState(current);

    if (progress < 1) {
      _rafId = requestAnimationFrame(rafTick);
    } else {
      // Animation complete — apply final state precisely
      applyVisualState(_rafTranslateEnd);
      // Defer transitionEnd to next frame so loopFix runs in a separate
      // paint cycle. This prevents the Safari bug where visibility:hidden→visible
      // toggling in the same frame causes the GPU compositor to skip repainting.
      requestAnimationFrame(() => {
        if (!slider.destroyed && slider.animating) {
          slider.transitionEnd(true);
        }
      });
    }
  }

  function startRafAnimation(from, to, duration) {
    stopRafAnimation();
    if (duration <= 0) {
      applyVisualState(to);
      return;
    }
    _rafTranslateStart = from;
    _rafTranslateEnd = to;
    _rafStartTime = performance.now();
    _rafDuration = duration;
    _rafId = requestAnimationFrame(rafTick);
  }

  function stopRafAnimation() {
    if (_rafId !== null) {
      cancelAnimationFrame(_rafId);
      _rafId = null;
    }
  }

  // ────────────────────────────────────────────────────
  // Slide transform calculation
  // ────────────────────────────────────────────────────
  function setSlideTransforms() {
    const params = slider.params.coverflowEffect;
    const {
      depth, rotate, scale, stretch, modifier,
      opacity, activeOpacity, overlay, overlayColor,
      fillCenter, staggerY: staggerYParam,
    } = params;

    const slides = slider.slides;
    if (!slider.slideSize) return;

    const use3D = _use3D;
    const halfView = Math.max(0, (slider.params.slidesPerView - 1) / 2);
    const visibleSides = params.visibleSides || 'both';

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      const normalizedOffset =
        (slider.slidesGrid[i] + slider.translate) / slider.slideSize;
      const absOffset = Math.abs(normalizedOffset);

      const tz = -absOffset * depth * modifier;
      const ry = normalizedOffset * rotate * modifier;
      let s = Math.max(0, 1 - (1 - scale) * absOffset);
      let tx = normalizedOffset * stretch * modifier;

      if (visibleSides !== 'both') {
        const maxShift = (slider.containerSize - slider.slideSize) / 2;
        const shiftFactor = Math.max(0, 1 - absOffset);
        if (visibleSides === 'prev') {
          tx += shiftFactor * maxShift;
        } else if (visibleSides === 'next') {
          tx -= shiftFactor * maxShift;
        }
      }

      const staggerY = staggerYParam || 0;
      const ty = staggerY * Math.max(0, 1 - absOffset);

      if (fillCenter && absOffset < 0.5) {
        const centerScale = Math.min(
          1 + (1 - scale) * 2,
          slider.containerSize / slider.slideSize
        );
        s = centerScale;
      }

      // Hide far-off slides — use ONLY opacity, NOT visibility.
      // Mobile Safari has a bug where toggling visibility:hidden→visible
      // in the same paint frame (which happens during loopFix) causes
      // the GPU compositor to skip repainting the element entirely.
      // Using opacity:0 avoids this while still hiding the slide visually.
      const renderRange = halfView + 2;
      if (absOffset >= renderRange) {
        slide.style.opacity = '0';
        slide.style.zIndex = '0';
        slide.style.pointerEvents = 'none';
        slide.style.transform = 'translateX(0) scale(0.01)';
        if (overlay && overlayEls[i]) {
          overlayEls[i].style.opacity = '0';
        }
        continue;
      }

      if (use3D) {
        slide.style.transform =
          `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${s})`;
      } else {
        slide.style.transform =
          `translateX(${tx}px) translateY(${ty}px) scale(${s})`;
      }

      let slideOpacity;
      if (absOffset <= halfView) {
        slideOpacity = activeOpacity - (activeOpacity - opacity) * (halfView > 0 ? absOffset / halfView : absOffset);
      } else {
        slideOpacity = opacity * Math.max(0, 1 - (absOffset - halfView));
      }
      slideOpacity = Math.max(0, slideOpacity);

      if (visibleSides === 'next' && normalizedOffset < 0) {
        const t = Math.max(0, 1 + normalizedOffset);
        slideOpacity *= t * t;
      } else if (visibleSides === 'prev' && normalizedOffset > 0) {
        const t = Math.max(0, 1 - normalizedOffset);
        slideOpacity *= t * t;
      }

      slide.style.opacity = String(slideOpacity);
      slide.style.pointerEvents = absOffset < 0.5 ? 'auto' : 'none';
      slide.style.zIndex = String(Math.max(0, slides.length - Math.round(absOffset * 100)));

      // Overlay
      if (overlay && overlayEls[i]) {
        if (absOffset < 0.01) {
          overlayEls[i].style.opacity = '0';
        } else {
          const overlayOpacity = Math.min(absOffset / Math.max(halfView, 1), 1);
          overlayEls[i].style.background = overlayColor;
          overlayEls[i].style.opacity = String(overlayOpacity);
        }
      }
    }
  }

  function applySlideStyles(slide, index) {
    const params = slider.params.coverflowEffect;
    const align = params.align || 'center';
    const originMap = {
      center: 'center center',
      top: 'center top',
      bottom: 'center bottom',
    };

    if (_use3D) {
      slide.style.transformStyle = 'preserve-3d';
      slide.style.backfaceVisibility = 'hidden';
    }

    slide.style.transformOrigin = originMap[align] || 'center center';
    // No CSS transitions on slides — all driven by rAF
    slide.style.transitionProperty = 'none';

    if (params.overlay && !overlayEls[index]) {
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'drift-coverflow-overlay';
      overlayDiv.style.transitionProperty = 'none';
      overlayDiv.style.pointerEvents = 'none';
      slide.style.position = 'relative';
      slide.appendChild(overlayDiv);
      overlayEls[index] = overlayDiv;
    }
  }

  function detectProblematicAncestor() {
    let el = slider.el.parentElement;
    let sawOverflowHidden = false;
    while (el && el !== document.body) {
      const style = window.getComputedStyle(el);
      const hasOverflowHidden =
        style.overflow === 'hidden' ||
        style.overflowX === 'hidden' ||
        style.overflowY === 'hidden';
      const hasTransform =
        style.transform !== 'none' && style.transform !== '';
      if (hasOverflowHidden) sawOverflowHidden = true;
      if (hasOverflowHidden && hasTransform) return el;
      if (hasTransform && sawOverflowHidden) return el;
      el = el.parentElement;
    }
    return null;
  }

  let _ancestorCheckRAF = null;

  function setupSlides() {
    if (_use3D) {
      if (slider.trackEl) slider.trackEl.style.perspective = '1200px';
      slider.listEl.style.transformStyle = 'preserve-3d';
    }

    slider.el.classList.add('drift-slider--coverflow');

    // No CSS transition on the list — coverflow drives it via rAF
    slider.listEl.style.transitionProperty = 'none';

    // Remove overflow:hidden from slider and track for coverflow mode.
    const cropSides = slider.params.coverflowEffect.cropSides;
    if (cropSides) {
      slider.el.style.overflowX = 'hidden';
      slider.el.style.overflowY = 'visible';
      if (slider.trackEl) {
        slider.trackEl.style.overflowX = 'hidden';
        slider.trackEl.style.overflowY = 'visible';
      }
    } else {
      slider.el.style.overflow = 'visible';
      if (slider.trackEl) {
        slider.trackEl.style.overflow = 'visible';
      }
    }

    const staggerY = slider.params.coverflowEffect.staggerY || 0;
    if (staggerY > 0) {
      slider.el.style.marginBottom = staggerY + 'px';
    } else if (staggerY < 0) {
      slider.el.style.marginTop = Math.abs(staggerY) + 'px';
    }

    if (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production') {
      _ancestorCheckRAF = requestAnimationFrame(() => {
        _ancestorCheckRAF = null;
        if (slider.destroyed) return;
        const badAncestor = detectProblematicAncestor();
        if (badAncestor) {
          console.warn(
            'DriftSlider Coverflow: an ancestor has overflow:hidden combined ' +
            'with a CSS transform. This may cause rendering issues on Mobile Safari. ' +
            'Fix: remove the transform after animation (e.g. for AOS: ' +
            '`[data-aos].aos-animate { transform: none !important; }`). Element:',
            badAncestor
          );
        }
      });
    }

    for (let i = 0; i < slider.slides.length; i++) {
      applySlideStyles(slider.slides[i], i);
    }
  }

  function reorderLoopClones() {
    const looped = slider._loopedSlides;
    const prependClones = slider.slides.slice(0, looped);
    const firstReal = slider.slides[looped];
    prependClones.forEach(clone => clone.remove());
    for (let i = prependClones.length - 1; i >= 0; i--) {
      slider.listEl.insertBefore(prependClones[i], firstReal);
    }
    slider.slides = Array.from(
      slider.listEl.querySelectorAll(`:scope > .${slider.params.slideClass}`)
    );
  }

  let _coreSetTranslate = null;
  let _coreSetTransition = null;
  let _coreGetComputedTranslate = null;
  let _coreLoopFix = null;
  let _lastTransitionSpeed = 0;
  let _prevTranslate = 0;

  function init() {
    if (slider.params.effect !== 'coverflow') return;

    _use3D = computeUse3D();

    if (slider.params.slidesPerView < 1) {
      slider.params.slidesPerView = 1;
    }

    if (slider.params.loop && slider._loopedSlides) {
      reorderLoopClones();
    }

    _coreSetTranslate = slider.setTranslate;
    _coreSetTransition = slider.setTransition;
    _coreGetComputedTranslate = slider.getComputedTranslate;
    _coreLoopFix = slider.loopFix;

    setupSlides();

    // Override setTranslate
    slider.setTranslate = function (translate) {
      _prevTranslate = slider.translate;
      slider.updateProgress(translate);

      if (_lastTransitionSpeed <= 0 || !slider.animating) {
        applyVisualState(translate);
      }
    };

    // Override setTransition — store speed for rAF, no CSS transitions
    slider.setTransition = function (duration) {
      _lastTransitionSpeed = duration;
      slider.emit('setTransition', slider, duration);
    };

    // Override getComputedTranslate — subtract centering offset
    slider.getComputedTranslate = function () {
      const raw = _coreGetComputedTranslate.call(slider);
      const centeringOffset = slider.containerSize / 2 - slider.slideSize / 2;
      return raw - centeringOffset;
    };

    // Start rAF animation when transition begins
    slider.on('slideChangeTransitionStart', function () {
      startRafAnimation(_prevTranslate, slider.translate, _lastTransitionSpeed);
    });

    // Stop any lingering rAF on transition end (rAF already applied final state)
    slider.on('slideChangeTransitionEnd', function () {
      stopRafAnimation();
    });

    // Override loopFix
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
          _lastTransitionSpeed = 0;
          slider.activeIndex = newIdx;
          // Guard against snapGrid out-of-bounds
          if (newIdx >= slider.snapGrid.length) return;
          const translate = -slider.snapGrid[newIdx];
          slider.setTranslate(translate);
        }
      };
    }

    // Initial render
    _lastTransitionSpeed = 0;
    slider.setTranslate(slider.translate);
  }

  function onUpdate() {
    if (slider.params.effect !== 'coverflow') return;
    _lastTransitionSpeed = 0;
    slider.setTranslate(slider.translate);
  }

  function destroy() {
    stopRafAnimation();

    if (_ancestorCheckRAF !== null) {
      cancelAnimationFrame(_ancestorCheckRAF);
      _ancestorCheckRAF = null;
    }

    if (_coreSetTranslate) slider.setTranslate = _coreSetTranslate;
    if (_coreSetTransition) slider.setTransition = _coreSetTransition;
    if (_coreGetComputedTranslate) slider.getComputedTranslate = _coreGetComputedTranslate;
    if (_coreLoopFix) slider.loopFix = _coreLoopFix;

    slider.el.classList.remove('drift-slider--coverflow');
    slider.el.style.overflow = '';
    slider.el.style.overflowX = '';
    slider.el.style.overflowY = '';
    slider.el.style.marginTop = '';
    slider.el.style.marginBottom = '';

    if (slider.trackEl) {
      slider.trackEl.style.perspective = '';
      slider.trackEl.style.overflow = '';
      slider.trackEl.style.overflowX = '';
      slider.trackEl.style.overflowY = '';
    }
    slider.listEl.style.transformStyle = '';
    slider.listEl.style.transitionProperty = '';

    for (let i = 0; i < slider.slides.length; i++) {
      const slide = slider.slides[i];
      slide.style.transform = '';
      slide.style.opacity = '';
      slide.style.zIndex = '';
      slide.style.transformStyle = '';
      slide.style.backfaceVisibility = '';
      slide.style.willChange = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
      slide.style.transformOrigin = '';
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
