export default function EffectDeck({ slider, extendParams, on }) {
  const overlayEls = [];

  extendParams({
    deckEffect: {
      stackOrigin: 'bottom-left',
      activeScale: 0.85,
      stackScale: 0.5,
      stackOffsetX: 6,
      stackOffsetY: 4,
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

  /**
   * Returns {tx, ty, dx, dy} — base position and per-layer direction.
   * All slides use transformOrigin: center center, so we translate from center.
   */
  function getStackTranslation(containerW, containerH, stackScale, origin) {
    const sw = containerW * stackScale;
    const sh = containerH * stackScale;
    const edgeX = (containerW - sw) / 2;
    const edgeY = (containerH - sh) / 2;

    switch (origin) {
      case 'bottom-left':  return { tx: -edgeX * 0.7, ty: edgeY * 0.7, dx: -1, dy: 1 };
      case 'bottom-right': return { tx: edgeX * 0.7,  ty: edgeY * 0.7, dx: 1, dy: 1 };
      case 'top-left':     return { tx: -edgeX * 0.7, ty: -edgeY * 0.7, dx: -1, dy: -1 };
      case 'top-right':    return { tx: edgeX * 0.7,  ty: -edgeY * 0.7, dx: 1, dy: -1 };
      case 'center':       return { tx: 0, ty: 0, dx: 0, dy: 0 };
      default:             return { tx: -edgeX * 0.7, ty: edgeY * 0.7, dx: -1, dy: 1 };
    }
  }

  function setupSlides() {
    const slides = slider.slides;
    const params = slider.params.deckEffect;

    // Measure height before absolute positioning
    const firstSlide = slides[0];
    const slideHeight = firstSlide ? firstSlide.offsetHeight : 0;

    slider.listEl.style.position = 'relative';
    slider.listEl.style.width = '100%';
    slider.listEl.style.height = `${slideHeight}px`;

    // Add container class and allow overflow for stack visibility
    slider.el.classList.add('drift-slider--deck');
    slider.el.style.overflow = 'visible';
    if (slider.trackEl) {
      slider.trackEl.style.overflow = 'visible';
    }

    // 3D perspective on track
    if (params.perspective > 0 && slider.trackEl) {
      slider.trackEl.style.perspective = `${params.perspective}px`;
      slider.trackEl.style.transformStyle = 'preserve-3d';
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
      slide.style.transformOrigin = 'center center';

      // Create overlay div if needed
      if (params.overlay) {
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'drift-deck-overlay';
        overlayDiv.style.position = 'absolute';
        overlayDiv.style.inset = '0';
        overlayDiv.style.pointerEvents = 'none';
        overlayDiv.style.borderRadius = 'inherit';
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

    // Container dimensions for stack positioning
    const containerW = slider.el.clientWidth || 0;
    const containerH = slider.el.clientHeight || 0;

    // Base stack position (center of where stack cards go)
    const stackBase = getStackTranslation(
      containerW, containerH, params.stackScale, params.stackOrigin
    );

    for (let i = 0; i < total; i++) {
      const slide = slides[i];

      // Calculate offset from active index
      let offset = i - activeIdx;
      if (slider.params.loop) {
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;
      }

      if (offset === 0) {
        // --- Active card: centered, scaled ---
        let transform = `translate3d(0, 0, 0) scale(${params.activeScale})`;
        if (has3D) {
          transform = `translate3d(0, 0, ${params.activeDepth}px) scale(${params.activeScale})`;
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

        if (overlayEls[i]) {
          overlayEls[i].style.opacity = '0';
        }
      } else if (offset > 0 && offset <= params.stackVisibleCount) {
        // --- Stack cards: translated to corner, scaled down ---
        const layer = offset;
        // Each layer fans out further in the corner direction
        const tx = stackBase.tx + params.stackOffsetX * layer * stackBase.dx;
        const ty = stackBase.ty + params.stackOffsetY * layer * stackBase.dy;

        let transform = `translate3d(${tx}px, ${ty}px, 0) scale(${params.stackScale})`;
        if (has3D) {
          const tz = -params.depthSpacing * layer;
          transform = `translate3d(${tx}px, ${ty}px, ${tz}px) scale(${params.stackScale}) rotateX(${params.tiltX}deg) rotateY(${params.tiltY}deg)`;
        }

        const layerOpacity = 1 - layer * (0.15);
        slide.style.transform = transform;
        slide.style.opacity = String(Math.max(layerOpacity, 0.4));
        slide.style.visibility = 'visible';
        slide.style.zIndex = String(params.stackVisibleCount + 1 - layer);
        slide.style.pointerEvents = 'none';
        slide.style.boxShadow = 'none';

        if (overlayEls[i]) {
          overlayEls[i].style.opacity = String(layer * (0.4 / params.stackVisibleCount));
        }
      } else {
        // --- Hidden cards ---
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

    slider.params.slidesPerView = 1;

    setupSlides();
    overrideMethods();

    slider.setTranslate(slider.translate);
  }

  function onSlideChange() {
    if (slider.params.effect !== 'deck') return;
    setSlideTransforms();
  }

  function onUpdate() {
    if (slider.params.effect !== 'deck') return;
    const firstSlide = slider.slides[0];
    if (firstSlide) {
      slider.listEl.style.height = `${firstSlide.offsetHeight}px`;
    }
    slider.setTranslate(slider.translate);
  }

  function destroy() {
    slider.el.classList.remove('drift-slider--deck');
    slider.el.style.overflow = '';

    if (slider.trackEl) {
      slider.trackEl.style.overflow = '';
      slider.trackEl.style.perspective = '';
      slider.trackEl.style.transformStyle = '';
    }

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

      if (overlayEls[i] && overlayEls[i].parentNode) {
        overlayEls[i].parentNode.removeChild(overlayEls[i]);
      }
    }
    overlayEls.length = 0;

    slider.listEl.style.width = '';
    slider.listEl.style.height = '';
    slider.listEl.style.position = '';
  }

  on('init', init);
  on('slideChange', onSlideChange);
  on('update', onUpdate);
  on('resize', onUpdate);
  on('destroy', destroy);
}
