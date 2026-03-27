export default function EffectDeck({ slider, extendParams, on }) {
  const overlayEls = [];

  const ORIGIN_MAP = {
    'bottom-left': 'left bottom',
    'bottom-right': 'right bottom',
    'top-left': 'left top',
    'top-right': 'right top',
    'center': 'center center',
  };

  extendParams({
    deckEffect: {
      stackOrigin: 'bottom-left',
      activeScale: 1,
      stackScale: 0.6,
      stackOffsetX: 4,
      stackOffsetY: 3,
      stackVisibleCount: 3,
      perspective: 1200,
      depthSpacing: 30,
      tiltX: 5,
      tiltY: -3,
      activeDepth: 50,
      overlay: true,
      overlayColor: 'rgba(0,0,0,0.15)',
      shadow: true,
      shadowColor: 'rgba(0,0,0,0.25)',
      shadowBlur: 20,
    },
  });

  function getOriginCSS() {
    const origin = slider.params.deckEffect.stackOrigin;
    return ORIGIN_MAP[origin] || ORIGIN_MAP['bottom-left'];
  }

  function getCornerMultipliers() {
    const origin = slider.params.deckEffect.stackOrigin;
    switch (origin) {
      case 'bottom-left':  return { mx: -1, my:  1 };
      case 'bottom-right': return { mx:  1, my:  1 };
      case 'top-left':     return { mx: -1, my: -1 };
      case 'top-right':    return { mx:  1, my: -1 };
      case 'center':       return { mx:  0, my:  0 };
      default:             return { mx: -1, my:  1 };
    }
  }

  function setupSlides() {
    const slides = slider.slides;
    const params = slider.params.deckEffect;

    // Measure height before absolute positioning
    const firstSlide = slides[0];
    const slideHeight = firstSlide ? firstSlide.offsetHeight : 0;

    slider.listEl.style.position = 'relative';
    slider.listEl.style.height = `${slideHeight}px`;

    // Add container class
    slider.el.classList.add('drift-slider--deck');

    // 3D perspective on track
    if (params.perspective > 0 && slider.trackEl) {
      slider.trackEl.style.perspective = `${params.perspective}px`;
      slider.trackEl.style.transformStyle = 'preserve-3d';
    }

    const originCSS = getOriginCSS();

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.style.position = 'absolute';
      slide.style.top = '0';
      slide.style.left = '0';
      slide.style.width = '100%';
      slide.style.height = '100%';
      slide.style.transitionProperty = 'transform, opacity, visibility, box-shadow';
      slide.style.transitionDuration = `${slider.params.speed}ms`;
      slide.style.transformOrigin = originCSS;

      // Create overlay div if needed
      if (params.overlay) {
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'drift-deck-overlay';
        overlayDiv.style.position = 'absolute';
        overlayDiv.style.inset = '0';
        overlayDiv.style.pointerEvents = 'none';
        overlayDiv.style.transitionProperty = 'opacity';
        overlayDiv.style.transitionDuration = `${slider.params.speed}ms`;
        overlayDiv.style.background = params.overlayColor;
        overlayDiv.style.opacity = '0';
        slide.appendChild(overlayDiv);
        overlayEls[i] = overlayDiv;
      }
    }
  }

  function setSlideTransforms() {
    const slides = slider.slides;
    const params = slider.params.deckEffect;
    const activeIdx = slider.activeIndex;
    const total = slides.length;
    const has3D = params.perspective > 0;
    const cornerMul = getCornerMultipliers();

    // Compute corner offset for stack cards
    const containerW = slider.el.clientWidth || 0;
    const containerH = slider.el.clientHeight || 0;
    const scaledW = containerW * params.stackScale;
    const scaledH = containerH * params.stackScale;
    const gapX = (containerW - scaledW) / 2;
    const gapY = (containerH - scaledH) / 2;

    // Base corner translation
    const baseX = gapX * cornerMul.mx;
    const baseY = gapY * cornerMul.my;

    for (let i = 0; i < total; i++) {
      const slide = slides[i];

      // Calculate offset from active index
      let offset = i - activeIdx;
      if (slider.params.loop) {
        // In loop mode, find shortest distance
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;
      }

      if (offset === 0) {
        // Active card
        let transform = `scale(${params.activeScale})`;
        if (has3D) {
          transform += ` translateZ(${params.activeDepth}px)`;
        }
        slide.style.transform = transform;
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.zIndex = String(params.stackVisibleCount + 1);
        slide.style.pointerEvents = 'auto';

        if (params.shadow) {
          slide.style.boxShadow =
            `0 ${params.shadowBlur / 2}px ${params.shadowBlur}px ${params.shadowColor}`;
        } else {
          slide.style.boxShadow = 'none';
        }

        // Active overlay: hidden
        if (overlayEls[i]) {
          overlayEls[i].style.opacity = '0';
        }
      } else if (offset > 0 && offset <= params.stackVisibleCount) {
        // Stack cards (next slides visible behind active)
        const layer = offset;
        const tx = baseX + params.stackOffsetX * layer * cornerMul.mx;
        const ty = baseY + params.stackOffsetY * layer * cornerMul.my;

        let transform = `translate3d(${tx}px, ${ty}px, 0) scale(${params.stackScale})`;
        if (has3D) {
          transform = `translate3d(${tx}px, ${ty}px, ${-params.depthSpacing * layer}px) scale(${params.stackScale}) rotateX(${params.tiltX}deg) rotateY(${params.tiltY}deg)`;
        }

        slide.style.transform = transform;
        slide.style.opacity = String(1 - layer * (0.3 / params.stackVisibleCount));
        slide.style.visibility = 'visible';
        slide.style.zIndex = String(params.stackVisibleCount + 1 - layer);
        slide.style.pointerEvents = 'none';
        slide.style.boxShadow = 'none';

        // Stack overlay: increasing opacity per layer
        if (overlayEls[i]) {
          overlayEls[i].style.opacity = String(layer * (0.6 / params.stackVisibleCount));
        }
      } else {
        // Hidden cards
        slide.style.transform = 'none';
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

  function overrideMethods() {
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

      setSlideTransforms();
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
  }

  function init() {
    if (slider.params.effect !== 'deck') return;

    // Force slidesPerView = 1
    slider.params.slidesPerView = 1;

    setupSlides();
    overrideMethods();

    // Initial render
    slider.setTranslate(slider.translate);
  }

  function onSlideChange() {
    if (slider.params.effect !== 'deck') return;
    setSlideTransforms();
  }

  function onUpdate() {
    if (slider.params.effect !== 'deck') return;
    // Re-measure list height on resize/update
    const firstSlide = slider.slides[0];
    if (firstSlide) {
      slider.listEl.style.height = `${firstSlide.offsetHeight}px`;
    }
    slider.setTranslate(slider.translate);
  }

  function destroy() {
    // Remove container class
    slider.el.classList.remove('drift-slider--deck');

    // Clear perspective/transformStyle on trackEl
    if (slider.trackEl) {
      slider.trackEl.style.perspective = '';
      slider.trackEl.style.transformStyle = '';
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
      slide.style.transformOrigin = '';

      // Remove overlay divs
      if (overlayEls[i] && overlayEls[i].parentNode) {
        overlayEls[i].parentNode.removeChild(overlayEls[i]);
      }
    }
    overlayEls.length = 0;

    // Clean list styles
    slider.listEl.style.height = '';
    slider.listEl.style.position = '';
  }

  on('init', init);
  on('slideChange', onSlideChange);
  on('update', onUpdate);
  on('resize', onUpdate);
  on('destroy', destroy);
}
