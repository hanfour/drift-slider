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

  function setSlideTransforms() {
    const params = slider.params.coverflowEffect;
    const {
      depth, rotate, scale, stretch, modifier,
      opacity, activeOpacity, overlay, overlayColor,
      fillCenter, staggerY: staggerYParam,
    } = params;

    const slides = slider.slides;
    if (!slider.slideSize) return; // guard against zero division when container is hidden

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

      slide.style.transform =
        `translateX(${tx}px) translateY(${ty}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${s})`;

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
        const overlayOpacity = absOffset < 0.01 ? 0 : Math.min(absOffset / Math.max(halfView, 1), 1);
        overlayEls[i].style.background = overlayColor;
        overlayEls[i].style.opacity = String(overlayOpacity);
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

    slide.style.transformStyle = 'preserve-3d';
    slide.style.backfaceVisibility = 'hidden';
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

  function setupSlides() {
    // Perspective on the track (stationary parent) so vanishing point stays fixed
    if (slider.trackEl) {
      slider.trackEl.style.perspective = '1200px';
    }

    // The list needs preserve-3d so children's 3D transforms aren't flattened
    slider.listEl.style.transformStyle = 'preserve-3d';

    // Add container class
    slider.el.classList.add('drift-slider--coverflow');

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

  function init() {
    if (slider.params.effect !== 'coverflow') return;

    // Coverflow needs at least 1 slidesPerView
    if (slider.params.slidesPerView < 1) {
      slider.params.slidesPerView = 1;
    }

    // Fix loop clone order for centered coverflow view
    if (slider.params.loop && slider._loopedSlides) {
      reorderLoopClones();
    }

    setupSlides();

    // Override setTranslate — translate list WITH centering offset, then per-slide 3D
    slider.setTranslate = function (translate) {
      slider.translate = translate;

      slider.progress = slider.maxTranslate === slider.minTranslate
        ? 0
        : (translate - slider.maxTranslate) /
          (slider.minTranslate - slider.maxTranslate);

      slider.isBeginning = slider.activeIndex === 0;
      slider.isEnd = slider.activeIndex === slider.snapGrid.length - 1;

      // Move the list: original translate + centering offset
      const centeringOffset = slider.containerSize / 2 - slider.slideSize / 2;
      const listX = translate + centeringOffset;
      slider.listEl.style.transform = `translate3d(${listX}px, 0, 0)`;

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

    // Override loopFix — the original directly sets listEl.style.transform,
    // bypassing our centering offset and setSlideTransforms.
    if (slider.params.loop && slider._loopedSlides) {
      slider.loopFix = function () {
        if (!slider.params.loop || !slider._loopedSlides) return;

        const loopedSlides = slider._loopedSlides;
        const totalOriginal = slider.slides.length - loopedSlides * 2;

        let needsJump = false;
        let newIdx;

        if (slider.activeIndex >= totalOriginal + loopedSlides) {
          newIdx = loopedSlides + (slider.activeIndex - totalOriginal - loopedSlides);
          needsJump = true;
        } else if (slider.activeIndex < loopedSlides) {
          newIdx = totalOriginal + slider.activeIndex;
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
      slide.style.zIndex = '';
      slide.style.transformStyle = '';
      slide.style.backfaceVisibility = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
      slide.style.transformOrigin = '';
      slide.style.pointerEvents = '';
      slide.style.position = '';

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
