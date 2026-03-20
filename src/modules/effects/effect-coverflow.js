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

  // Cached once during init — whether actual 3D transforms are used.
  // When depth and rotate are both 0, we skip preserve-3d / perspective /
  // backface-visibility to avoid Mobile Safari GPU compositing bugs.
  let _use3D = false;

  function computeUse3D() {
    const p = slider.params.coverflowEffect;
    return p.modifier !== 0 && (p.depth !== 0 || p.rotate !== 0);
  }

  function setSlideTransforms() {
    const params = slider.params.coverflowEffect;
    const {
      depth, rotate, scale, stretch, modifier,
      opacity, activeOpacity, overlay, overlayColor,
      fillCenter, staggerY: staggerYParam,
    } = params;

    const slides = slider.slides;
    if (!slider.slideSize) return; // guard against zero division when container is hidden

    const use3D = _use3D;

    // Continuous half-view for smooth opacity gradients at any slidesPerView
    const halfView = Math.max(0, (slider.params.slidesPerView - 1) / 2);
    const visibleSides = params.visibleSides || 'both';

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      // How many slide-widths away from the centered active slide
      const normalizedOffset =
        (slider.slidesGrid[i] + slider.translate) / slider.slideSize;
      const absOffset = Math.abs(normalizedOffset);

      // 3D transforms — applied to ALL slides (no visibility toggling)
      const tz = -absOffset * depth * modifier;
      const ry = normalizedOffset * rotate * modifier;
      let s = Math.max(0, 1 - (1 - scale) * absOffset);
      let tx = normalizedOffset * stretch * modifier;

      // visibleSides: shift center slide toward the edge to reduce empty space
      if (visibleSides !== 'both') {
        const maxShift = (slider.containerSize - slider.slideSize) / 2;
        const shiftFactor = Math.max(0, 1 - absOffset);
        if (visibleSides === 'prev') {
          tx += shiftFactor * maxShift;
        } else if (visibleSides === 'next') {
          tx -= shiftFactor * maxShift;
        }
      }

      // staggerY: center slide shifts down, sides stay at original position
      const staggerY = staggerYParam || 0;
      const ty = staggerY * Math.max(0, 1 - absOffset);

      // fillCenter: enlarge the center slide to fill space freed by scaled-down sides
      if (fillCenter && absOffset < 0.5) {
        const centerScale = Math.min(
          1 + (1 - scale) * 2,
          slider.containerSize / slider.slideSize
        );
        s = centerScale;
      }

      // Mobile Safari GPU fix: hide slides far from center to reduce
      // compositing layer count. Only slides within rendering range are
      // painted; the rest are visibility:hidden (preserves layout, skips paint).
      // Use a generous margin (halfView + 2) so slides entering view during
      // drag are already visible.
      const renderRange = halfView + 2;
      const isInRange = absOffset < renderRange;

      if (!isInRange) {
        // Far-off slide: clear stale styles and hide
        slide.style.visibility = 'hidden';
        slide.style.willChange = '';
        slide.style.opacity = '0';
        slide.style.zIndex = '0';
        slide.style.pointerEvents = 'none';
        if (overlay && overlayEls[i]) {
          overlayEls[i].style.display = 'none';
        }
        continue;
      }

      slide.style.visibility = 'visible';
      slide.style.willChange = 'transform, opacity';

      // Always use translate3d to force GPU compositing layer creation.
      // translate3d(x, y, 0) promotes the element to its own GPU layer
      // WITHOUT needing preserve-3d on the parent — avoiding Mobile Safari's
      // compositor bug where slides inside overflow:hidden + transformed
      // ancestors fail to repaint.
      if (use3D) {
        slide.style.transform =
          `translate3d(${tx}px, ${ty}px, ${tz}px) rotateY(${ry}deg) scale(${s})`;
      } else {
        slide.style.transform =
          `translate3d(${tx}px, ${ty}px, 0) scale(${s})`;
      }

      // Opacity: within halfView → normal interpolation,
      //          beyond halfView → quickly fade to 0 by halfView+1
      let slideOpacity;
      if (absOffset <= halfView) {
        slideOpacity = activeOpacity - (activeOpacity - opacity) * (halfView > 0 ? absOffset / halfView : absOffset);
      } else {
        const edgeOpacity = opacity;
        slideOpacity = edgeOpacity * Math.max(0, 1 - (absOffset - halfView));
      }
      slideOpacity = Math.max(0, slideOpacity);

      // visibleSides: hide one side with smooth ease-out fade
      if (visibleSides === 'next' && normalizedOffset < 0) {
        const t = Math.max(0, 1 + normalizedOffset); // 1 at center, 0 at offset -1
        slideOpacity *= t * t; // ease-out curve for smoother fade
      } else if (visibleSides === 'prev' && normalizedOffset > 0) {
        const t = Math.max(0, 1 - normalizedOffset); // 1 at center, 0 at offset +1
        slideOpacity *= t * t;
      }

      slide.style.opacity = String(slideOpacity);

      // Interaction: only center slide is clickable
      slide.style.pointerEvents = absOffset < 0.5 ? 'auto' : 'none';

      // z-index: center slide on top
      slide.style.zIndex = String(Math.max(0, slides.length - Math.round(absOffset * 100)));

      // Overlay
      if (overlay && overlayEls[i]) {
        if (absOffset < 0.01) {
          // Center slide: hide overlay completely (not just opacity:0)
          // to prevent any rendering interference on mobile Safari
          overlayEls[i].style.display = 'none';
        } else {
          overlayEls[i].style.display = '';
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
    const transformOrigin = originMap[align] || 'center center';
    const use3D = _use3D;

    // Only enable 3D CSS when actual 3D transforms are used.
    // Mobile Safari has a compositing bug where preserve-3d +
    // backface-visibility:hidden causes slides to vanish during
    // touch interactions — skip when not needed.
    if (use3D) {
      slide.style.transformStyle = 'preserve-3d';
      slide.style.backfaceVisibility = 'hidden';
    }
    // will-change is managed dynamically per-slide in setSlideTransforms
    // to limit the number of GPU compositing layers on mobile.
    slide.style.transformOrigin = transformOrigin;
    slide.style.transitionProperty = 'transform, opacity';
    slide.style.transitionDuration = `${slider.params.speed}ms`;

    // Create overlay div if needed and not already present
    if (params.overlay && !overlayEls[index]) {
      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'drift-coverflow-overlay';
      overlayDiv.style.transitionProperty = 'opacity';
      overlayDiv.style.transitionDuration = `${slider.params.speed}ms`;
      slide.style.position = 'relative';
      slide.appendChild(overlayDiv);
      overlayEls[index] = overlayDiv;
    }
  }

  /**
   * Mobile Safari workaround: detect ancestor elements that create
   * problematic GPU compositing contexts. Two patterns cause slides
   * to intermittently vanish:
   *
   * 1. Single element with BOTH overflow:hidden AND a CSS transform.
   * 2. An overflow:hidden element nested inside a transformed ancestor
   *    (e.g. AOS adds transform on a wrapper, and a child has
   *    overflow:hidden — common in "peek" slider layouts).
   *
   * Common trigger: animation libraries (AOS, GSAP ScrollTrigger, etc.)
   * leave transform:translate3d(0,0,0) on elements after animation.
   *
   * Returns the offending element (for dev warning) or null.
   */
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

      // Pattern 1: same element has both
      if (hasOverflowHidden && hasTransform) {
        return el;
      }
      // Pattern 2: this ancestor has a transform, and a descendant
      // closer to the slider had overflow:hidden
      if (hasTransform && sawOverflowHidden) {
        return el;
      }
      el = el.parentElement;
    }
    return null;
  }

  /**
   * Force GPU compositing layers on direct children (images, divs) of
   * each slide. This prevents Mobile Safari from skipping repaint of
   * content inside dynamically-transformed slides.
   */
  function promoteSlideContent(slide) {
    const children = slide.children;
    for (let j = 0; j < children.length; j++) {
      const child = children[j];
      // Skip the overlay div we created
      if (child.classList.contains('drift-coverflow-overlay')) continue;

      if (_use3D) {
        // In 3D mode: backface-visibility promotes to GPU layer
        child.style.backfaceVisibility = 'hidden';
        child.style.webkitBackfaceVisibility = 'hidden';
      } else {
        // In 2D mode: will-change promotes to GPU layer without
        // triggering the Safari backface-visibility compositing bug.
        // This ensures slide content (images) gets its own compositing
        // layer and is repainted independently — critical when an
        // ancestor has overflow:hidden + transform (e.g. AOS).
        child.style.willChange = 'transform';
      }
    }
  }

  let _ancestorCheckRAF = null;

  function setupSlides() {
    const use3D = _use3D;

    // Only set perspective and preserve-3d when actual 3D transforms are used.
    // Skipping these avoids Mobile Safari GPU compositing bugs.
    if (use3D) {
      if (slider.trackEl) {
        slider.trackEl.style.perspective = '1200px';
      }
      slider.listEl.style.transformStyle = 'preserve-3d';
    }

    // Add container class
    slider.el.classList.add('drift-slider--coverflow');

    // Detect and warn about problematic ancestor (overflow:hidden + transform).
    // This is a deferred check — runs after the browser has applied styles
    // (including animation libraries like AOS).
    // Only in development (non-production) environments.
    if (typeof process === 'undefined' || !process.env || process.env.NODE_ENV !== 'production') {
      _ancestorCheckRAF = requestAnimationFrame(() => {
        _ancestorCheckRAF = null;
        if (slider.destroyed) return;
        const badAncestor = detectProblematicAncestor();
        if (badAncestor) {
          console.warn(
            'DriftSlider Coverflow: an ancestor has overflow:hidden combined ' +
            'with a CSS transform (on the same or a parent element). This causes ' +
            'Mobile Safari to skip repainting dynamically-transformed slides. ' +
            'Fix: remove the transform from the ancestor after animation completes ' +
            '(e.g. for AOS: add CSS `[data-aos].aos-animate { transform: none !important; }` ' +
            'scoped to this section). Offending element:',
            badAncestor
          );
        }
      });
    }

    // cropSides: clip sides horizontally; keep vertical visible for staggerY
    const cropSides = slider.params.coverflowEffect.cropSides;
    if (cropSides) {
      slider.el.style.overflowX = 'hidden';
      slider.el.style.overflowY = 'visible';
      if (slider.trackEl) {
        slider.trackEl.style.overflowX = 'hidden';
        slider.trackEl.style.overflowY = 'visible';
      }
    }

    // staggerY: expand container to accommodate vertical shift
    const staggerY = slider.params.coverflowEffect.staggerY || 0;
    if (staggerY > 0) {
      slider.el.style.marginBottom = staggerY + 'px';
      slider.el.style.overflowY = 'visible';
      if (slider.trackEl) {
        slider.trackEl.style.overflowY = 'visible';
      }
    } else if (staggerY < 0) {
      slider.el.style.marginTop = Math.abs(staggerY) + 'px';
      slider.el.style.overflowY = 'visible';
      if (slider.trackEl) {
        slider.trackEl.style.overflowY = 'visible';
      }
    }

    // Apply styles to ALL slides (including loop clones)
    for (let i = 0; i < slider.slides.length; i++) {
      applySlideStyles(slider.slides[i], i);
      // Force GPU layers on slide content to prevent Safari repaint issues
      promoteSlideContent(slider.slides[i]);
    }
  }

  // Reverse prepend clone order so that for centered coverflow,
  // the clone of the LAST original slide is adjacent to the first real slide.
  // Before: [clone6, clone5, clone4, S1, S2, ...] → left of S1 is clone4 (WRONG)
  // After:  [clone4, clone5, clone6, S1, S2, ...] → left of S1 is clone6 (CORRECT)
  function reorderLoopClones() {
    const looped = slider._loopedSlides;
    const prependClones = slider.slides.slice(0, looped);
    const firstReal = slider.slides[looped];

    // Remove prepend clones from DOM
    prependClones.forEach(clone => clone.remove());

    // Re-insert in reversed order before firstReal
    for (let i = prependClones.length - 1; i >= 0; i--) {
      slider.listEl.insertBefore(prependClones[i], firstReal);
    }

    // Re-query slides array
    slider.slides = Array.from(
      slider.listEl.querySelectorAll(`:scope > .${slider.params.slideClass}`)
    );
  }

  // Store original methods for cleanup on destroy
  let _coreSetTranslate = null;
  let _coreSetTransition = null;
  let _coreGetComputedTranslate = null;
  let _coreLoopFix = null;

  function init() {
    if (slider.params.effect !== 'coverflow') return;

    // Cache 3D detection result (params don't change after init)
    _use3D = computeUse3D();

    // Coverflow needs at least 1 slidesPerView
    if (slider.params.slidesPerView < 1) {
      slider.params.slidesPerView = 1;
    }

    // Fix loop clone order for centered coverflow view
    if (slider.params.loop && slider._loopedSlides) {
      reorderLoopClones();
    }

    // Save original methods before overriding
    _coreSetTranslate = slider.setTranslate;
    _coreSetTransition = slider.setTransition;
    _coreGetComputedTranslate = slider.getComputedTranslate;
    _coreLoopFix = slider.loopFix;

    setupSlides();

    // Override setTranslate — translate list WITH centering offset, then per-slide 3D
    slider.setTranslate = function (translate) {
      // Move the list: original translate + centering offset
      const centeringOffset = slider.containerSize / 2 - slider.slideSize / 2;
      const listX = translate + centeringOffset;
      // Always use translate3d for GPU layer promotion on Mobile Safari
      slider.listEl.style.transform = `translate3d(${listX}px, 0, 0)`;

      slider.updateProgress(translate);
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

    // Override getComputedTranslate — the core version reads the raw
    // listEl transform, but coverflow adds a centering offset.
    // Subtract it so callers get the logical translate value.
    slider.getComputedTranslate = function () {
      const raw = _coreGetComputedTranslate.call(slider);
      const centeringOffset = slider.containerSize / 2 - slider.slideSize / 2;
      return raw - centeringOffset;
    };

    // Override loopFix — the original directly sets listEl.style.transform,
    // bypassing our centering offset and setSlideTransforms.
    // Also handles loopedSlides > totalOriginal with a while loop.
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
          // Use our setTranslate which applies centering + slide transforms
          slider.setTranslate(translate);
        }
      };
    }

    // Re-apply translate with centering (init fires AFTER initial slideTo)
    slider.setTranslate(slider.translate);
  }

  function onUpdate() {
    if (slider.params.effect !== 'coverflow') return;
    slider.setTranslate(slider.translate);
  }

  function destroy() {
    // Cancel pending rAF if still queued
    if (_ancestorCheckRAF !== null) {
      cancelAnimationFrame(_ancestorCheckRAF);
      _ancestorCheckRAF = null;
    }

    // Restore original core methods
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

    for (let i = 0; i < slider.slides.length; i++) {
      const slide = slider.slides[i];
      slide.style.transform = '';
      slide.style.opacity = '';
      slide.style.visibility = '';
      slide.style.zIndex = '';
      slide.style.transformStyle = '';
      slide.style.backfaceVisibility = '';
      slide.style.willChange = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
      slide.style.transformOrigin = '';
      slide.style.pointerEvents = '';
      slide.style.position = '';

      // Clean up promoted slide content styles
      const children = slide.children;
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        if (child.classList.contains('drift-coverflow-overlay')) continue;
        child.style.backfaceVisibility = '';
        child.style.webkitBackfaceVisibility = '';
        child.style.willChange = '';
      }

      // Remove overlay divs
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
