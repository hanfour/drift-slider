export default function EffectCards({ slider, extendParams, on }) {
  const ALL_DIRS = ['tl-br', 'bl-tr', 'tr-bl', 'br-tl'];
  const DIR_MAP = {
    'tl-br': { x: 1, y: 1 },
    'bl-tr': { x: 1, y: -1 },
    'tr-bl': { x: -1, y: 1 },
    'br-tl': { x: -1, y: -1 },
  };

  let _autoCycleIndex = 0;
  let _flipTimeout = null;
  const overlayEls = [];

  extendParams({
    cardsEffect: {
      mode: 'stack',
      direction: 'tl-br',
      offsetX: 30,
      offsetY: 30,
      scale: 0.92,
      opacity: 0.85,
      diagonalMultiplier: 2.5,
      flipAxis: 'Y',
      overlay: true,
      overlayColor: 'rgba(0,0,0,0.15)',
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.25)',
      shadowBlur: 20,
    },
  });

  function getDirection() {
    const params = slider.params.cardsEffect;
    if (params.direction === 'auto') {
      return ALL_DIRS[_autoCycleIndex % 4];
    }
    return params.direction;
  }

  function getPeekIndex() {
    const total = slider.slides.length;
    const activeIdx = slider.activeIndex;
    if (slider.params.loop) {
      return (activeIdx + 1) % total;
    }
    return Math.min(activeIdx + 1, total - 1);
  }

  function setupSlides() {
    const slides = slider.slides;
    const params = slider.params.cardsEffect;
    const mode = params.mode;

    // Measure height before absolute positioning
    const firstSlide = slides[0];
    const slideHeight = firstSlide ? firstSlide.offsetHeight : 0;

    slider.listEl.style.position = 'relative';
    slider.listEl.style.height = `${slideHeight}px`;

    // Add container classes
    slider.el.classList.add('drift-slider--cards');
    if (mode === 'diagonal') {
      slider.el.classList.add('drift-slider--cards-diagonal');
    } else if (mode === 'flip') {
      slider.el.classList.add('drift-slider--cards-flip');
    }

    // Flip mode: perspective on track, preserve-3d on slides
    if (mode === 'flip' && slider.trackEl) {
      slider.trackEl.style.perspective = '1200px';
    }

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.style.position = 'absolute';
      slide.style.top = '0';
      slide.style.left = '0';
      slide.style.width = '100%';
      slide.style.height = '100%';
      slide.style.transitionProperty = 'transform, opacity, visibility, box-shadow';
      slide.style.transitionDuration = `${slider.params.speed}ms`;

      if (mode === 'flip') {
        slide.style.transformStyle = 'preserve-3d';
        slide.style.backfaceVisibility = 'hidden';
      }

      // Create overlay div if needed
      if (params.overlay) {
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'drift-cards-overlay';
        overlayDiv.style.transitionProperty = 'opacity';
        overlayDiv.style.transitionDuration = `${slider.params.speed}ms`;
        slide.style.position = 'relative';
        // Re-apply absolute after setting relative for overlay context
        slide.style.position = 'absolute';
        slide.appendChild(overlayDiv);
        overlayEls[i] = overlayDiv;
      }
    }
  }

  function setSlideTransforms() {
    const slides = slider.slides;
    const params = slider.params.cardsEffect;
    const activeIdx = slider.activeIndex;
    const peekIdx = getPeekIndex();
    const dir = getDirection();
    const dirMul = DIR_MAP[dir] || DIR_MAP['tl-br'];

    const multiplier = params.mode === 'diagonal' ? params.diagonalMultiplier : 1;
    const tx = params.offsetX * dirMul.x * multiplier;
    const ty = params.offsetY * dirMul.y * multiplier;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      if (i === activeIdx) {
        // Active slide: front, full size
        slide.style.transform = 'translate3d(0,0,0) scale(1)';
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.zIndex = '2';
        slide.style.pointerEvents = 'auto';

        if (params.shadow) {
          slide.style.boxShadow =
            `0 ${params.shadowBlur / 2}px ${params.shadowBlur}px ${params.shadowColor}`;
        } else {
          slide.style.boxShadow = 'none';
        }

        // Active overlay: hidden
        if (overlayEls[i]) {
          overlayEls[i].style.background = params.overlayColor;
          overlayEls[i].style.opacity = '0';
        }
      } else if (i === peekIdx) {
        // Peek slide: behind, offset
        slide.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${params.scale})`;
        slide.style.opacity = String(params.opacity);
        slide.style.visibility = 'visible';
        slide.style.zIndex = '1';
        slide.style.pointerEvents = 'none';
        slide.style.boxShadow = 'none';

        // Peek overlay
        if (overlayEls[i]) {
          overlayEls[i].style.background = params.overlayColor;
          overlayEls[i].style.opacity = params.overlay ? '1' : '0';
        }
      } else {
        // Hidden slides
        slide.style.transform = 'translate3d(0,0,0) scale(1)';
        slide.style.opacity = '0';
        slide.style.visibility = 'hidden';
        slide.style.zIndex = '0';
        slide.style.pointerEvents = 'none';
        slide.style.boxShadow = 'none';

        if (overlayEls[i]) {
          overlayEls[i].style.opacity = '0';
        }
      }
    }
  }

  function applyFlipTransition(prevIdx, nextIdx) {
    const slides = slider.slides;
    const params = slider.params.cardsEffect;
    const axis = params.flipAxis === 'X' ? 'X' : 'Y';
    const halfDur = slider.params.speed / 2;

    // Clear any pending flip timeout
    if (_flipTimeout) {
      clearTimeout(_flipTimeout);
      _flipTimeout = null;
    }

    // Hide all slides except the outgoing
    for (let i = 0; i < slides.length; i++) {
      if (i === prevIdx) {
        slides[i].style.visibility = 'visible';
        slides[i].style.opacity = '1';
        slides[i].style.zIndex = '2';
      } else if (i === nextIdx) {
        // Prepare incoming slide at -90deg, hidden
        slides[i].style.visibility = 'visible';
        slides[i].style.opacity = '1';
        slides[i].style.zIndex = '1';
        slides[i].style.transitionDuration = '0ms';
        slides[i].style.transform = `rotate${axis}(90deg)`;
      } else {
        slides[i].style.visibility = 'hidden';
        slides[i].style.opacity = '0';
        slides[i].style.zIndex = '0';
      }
      slides[i].style.pointerEvents = 'none';
    }

    // Phase 1: outgoing rotates to -90deg
    slides[prevIdx].style.transitionDuration = `${halfDur}ms`;
    slides[prevIdx].style.transform = `rotate${axis}(-90deg)`;

    // Phase 2: incoming rotates from 90deg to 0deg
    _flipTimeout = setTimeout(() => {
      slides[prevIdx].style.visibility = 'hidden';
      slides[prevIdx].style.opacity = '0';
      slides[prevIdx].style.zIndex = '0';

      slides[nextIdx].style.transitionDuration = `${halfDur}ms`;
      slides[nextIdx].style.transform = `rotate${axis}(0deg)`;
      slides[nextIdx].style.zIndex = '2';
      slides[nextIdx].style.pointerEvents = 'auto';

      _flipTimeout = null;
    }, halfDur);
  }

  let _prevActiveIndex = 0;

  function init() {
    if (slider.params.effect !== 'cards') return;

    // Force slidesPerView = 1
    slider.params.slidesPerView = 1;

    _prevActiveIndex = slider.activeIndex;

    setupSlides();

    // Override setTranslate
    slider.setTranslate = function (translate) {
      slider.translate = translate;

      slider.progress = slider.maxTranslate === slider.minTranslate
        ? 0
        : (translate - slider.maxTranslate) /
          (slider.minTranslate - slider.maxTranslate);

      slider.isBeginning = translate >= slider.maxTranslate;
      slider.isEnd = translate <= slider.minTranslate;

      slider.emit('setTranslate', slider, translate);
      slider.emit('progress', slider, slider.progress);

      const params = slider.params.cardsEffect;
      if (params.mode === 'flip') {
        const newIdx = slider.activeIndex;
        if (newIdx !== _prevActiveIndex) {
          applyFlipTransition(_prevActiveIndex, newIdx);
          _prevActiveIndex = newIdx;
        }
      } else {
        setSlideTransforms();
      }
    };

    // Override setTransition
    slider.setTransition = function (duration) {
      for (let i = 0; i < slider.slides.length; i++) {
        slider.slides[i].style.transitionDuration = `${duration}ms`;
        if (overlayEls[i]) {
          overlayEls[i].style.transitionDuration = `${duration}ms`;
        }
      }
      slider.emit('setTransition', slider, duration);
    };

    // Override loopFix for loop mode
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
          _prevActiveIndex = newIdx;
          const translate = -slider.snapGrid[newIdx];
          slider.setTranslate(translate);
        }
      };
    }

    // Initial render
    slider.setTranslate(slider.translate);
  }

  function onSlideChange() {
    if (slider.params.effect !== 'cards') return;

    // Advance auto-cycle direction
    if (slider.params.cardsEffect.direction === 'auto') {
      _autoCycleIndex++;
    }

    const params = slider.params.cardsEffect;
    if (params.mode === 'flip') {
      const newIdx = slider.activeIndex;
      if (newIdx !== _prevActiveIndex) {
        applyFlipTransition(_prevActiveIndex, newIdx);
        _prevActiveIndex = newIdx;
      }
    } else {
      _prevActiveIndex = slider.activeIndex;
      setSlideTransforms();
    }
  }

  function onUpdate() {
    if (slider.params.effect !== 'cards') return;
    slider.setTranslate(slider.translate);
  }

  function destroy() {
    // Clear flip timeout
    if (_flipTimeout) {
      clearTimeout(_flipTimeout);
      _flipTimeout = null;
    }

    // Remove container classes
    slider.el.classList.remove('drift-slider--cards');
    slider.el.classList.remove('drift-slider--cards-diagonal');
    slider.el.classList.remove('drift-slider--cards-flip');

    // Clean track perspective
    if (slider.trackEl) {
      slider.trackEl.style.perspective = '';
    }

    // Clean slide styles and remove overlays
    for (let i = 0; i < slider.slides.length; i++) {
      const slide = slider.slides[i];
      slide.style.position = '';
      slide.style.top = '';
      slide.style.left = '';
      slide.style.width = '';
      slide.style.height = '';
      slide.style.transform = '';
      slide.style.opacity = '';
      slide.style.visibility = '';
      slide.style.zIndex = '';
      slide.style.pointerEvents = '';
      slide.style.boxShadow = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
      slide.style.transformStyle = '';
      slide.style.backfaceVisibility = '';

      // Remove overlay divs
      if (overlayEls[i] && overlayEls[i].parentNode) {
        overlayEls[i].parentNode.removeChild(overlayEls[i]);
      }
    }
    overlayEls.length = 0;

    // Clean list styles
    slider.listEl.style.height = '';
    slider.listEl.style.position = '';

    // Reset auto-cycle
    _autoCycleIndex = 0;
  }

  on('init', init);
  on('slideChange', onSlideChange);
  on('update', onUpdate);
  on('resize', onUpdate);
  on('destroy', destroy);
}
