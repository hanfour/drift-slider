/*!
 * DriftSlider v0.1.0
 * A lightweight, modular slider/carousel library
 * MIT License
 */
var defaults = {
  // Direction
  direction: 'horizontal', // 'horizontal' | 'vertical'

  // Slides
  slidesPerView: 1,
  spaceBetween: 0,
  centeredSlides: false,
  slidesPerGroup: 1,

  // Speed & animation
  speed: 400,
  easing: 'ease-out',

  // Physics-based touch (Keen-Slider / Flickity inspired)
  physics: {
    friction: 0.92,
    attraction: 0.025,
    bounceRate: 0.5,
  },

  // Touch / Drag
  touchEnabled: true,
  threshold: 5,
  touchAngle: 45,
  shortSwipes: true,
  longSwipesRatio: 0.5,
  followFinger: true,
  resistance: true,
  resistanceRatio: 0.85,

  // Loop
  loop: false,
  loopAdditionalSlides: 0,

  // Autoplay (module)
  autoplay: false,

  // Navigation (module)
  navigation: false,

  // Pagination (module)
  pagination: false,

  // Keyboard (module)
  keyboard: false,

  // Accessibility (module)
  a11y: true,

  // Effect
  effect: 'slide', // 'slide' | 'fade'

  // Breakpoints
  breakpoints: null,

  // Initial slide
  initialSlide: 0,

  // CSS classes
  containerClass: 'drift-slider',
  trackClass: 'drift-track',
  listClass: 'drift-list',
  slideClass: 'drift-slide',
  slideActiveClass: 'drift-slide--active',
  slidePrevClass: 'drift-slide--prev',
  slideNextClass: 'drift-slide--next',
  slideVisibleClass: 'drift-slide--visible',
  slideCloneClass: 'drift-slide--clone',

  // Grab cursor
  grabCursor: false,

  // Observer
  watchOverflow: true,

  // Modules
  modules: [],

  // Callbacks
  on: null,
};

var eventsEmitter = {
  on(event, handler, priority) {
    if (!this._events) this._events = {};
    if (!this._events[event]) this._events[event] = [];

    this._events[event].push({ handler, priority: priority || false });
    return this;
  },

  once(event, handler) {
    if (!this._events) this._events = {};

    const onceHandler = (...args) => {
      this.off(event, onceHandler);
      handler.apply(this, args);
    };
    onceHandler._original = handler;
    return this.on(event, onceHandler);
  },

  off(event, handler) {
    if (!this._events || !this._events[event]) return this;

    if (!handler) {
      this._events[event] = [];
    } else {
      this._events[event] = this._events[event].filter(
        (h) => h.handler !== handler && h.handler._original !== handler
      );
    }
    return this;
  },

  emit(event, ...args) {
    if (!this._events || !this._events[event]) return this;

    const handlers = [...this._events[event]];
    // Priority handlers first
    handlers.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));

    for (const { handler } of handlers) {
      handler.apply(this, args);
    }
    return this;
  },
};

let idCounter = 0;

function uniqueId(prefix = 'drift') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function deepMerge(target, ...sources) {
  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      if (isObject(source[key]) && isObject(target[key])) {
        target[key] = deepMerge({}, target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

/**
 * Like deepMerge but only sets keys that don't already exist in target.
 * Used by extendParams so module defaults don't overwrite user options.
 */
function deepMergeDefaults(target, ...sources) {
  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      if (!(key in target)) {
        // Key doesn't exist in target, set it
        target[key] = isObject(source[key]) ? deepMerge({}, source[key]) : source[key];
      } else if (isObject(source[key]) && isObject(target[key])) {
        // Both are objects, recurse to fill missing sub-keys
        deepMergeDefaults(target[key], source[key]);
      } else if (isObject(source[key]) && !isObject(target[key])) {
        // Source is an object but target is a primitive (e.g. false/true/null).
        // Module's extendParams provides the full default object — use it.
        // The module being loaded means the user wants this feature.
        target[key] = deepMerge({}, source[key]);
      }
      // else: key exists in target as a leaf and source is also a leaf — keep user's value
    }
  }
  return target;
}

function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function now() {
  return Date.now();
}

function $(selector, context = document) {
  if (typeof selector === 'string') {
    return context.querySelector(selector);
  }
  return selector;
}

function $$(selector, context = document) {
  if (typeof selector === 'string') {
    return Array.from(context.querySelectorAll(selector));
  }
  if (selector instanceof NodeList || selector instanceof HTMLCollection) {
    return Array.from(selector);
  }
  return Array.isArray(selector) ? selector : [selector];
}

function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'innerHTML') {
      el.innerHTML = val;
    } else if (key === 'textContent') {
      el.textContent = val;
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

function addClass(el, ...classes) {
  el.classList.add(...classes.filter(Boolean));
}

function removeClass(el, ...classes) {
  el.classList.remove(...classes.filter(Boolean));
}

function updateModule({ slider }) {
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

    if (params.centeredSlides) ;

    for (let i = 0; i < slides.length; i++) {
      const currentSlideSize = slideSize;
      slidesSizesGrid.push(currentSlideSize);

      const slidePosition = i * (currentSlideSize + spaceBetween);
      slidesGrid.push(slidePosition);

      // Snap grid (per group)
      if (i % params.slidesPerGroup === 0) {
        if (params.centeredSlides) {
          snapGrid.push(slidePosition);
        } else {
          snapGrid.push(slidePosition);
        }
      }

      // Set slide dimensions
      if (isHorizontal) {
        slides[i].style.width = `${currentSlideSize}px`;
        slides[i].style.marginRight = `${spaceBetween}px`;
      } else {
        slides[i].style.height = `${currentSlideSize}px`;
        slides[i].style.marginBottom = `${spaceBetween}px`;
      }
    }

    slider.snapGrid = snapGrid;
    slider.slidesGrid = slidesGrid;
    slider.slidesSizesGrid = slidesSizesGrid;

    // Total list size
    const totalSize =
      slides.length * slideSize + (slides.length - 1) * spaceBetween;

    // Max translate
    slider.maxTranslate = 0;
    slider.minTranslate = -(totalSize - containerSize);

    if (slider.minTranslate > 0) slider.minTranslate = 0;

    // Check overflow (not enough slides)
    slider.isLocked =
      params.watchOverflow && snapGrid.length <= 1;

    // Update list size
    if (isHorizontal) {
      slider.listEl.style.width = `${totalSize}px`;
    } else {
      slider.listEl.style.height = `${totalSize}px`;
    }
  }

  function update() {
    calcSlides();
    slider.updateSlidesClasses();
    slider.emit('update', slider);
  }

  slider.calcSlides = calcSlides;
  slider.update = update;
}

function translateModule({ slider }) {
  function setTranslate(translate) {
    const isHorizontal = slider.params.direction === 'horizontal';
    const x = isHorizontal ? translate : 0;
    const y = isHorizontal ? 0 : translate;

    slider.listEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    slider.translate = translate;

    slider.progress = slider.maxTranslate === slider.minTranslate
      ? 0
      : (translate - slider.maxTranslate) /
        (slider.minTranslate - slider.maxTranslate);

    slider.isBeginning = slider.activeIndex === 0;
    slider.isEnd = slider.activeIndex === slider.snapGrid.length - 1;

    slider.emit('setTranslate', slider, translate);
    slider.emit('progress', slider, slider.progress);
  }

  function getTranslate() {
    return slider.translate || 0;
  }

  slider.setTranslate = setTranslate;
  slider.getTranslate = getTranslate;
}

function transitionModule({ slider }) {
  function setTransition(duration) {
    slider.listEl.style.transitionDuration = `${duration}ms`;
    slider.emit('setTransition', slider, duration);
  }

  function transitionStart(runCallbacks = true) {
    slider.animating = true;
    if (runCallbacks) {
      slider.emit('slideChangeTransitionStart', slider);

      if (slider.activeIndex !== slider.previousIndex) {
        slider.emit('slideChange', slider);
      }
    }
  }

  function transitionEnd(runCallbacks = true) {
    if (!slider.animating) return;
    slider.animating = false;
    setTransition(0);
    if (runCallbacks) {
      slider.emit('slideChangeTransitionEnd', slider);
    }

    // Fix loop position after transition completes
    if (slider.params.loop) {
      slider.loopFix();
    }
  }

  function onTransitionEnd() {
    transitionEnd(true);
  }

  slider.setTransition = setTransition;
  slider.transitionStart = transitionStart;
  slider.transitionEnd = transitionEnd;
  slider.onTransitionEnd = onTransitionEnd;
}

function slideModule({ slider }) {
  function slideTo(index, speed, runCallbacks = true) {
    if (typeof speed === 'undefined') speed = slider.params.speed;
    if (slider.destroyed) return slider;
    if (!slider.snapGrid.length) return slider;

    const params = slider.params;
    let slideIndex = clamp(index, 0, slider.snapGrid.length - 1);

    const translate = -slider.snapGrid[slideIndex];

    // Store previous
    slider.previousIndex = slider.activeIndex;
    slider.activeIndex = slideIndex;

    // Determine real index for loop mode
    if (params.loop && slider._loopedSlides) {
      slider.realIndex = slider._getRealIndex(slideIndex);
    } else {
      slider.realIndex = slideIndex;
    }

    // Animate
    if (speed > 0) {
      slider.setTransition(speed);
      slider.setTranslate(translate);
      slider.transitionStart(runCallbacks);
    } else {
      slider.setTransition(0);
      slider.setTranslate(translate);
      if (runCallbacks && slider.activeIndex !== slider.previousIndex) {
        slider.emit('slideChange', slider);
      }
    }

    // Update boundary state after setTranslate
    if (slider.isBeginning) slider.emit('reachBeginning', slider);
    if (slider.isEnd) slider.emit('reachEnd', slider);

    slider.updateSlidesClasses();

    return slider;
  }

  function slideNext(speed, runCallbacks = true) {
    const params = slider.params;

    if (params.loop && slider._loopedSlides) {
      // In loop mode: let it go past current, loopFix will correct
      const nextIndex = slider.activeIndex + params.slidesPerGroup;
      if (nextIndex >= slider.snapGrid.length) {
        // Jump back via loopFix first, then move forward
        slider.loopFix();
        return slideTo(slider.activeIndex + params.slidesPerGroup, speed, runCallbacks);
      }
      return slideTo(nextIndex, speed, runCallbacks);
    }

    const nextIndex = Math.min(
      slider.activeIndex + params.slidesPerGroup,
      slider.snapGrid.length - 1
    );
    return slideTo(nextIndex, speed, runCallbacks);
  }

  function slidePrev(speed, runCallbacks = true) {
    const params = slider.params;

    if (params.loop && slider._loopedSlides) {
      const prevIndex = slider.activeIndex - params.slidesPerGroup;
      if (prevIndex < 0) {
        slider.loopFix();
        return slideTo(slider.activeIndex - params.slidesPerGroup, speed, runCallbacks);
      }
      return slideTo(prevIndex, speed, runCallbacks);
    }

    const prevIndex = Math.max(slider.activeIndex - params.slidesPerGroup, 0);
    return slideTo(prevIndex, speed, runCallbacks);
  }

  function slideToClosest(speed) {
    const currentTranslate = slider.getTranslate();
    let closestIndex = 0;
    let closestDist = Infinity;

    for (let i = 0; i < slider.snapGrid.length; i++) {
      const dist = Math.abs(-slider.snapGrid[i] - currentTranslate);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    return slideTo(closestIndex, speed);
  }

  slider.slideTo = slideTo;
  slider.slideNext = slideNext;
  slider.slidePrev = slidePrev;
  slider.slideToClosest = slideToClosest;
}

function classesModule({ slider }) {
  function updateSlidesClasses() {
    const params = slider.params;
    const slides = slider.slides;
    const activeIdx = slider.activeIndex;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      removeClass(
        slide,
        params.slideActiveClass,
        params.slidePrevClass,
        params.slideNextClass,
        params.slideVisibleClass
      );
    }

    if (!slides[activeIdx]) return;

    addClass(slides[activeIdx], params.slideActiveClass);

    // Prev
    if (slides[activeIdx - 1]) {
      addClass(slides[activeIdx - 1], params.slidePrevClass);
    }
    // Next
    if (slides[activeIdx + 1]) {
      addClass(slides[activeIdx + 1], params.slideNextClass);
    }

    // Visible slides
    const perView = params.slidesPerView;
    for (let i = activeIdx; i < activeIdx + perView && i < slides.length; i++) {
      addClass(slides[i], params.slideVisibleClass);
    }
  }

  function addContainerClasses() {
    const params = slider.params;
    addClass(
      slider.el,
      'drift-slider--initialized',
      params.direction === 'horizontal'
        ? 'drift-slider--horizontal'
        : 'drift-slider--vertical'
    );
  }

  function removeContainerClasses() {
    removeClass(
      slider.el,
      'drift-slider--initialized',
      'drift-slider--horizontal',
      'drift-slider--vertical',
      'drift-slider--locked',
      'drift-slider--dragging'
    );
  }

  slider.updateSlidesClasses = updateSlidesClasses;
  slider.addContainerClasses = addContainerClasses;
  slider.removeContainerClasses = removeContainerClasses;
}

function eventsModule({ slider }) {
  let resizeHandler;

  function onListTransitionEnd(e) {
    // Only handle transform transitions on the list element itself
    if (e.target !== slider.listEl) return;
    if (e.propertyName !== 'transform') return;
    slider.onTransitionEnd();
  }

  function attachEvents() {
    resizeHandler = debounce(() => {
      if (slider.destroyed) return;
      slider.setBreakpoint();
      slider.update();
      slider.slideTo(slider.activeIndex, 0, false);
      slider.emit('resize', slider);
    }, 200);

    window.addEventListener('resize', resizeHandler);
    slider.listEl.addEventListener('transitionend', onListTransitionEnd);
  }

  function detachEvents() {
    if (resizeHandler) {
      window.removeEventListener('resize', resizeHandler);
    }
    slider.listEl.removeEventListener('transitionend', onListTransitionEnd);
  }

  slider.attachEvents = attachEvents;
  slider.detachEvents = detachEvents;
}

function grabCursorModule({ slider }) {
  function setGrabCursor(moving) {
    if (!slider.params.grabCursor || slider.isLocked) return;

    const el = slider.trackEl || slider.el;
    el.style.cursor = moving ? 'grabbing' : 'grab';
  }

  function unsetGrabCursor() {
    const el = slider.trackEl || slider.el;
    el.style.cursor = '';
  }

  slider.setGrabCursor = setGrabCursor;
  slider.unsetGrabCursor = unsetGrabCursor;
}

let passiveSupported = null;

function supportsPassive() {
  if (passiveSupported !== null) return passiveSupported;
  try {
    const opts = Object.defineProperty({}, 'passive', {
      get() {
        passiveSupported = true;
      },
    });
    window.addEventListener('testPassive', null, opts);
    window.removeEventListener('testPassive', null, opts);
  } catch {
    passiveSupported = false;
  }
  return passiveSupported;
}

function supportsTouchEvents() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function supportsPointerEvents() {
  return !!window.PointerEvent;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function passiveListener() {
  return supportsPassive() ? { passive: true } : false;
}

function activeListener() {
  return supportsPassive() ? { passive: false } : false;
}

function touchModule({ slider }) {
  const touchData = {
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    diff: 0,
    startTime: 0,
    startTranslate: 0,
    isTouched: false,
    isMoved: false,
    isScrolling: undefined,
    // Velocity tracking (last N points)
    velocityTracker: [],
  };

  function getEventPos(e) {
    if (e.type && e.type.startsWith('touch')) {
      const touch = e.changedTouches[0] || e.touches[0];
      return { x: touch.pageX, y: touch.pageY };
    }
    return { x: e.pageX, y: e.pageY };
  }

  function onTouchStart(e) {
    if (slider.destroyed || slider.isLocked) return;
    if (!slider.params.touchEnabled) return;

    // Only handle primary button for mouse
    if (e.type === 'mousedown' && e.button !== 0) return;
    if (e.type === 'pointerdown' && e.button !== 0) return;

    const pos = getEventPos(e);
    const isHorizontal = slider.params.direction === 'horizontal';

    touchData.startX = pos.x;
    touchData.startY = pos.y;
    touchData.currentX = pos.x;
    touchData.currentY = pos.y;
    touchData.startTime = now();
    touchData.startTranslate = slider.getTranslate();
    touchData.isTouched = true;
    touchData.isMoved = false;
    touchData.isScrolling = undefined;
    touchData.velocityTracker = [{ pos: isHorizontal ? pos.x : pos.y, time: now() }];

    // Stop any ongoing transition
    slider.setTransition(0);
    if (slider.animating) {
      slider.transitionEnd(false);
    }

    slider.setGrabCursor(true);
    slider.emit('touchStart', slider, e);
  }

  function onTouchMove(e) {
    if (!touchData.isTouched || slider.destroyed) return;

    const params = slider.params;
    const isHorizontal = params.direction === 'horizontal';
    const pos = getEventPos(e);

    touchData.currentX = pos.x;
    touchData.currentY = pos.y;

    const diffX = pos.x - touchData.startX;
    const diffY = pos.y - touchData.startY;

    // Determine scroll direction on first move
    if (typeof touchData.isScrolling === 'undefined') {
      if (isHorizontal) {
        touchData.isScrolling = Math.abs(diffY) > Math.abs(diffX);
      } else {
        touchData.isScrolling = Math.abs(diffX) > Math.abs(diffY);
      }
    }

    if (touchData.isScrolling) {
      touchData.isTouched = false;
      return;
    }

    e.preventDefault();

    const diff = isHorizontal ? diffX : diffY;

    // Check threshold
    if (!touchData.isMoved && Math.abs(diff) < params.threshold) return;

    touchData.isMoved = true;
    touchData.diff = diff;

    // Track velocity (keep last 5 points)
    touchData.velocityTracker.push({
      pos: isHorizontal ? pos.x : pos.y,
      time: now(),
    });
    if (touchData.velocityTracker.length > 5) {
      touchData.velocityTracker.shift();
    }

    // Calculate new translate with resistance at boundaries
    let newTranslate = touchData.startTranslate + diff;

    if (params.resistance) {
      // Rubberband effect at boundaries
      if (newTranslate > slider.maxTranslate) {
        const overscroll = newTranslate - slider.maxTranslate;
        newTranslate = slider.maxTranslate + overscroll * params.resistanceRatio * params.physics.bounceRate;
      } else if (newTranslate < slider.minTranslate) {
        const overscroll = slider.minTranslate - newTranslate;
        newTranslate = slider.minTranslate - overscroll * params.resistanceRatio * params.physics.bounceRate;
      }
    } else {
      newTranslate = clamp(newTranslate, slider.minTranslate, slider.maxTranslate);
    }

    if (params.followFinger) {
      slider.setTranslate(newTranslate);
    }

    slider.emit('touchMove', slider, e);
  }

  function onTouchEnd(e) {
    if (!touchData.isTouched || slider.destroyed) return;

    touchData.isTouched = false;
    slider.setGrabCursor(false);

    const params = slider.params;

    if (!touchData.isMoved) {
      slider.emit('touchEnd', slider, e);
      return;
    }

    // Calculate release velocity
    const tracker = touchData.velocityTracker;
    let velocity = 0;

    if (tracker.length >= 2) {
      const last = tracker[tracker.length - 1];
      const prev = tracker[Math.max(0, tracker.length - 3)];
      const dt = last.time - prev.time;
      if (dt > 0 && dt < 300) {
        velocity = (last.pos - prev.pos) / dt; // px/ms
      }
    }

    const currentTranslate = slider.getTranslate();
    const swipeTime = now() - touchData.startTime;

    // Physics-based momentum
    const friction = params.physics.friction;
    const absVelocity = Math.abs(velocity);

    // Calculate momentum distance
    let momentumDistance = 0;
    if (absVelocity > 0.1) {
      // d = v * friction / (1 - friction) — geometric series
      momentumDistance = velocity * friction / (1 - friction) * 0.5;
    }

    const targetTranslate = clamp(
      currentTranslate + momentumDistance,
      slider.minTranslate,
      slider.maxTranslate
    );

    // Find closest snap point to target
    let closestIndex = 0;
    let closestDist = Infinity;

    for (let i = 0; i < slider.snapGrid.length; i++) {
      const dist = Math.abs(-slider.snapGrid[i] - targetTranslate);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    }

    // Short swipe detection
    if (params.shortSwipes && swipeTime < 300 && absVelocity > 0.2) {
      if (velocity > 0 && closestIndex >= slider.activeIndex) {
        closestIndex = Math.max(0, slider.activeIndex - 1);
      } else if (velocity < 0 && closestIndex <= slider.activeIndex) {
        closestIndex = Math.min(slider.snapGrid.length - 1, slider.activeIndex + 1);
      }
    }

    // Calculate animation speed based on distance
    const snapTranslate = -slider.snapGrid[closestIndex];
    const distance = Math.abs(snapTranslate - currentTranslate);
    const animSpeed = Math.max(
      Math.min(distance / (absVelocity > 0.1 ? absVelocity : 1), params.speed),
      200
    );

    slider.slideTo(closestIndex, animSpeed);

    slider.emit('touchEnd', slider, e);
  }

  function attachTouchEvents() {
    const target = slider.trackEl || slider.el;
    const passive = passiveListener();
    const active = activeListener();

    if (supportsPointerEvents()) {
      target.addEventListener('pointerdown', onTouchStart, passive);
      document.addEventListener('pointermove', onTouchMove, active);
      document.addEventListener('pointerup', onTouchEnd, passive);
      document.addEventListener('pointercancel', onTouchEnd, passive);
    } else {
      if (supportsTouchEvents()) {
        target.addEventListener('touchstart', onTouchStart, passive);
        document.addEventListener('touchmove', onTouchMove, active);
        document.addEventListener('touchend', onTouchEnd, passive);
        document.addEventListener('touchcancel', onTouchEnd, passive);
      }
      target.addEventListener('mousedown', onTouchStart);
      document.addEventListener('mousemove', onTouchMove);
      document.addEventListener('mouseup', onTouchEnd);
    }
  }

  function detachTouchEvents() {
    const target = slider.trackEl || slider.el;

    target.removeEventListener('pointerdown', onTouchStart);
    document.removeEventListener('pointermove', onTouchMove);
    document.removeEventListener('pointerup', onTouchEnd);
    document.removeEventListener('pointercancel', onTouchEnd);

    target.removeEventListener('touchstart', onTouchStart);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);

    target.removeEventListener('mousedown', onTouchStart);
    document.removeEventListener('mousemove', onTouchMove);
    document.removeEventListener('mouseup', onTouchEnd);
  }

  slider.attachTouchEvents = attachTouchEvents;
  slider.detachTouchEvents = detachTouchEvents;
}

function loopModule({ slider }) {
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

    // If past the end clones region, jump to the corresponding real slide
    if (slider.activeIndex >= totalOriginal + loopedSlides) {
      const newIdx = loopedSlides + (slider.activeIndex - totalOriginal - loopedSlides);
      slider.setTransition(0);
      slider.activeIndex = newIdx;
      const translate = -slider.snapGrid[newIdx];
      slider.listEl.style.transform = `translate3d(${translate}px, 0, 0)`;
      slider.translate = translate;
    }
    // If before the beginning clones region, jump to the corresponding real slide
    else if (slider.activeIndex < loopedSlides) {
      const newIdx = totalOriginal + slider.activeIndex;
      slider.setTransition(0);
      slider.activeIndex = newIdx;
      const translate = -slider.snapGrid[newIdx];
      slider.listEl.style.transform = `translate3d(${translate}px, 0, 0)`;
      slider.translate = translate;
    }
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

function breakpointsModule({ slider }) {
  let currentBreakpoint = undefined; // use undefined so first call always runs

  function getBreakpoint() {
    const breakpoints = slider.params.breakpoints;
    if (!breakpoints) return null;

    const windowWidth = window.innerWidth;
    const points = Object.keys(breakpoints)
      .map(Number)
      .sort((a, b) => a - b);

    let matched = null;
    for (const point of points) {
      if (windowWidth >= point) {
        matched = point;
      }
    }
    return matched;
  }

  function setBreakpoint() {
    const breakpoints = slider.params.breakpoints;
    if (!breakpoints) return;

    const bp = getBreakpoint();
    if (bp === currentBreakpoint) return;

    currentBreakpoint = bp;

    // Reset to original params, then merge breakpoint overrides
    const baseParams = deepMerge({}, slider._originalParams);
    if (bp !== null && breakpoints[bp]) {
      deepMerge(baseParams, breakpoints[bp]);
    }

    // Apply relevant params
    const applyKeys = [
      'slidesPerView', 'spaceBetween', 'slidesPerGroup',
      'centeredSlides', 'loop', 'speed', 'grabCursor',
    ];

    for (const key of applyKeys) {
      if (baseParams[key] !== undefined) {
        slider.params[key] = baseParams[key];
      }
    }

    slider.update();
    slider.slideTo(slider.activeIndex, 0, false);
    slider.emit('breakpoint', slider, bp);
  }

  slider.getBreakpoint = getBreakpoint;
  slider.setBreakpoint = setBreakpoint;
}

// Static modules registry
const globalModules = [];

class DriftSlider {
  constructor(el, options = {}) {
    // Merge defaults with user options
    const params = deepMerge({}, defaults, options);

    // Store original params for breakpoints
    this._originalParams = deepMerge({}, defaults, options);

    this.params = params;
    this._events = {};
    this.destroyed = false;
    this.animating = false;

    // State
    this.activeIndex = params.initialSlide;
    this.previousIndex = 0;
    this.realIndex = params.initialSlide;
    this.progress = 0;
    this.isBeginning = true;
    this.isEnd = false;
    this.isLocked = false;
    this.translate = 0;

    // Snap grids
    this.snapGrid = [];
    this.slidesGrid = [];
    this.slidesSizesGrid = [];
    this.containerSize = 0;
    this.slideSize = 0;
    this.maxTranslate = 0;
    this.minTranslate = 0;

    // Unique ID
    this.id = uniqueId('drift');

    // Find DOM elements
    this.el = typeof el === 'string' ? $(el) : el;
    if (!this.el) {
      throw new Error('DriftSlider: container element not found');
    }

    // Store instance on element
    this.el.driftSlider = this;

    this.trackEl = $(`.${params.trackClass}`, this.el);
    this.listEl = $(`.${params.listClass}`, this.el);

    if (!this.listEl) {
      throw new Error('DriftSlider: list element (.drift-list) not found');
    }

    // Query slides
    this.slides = Array.from(
      this.listEl.querySelectorAll(`:scope > .${params.slideClass}`)
    );

    // Register initial 'on' callbacks
    if (params.on) {
      for (const [event, handler] of Object.entries(params.on)) {
        this.on(event, handler);
      }
    }

    // Mount core modules
    this._mountCoreModules();

    // Mount external modules (global + instance)
    const allModules = [...globalModules, ...(params.modules || [])];
    this._moduleInstances = [];
    this._mountModules(allModules);

    // Initialize
    this._init();
  }

  _mountCoreModules() {
    const context = { slider: this };

    updateModule(context);
    translateModule(context);
    transitionModule(context);
    slideModule(context);
    classesModule(context);
    eventsModule(context);
    grabCursorModule(context);
    touchModule(context);
    loopModule(context);
    breakpointsModule(context);
  }

  _mountModules(modules) {
    for (const mod of modules) {
      if (typeof mod !== 'function') continue;

      const moduleContext = {
        slider: this,
        extendParams: (obj) => {
          deepMergeDefaults(this.params, obj);
          deepMergeDefaults(this._originalParams, obj);
        },
        on: (event, handler) => this.on(event, handler),
        once: (event, handler) => this.once(event, handler),
        off: (event, handler) => this.off(event, handler),
        emit: (event, ...args) => this.emit(event, ...args),
      };

      mod(moduleContext);
      this._moduleInstances.push(mod);
    }
  }

  _init() {
    // Set up loop clones
    this.createLoop();

    // Calculate layout
    this.calcSlides();

    // Add container classes
    this.addContainerClasses();

    // Set initial slide
    const initialIndex = this.params.loop
      ? this.activeIndex + (this._loopedSlides || 0)
      : this.activeIndex;

    this.slideTo(initialIndex, 0, false);

    // Attach DOM events
    this.attachEvents();

    // Attach touch events
    if (this.params.touchEnabled) {
      this.attachTouchEvents();
    }

    // Set grab cursor
    if (this.params.grabCursor) {
      this.setGrabCursor(false);
    }

    // Set breakpoint
    this.setBreakpoint();

    // Emit init
    this.emit('init', this);
  }

  enable() {
    this.params.touchEnabled = true;
    this.isLocked = false;
  }

  disable() {
    this.params.touchEnabled = false;
    this.isLocked = true;
  }

  destroy(cleanStyles = true) {
    if (this.destroyed) return;

    this.emit('beforeDestroy', this);

    // Detach events
    this.detachEvents();
    this.detachTouchEvents();

    // Remove loop clones
    this.destroyLoop();

    // Clean styles
    if (cleanStyles) {
      this.removeContainerClasses();
      this.unsetGrabCursor();

      // Reset slide styles
      for (const slide of this.slides) {
        slide.style.width = '';
        slide.style.height = '';
        slide.style.marginRight = '';
        slide.style.marginBottom = '';
      }

      // Reset list styles
      this.listEl.style.transform = '';
      this.listEl.style.transitionDuration = '';
      this.listEl.style.width = '';
      this.listEl.style.height = '';
    }

    this.destroyed = true;
    this.el.driftSlider = null;
    this.emit('destroy', this);

    // Remove all event listeners
    this._events = {};
  }

  // Static method to register global modules
  static use(modules) {
    const mods = Array.isArray(modules) ? modules : [modules];
    for (const mod of mods) {
      if (!globalModules.includes(mod)) {
        globalModules.push(mod);
      }
    }
  }
}

// Mix in events emitter
Object.assign(DriftSlider.prototype, eventsEmitter);

function Navigation({ slider, extendParams, on }) {
  extendParams({
    navigation: {
      nextEl: null,
      prevEl: null,
      disabledClass: 'drift-arrow--disabled',
      hiddenClass: 'drift-arrow--hidden',
      prevStyle: null,
      nextStyle: null,
    },
  });

  let nextEl = null;
  let prevEl = null;

  function onNextClick(e) {
    e.preventDefault();
    if (slider.isLocked) return;
    slider.slideNext();
  }

  function onPrevClick(e) {
    e.preventDefault();
    if (slider.isLocked) return;
    slider.slidePrev();
  }

  function update() {
    const params = slider.params.navigation;
    if (!nextEl || !prevEl) return;

    if (slider.params.loop) {
      removeClass(prevEl, params.disabledClass);
      removeClass(nextEl, params.disabledClass);
      return;
    }

    if (slider.isBeginning) {
      addClass(prevEl, params.disabledClass);
      prevEl.setAttribute('aria-disabled', 'true');
    } else {
      removeClass(prevEl, params.disabledClass);
      prevEl.setAttribute('aria-disabled', 'false');
    }

    if (slider.isEnd) {
      addClass(nextEl, params.disabledClass);
      nextEl.setAttribute('aria-disabled', 'true');
    } else {
      removeClass(nextEl, params.disabledClass);
      nextEl.setAttribute('aria-disabled', 'false');
    }
  }

  function init() {
    const params = slider.params.navigation;
    if (!params) return;

    // Find or create elements
    if (params.nextEl) {
      nextEl = typeof params.nextEl === 'string' ? $(params.nextEl, slider.el) : params.nextEl;
    }
    if (params.prevEl) {
      prevEl = typeof params.prevEl === 'string' ? $(params.prevEl, slider.el) : params.prevEl;
    }

    // Auto-find by class if not specified
    if (!nextEl) nextEl = $('.drift-arrow--next', slider.el);
    if (!prevEl) prevEl = $('.drift-arrow--prev', slider.el);

    // Create if still not found and navigation is truthy
    if (!nextEl && params !== false) {
      nextEl = createElement('button', {
        className: 'drift-arrow drift-arrow--next',
        'aria-label': 'Next slide',
        type: 'button',
      });
      slider.el.appendChild(nextEl);
    }
    if (!prevEl && params !== false) {
      prevEl = createElement('button', {
        className: 'drift-arrow drift-arrow--prev',
        'aria-label': 'Previous slide',
        type: 'button',
      });
      slider.el.appendChild(prevEl);
    }

    if (prevEl && params.prevStyle) {
      Object.assign(prevEl.style, params.prevStyle);
    }
    if (nextEl && params.nextStyle) {
      Object.assign(nextEl.style, params.nextStyle);
    }

    if (nextEl) nextEl.addEventListener('click', onNextClick);
    if (prevEl) prevEl.addEventListener('click', onPrevClick);

    update();
  }

  function destroy() {
    if (nextEl) nextEl.removeEventListener('click', onNextClick);
    if (prevEl) prevEl.removeEventListener('click', onPrevClick);
    nextEl = null;
    prevEl = null;
  }

  on('init', init);
  on('slideChange', update);
  on('destroy', destroy);

  slider.navigation = { update, enable: init, disable: destroy };
}

function Pagination({ slider, extendParams, on }) {
  extendParams({
    pagination: {
      el: null,
      type: 'bullets',       // 'bullets' | 'fraction' | 'progressbar'
      clickable: true,
      bulletClass: 'drift-pagination__bullet',
      bulletActiveClass: 'drift-pagination__bullet--active',
      currentClass: 'drift-pagination__current',
      totalClass: 'drift-pagination__total',
      progressClass: 'drift-pagination__progress',
      renderBullet: null,     // (index, className) => string
      renderFraction: null,   // (currentClass, totalClass) => string
      renderProgressbar: null, // (progressClass) => string
      style: null,
      bulletStyle: null,
      bulletActiveStyle: null,
      progressStyle: null,
    },
  });

  let paginationEl = null;
  let bullets = [];

  function getTotalSlides() {
    if (slider.params.loop && slider._loopedSlides) {
      return slider.slides.length - slider._loopedSlides * 2;
    }
    return slider.snapGrid.length;
  }

  function renderBullets() {
    const params = slider.params.pagination;
    const total = getTotalSlides();
    let html = '';

    for (let i = 0; i < total; i++) {
      if (typeof params.renderBullet === 'function') {
        html += params.renderBullet(i, params.bulletClass);
      } else {
        html += `<span class="${params.bulletClass}" data-index="${i}" tabindex="0" role="button" aria-label="Go to slide ${i + 1}"></span>`;
      }
    }

    paginationEl.innerHTML = html;
    bullets = $$(`.${params.bulletClass}`, paginationEl);

    if (params.bulletStyle) {
      bullets.forEach((bullet) => {
        Object.assign(bullet.style, params.bulletStyle);
      });
    }

    if (params.clickable) {
      bullets.forEach((bullet) => {
        bullet.addEventListener('click', onBulletClick);
      });
    }
  }

  function renderFraction() {
    const params = slider.params.pagination;

    if (typeof params.renderFraction === 'function') {
      paginationEl.innerHTML = params.renderFraction(
        params.currentClass,
        params.totalClass
      );
    } else {
      paginationEl.innerHTML =
        `<span class="${params.currentClass}"></span>` +
        ' / ' +
        `<span class="${params.totalClass}"></span>`;
    }
  }

  function renderProgressbar() {
    const params = slider.params.pagination;

    if (typeof params.renderProgressbar === 'function') {
      paginationEl.innerHTML = params.renderProgressbar(params.progressClass);
    } else {
      paginationEl.innerHTML = `<span class="${params.progressClass}"></span>`;
    }

    if (params.progressStyle) {
      const progressEl = $(`.${params.progressClass}`, paginationEl);
      if (progressEl) {
        Object.assign(progressEl.style, params.progressStyle);
      }
    }
  }

  function update() {
    if (!paginationEl) return;

    const params = slider.params.pagination;
    const current = slider.realIndex;
    const total = getTotalSlides();

    if (params.type === 'bullets') {
      bullets.forEach((bullet, i) => {
        if (i === current) {
          addClass(bullet, params.bulletActiveClass);
          bullet.setAttribute('aria-current', 'true');
          if (params.bulletActiveStyle) {
            Object.assign(bullet.style, params.bulletActiveStyle);
          }
        } else {
          removeClass(bullet, params.bulletActiveClass);
          bullet.removeAttribute('aria-current');
          if (params.bulletActiveStyle && params.bulletStyle) {
            Object.assign(bullet.style, params.bulletStyle);
          } else if (params.bulletActiveStyle) {
            // Reset active styles to defaults
            Object.keys(params.bulletActiveStyle).forEach((key) => {
              bullet.style[key] = '';
            });
          }
        }
      });
    } else if (params.type === 'fraction') {
      const currentEl = $(`.${params.currentClass}`, paginationEl);
      const totalEl = $(`.${params.totalClass}`, paginationEl);
      if (currentEl) currentEl.textContent = current + 1;
      if (totalEl) totalEl.textContent = total;
    } else if (params.type === 'progressbar') {
      const progressEl = $(`.${params.progressClass}`, paginationEl);
      if (progressEl) {
        const progress = total > 1 ? current / (total - 1) : 1;
        progressEl.style.transform = `scaleX(${progress})`;
      }
    }
  }

  function onBulletClick(e) {
    const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
    if (isNaN(index)) return;

    if (slider.params.loop && slider._loopedSlides) {
      slider.slideTo(index + slider._loopedSlides);
    } else {
      slider.slideTo(index);
    }
  }

  function init() {
    const params = slider.params.pagination;
    if (!params) return;

    // Find element
    if (params.el) {
      paginationEl = typeof params.el === 'string' ? $(params.el, slider.el) : params.el;
    }
    if (!paginationEl) {
      paginationEl = $('.drift-pagination', slider.el);
    }
    if (!paginationEl) {
      paginationEl = createElement('div', { className: 'drift-pagination' });
      slider.el.appendChild(paginationEl);
    }

    if (params.style) {
      Object.assign(paginationEl.style, params.style);
    }

    // Add type class
    addClass(paginationEl, `drift-pagination--${params.type}`);

    // Set role
    paginationEl.setAttribute('role', 'tablist');
    paginationEl.setAttribute('aria-label', 'Slide pagination');

    // Render
    if (params.type === 'bullets') {
      renderBullets();
    } else if (params.type === 'fraction') {
      renderFraction();
    } else if (params.type === 'progressbar') {
      renderProgressbar();
    }

    update();
  }

  function destroy() {
    if (bullets.length) {
      bullets.forEach((bullet) => {
        bullet.removeEventListener('click', onBulletClick);
      });
    }
    bullets = [];
    paginationEl = null;
  }

  on('init', init);
  on('slideChange', update);
  on('destroy', destroy);

  slider.pagination = { update, render: init, el: paginationEl };
}

function Autoplay({ slider, extendParams, on }) {
  extendParams({
    autoplay: {
      enabled: false,
      delay: 3000,
      disableOnInteraction: true,
      pauseOnMouseEnter: true,
      stopOnLastSlide: false,
      reverseDirection: false,
    },
  });

  let timer = null;
  let paused = false;
  let running = false;

  function run() {
    if (slider.destroyed || !running) return;

    clearTimeout(timer);
    const params = slider.params.autoplay;

    timer = setTimeout(() => {
      if (slider.destroyed || paused || !running) return;

      if (params.stopOnLastSlide && slider.isEnd && !slider.params.loop) {
        stop();
        return;
      }

      if (params.reverseDirection) {
        slider.slidePrev(slider.params.speed);
      } else {
        slider.slideNext(slider.params.speed);
      }

      run();
    }, params.delay);
  }

  function start() {
    if (running) return;
    running = true;
    paused = false;
    run();
    slider.emit('autoplayStart', slider);
  }

  function stop() {
    if (!running) return;
    running = false;
    clearTimeout(timer);
    timer = null;
    slider.emit('autoplayStop', slider);
  }

  function pause() {
    if (!running || paused) return;
    paused = true;
    clearTimeout(timer);
    slider.emit('autoplayPause', slider);
  }

  function resume() {
    if (!running || !paused) return;
    paused = false;
    run();
    slider.emit('autoplayResume', slider);
  }

  function onMouseEnter() {
    if (slider.params.autoplay.pauseOnMouseEnter) {
      pause();
    }
  }

  function onMouseLeave() {
    if (slider.params.autoplay.pauseOnMouseEnter) {
      resume();
    }
  }

  function onTouchStart() {
    if (running) pause();
  }

  function onTouchEnd() {
    const params = slider.params.autoplay;
    if (params.disableOnInteraction) {
      stop();
    } else {
      resume();
    }
  }

  function init() {
    const params = slider.params.autoplay;
    if (!params || params === false || !params.enabled) return;

    slider.el.addEventListener('mouseenter', onMouseEnter);
    slider.el.addEventListener('mouseleave', onMouseLeave);

    start();
  }

  function destroy() {
    stop();
    slider.el.removeEventListener('mouseenter', onMouseEnter);
    slider.el.removeEventListener('mouseleave', onMouseLeave);
  }

  on('init', init);
  on('touchStart', onTouchStart);
  on('touchEnd', onTouchEnd);
  on('destroy', destroy);

  slider.autoplay = { start, stop, pause, resume, running: () => running };
}

function EffectFade({ slider, extendParams, on }) {
  extendParams({
    fadeEffect: {
      crossFade: true,
    },
  });

  function setOpacity() {
    const slides = slider.slides;
    const activeIdx = slider.activeIndex;
    const crossFade = slider.params.fadeEffect.crossFade;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];

      if (i === activeIdx) {
        slide.style.opacity = '1';
        slide.style.visibility = 'visible';
        slide.style.pointerEvents = 'auto';
      } else {
        slide.style.opacity = crossFade ? '0' : '0';
        slide.style.visibility = crossFade ? 'visible' : 'hidden';
        slide.style.pointerEvents = 'none';
      }
    }
  }

  function setupSlides() {
    const slides = slider.slides;

    // Measure the natural height of the first slide BEFORE making them absolute
    const firstSlide = slides[0];
    const slideHeight = firstSlide ? firstSlide.offsetHeight : 0;

    // Set explicit height on list so it doesn't collapse when children become absolute
    slider.listEl.style.position = 'relative';
    slider.listEl.style.height = `${slideHeight}px`;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.style.position = 'absolute';
      slide.style.top = '0';
      slide.style.left = '0';
      slide.style.width = '100%';
      slide.style.height = '100%';
      slide.style.transitionProperty = 'opacity, visibility';
      slide.style.transitionDuration = `${slider.params.speed}ms`;
    }
  }

  function init() {
    if (slider.params.effect !== 'fade') return;

    setupSlides();

    // Override setTranslate to prevent CSS transform movement
    // but preserve progress/boundary calculations
    slider.setTranslate.bind(slider);
    slider.setTranslate = function (translate) {
      // Update internal state (progress, isBeginning, isEnd) without moving the list
      slider.translate = translate;

      slider.progress = slider.maxTranslate === slider.minTranslate
        ? 0
        : (translate - slider.maxTranslate) /
          (slider.minTranslate - slider.maxTranslate);

      slider.isBeginning = translate >= slider.maxTranslate;
      slider.isEnd = translate <= slider.minTranslate;

      slider.emit('setTranslate', slider, translate);
      slider.emit('progress', slider, slider.progress);

      // Don't apply CSS transform — fade uses opacity
      setOpacity();
    };

    // Override setTransition to apply to slides instead of list
    slider.setTransition = function (duration) {
      for (const slide of slider.slides) {
        slide.style.transitionDuration = `${duration}ms`;
      }
      slider.emit('setTransition', slider, duration);
    };

    setOpacity();
  }

  function onSlideChange() {
    if (slider.params.effect !== 'fade') return;
    setOpacity();
  }

  function destroy() {
    for (const slide of slider.slides) {
      slide.style.opacity = '';
      slide.style.visibility = '';
      slide.style.pointerEvents = '';
      slide.style.position = '';
      slide.style.top = '';
      slide.style.left = '';
      slide.style.width = '';
      slide.style.height = '';
      slide.style.transitionProperty = '';
      slide.style.transitionDuration = '';
    }
  }

  on('init', init);
  on('slideChange', onSlideChange);
  on('destroy', destroy);
}

function Keyboard({ slider, extendParams, on }) {
  extendParams({
    keyboard: {
      enabled: false,
      onlyInViewport: true,
    },
  });

  function onKeyDown(e) {
    if (slider.destroyed || slider.isLocked) return;

    const params = slider.params.keyboard;
    if (!params || !params.enabled) return;

    // Check if in viewport
    if (params.onlyInViewport) {
      const rect = slider.el.getBoundingClientRect();
      const inViewport =
        rect.top < window.innerHeight &&
        rect.bottom > 0 &&
        rect.left < window.innerWidth &&
        rect.right > 0;
      if (!inViewport) return;
    }

    const isHorizontal = slider.params.direction === 'horizontal';

    switch (e.key) {
      case 'ArrowLeft':
        if (isHorizontal) {
          e.preventDefault();
          slider.slidePrev();
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          e.preventDefault();
          slider.slideNext();
        }
        break;
      case 'ArrowUp':
        if (!isHorizontal) {
          e.preventDefault();
          slider.slidePrev();
        }
        break;
      case 'ArrowDown':
        if (!isHorizontal) {
          e.preventDefault();
          slider.slideNext();
        }
        break;
      case 'Home':
        e.preventDefault();
        slider.slideTo(0);
        break;
      case 'End':
        e.preventDefault();
        slider.slideTo(slider.snapGrid.length - 1);
        break;
    }
  }

  function init() {
    const params = slider.params.keyboard;
    if (!params || !params.enabled) return;

    document.addEventListener('keydown', onKeyDown);
  }

  function destroy() {
    document.removeEventListener('keydown', onKeyDown);
  }

  on('init', init);
  on('destroy', destroy);

  slider.keyboard = { enable: init, disable: destroy };
}

function A11y({ slider, extendParams, on }) {
  extendParams({
    a11y: {
      enabled: true,
      prevSlideMessage: 'Previous slide',
      nextSlideMessage: 'Next slide',
      firstSlideMessage: 'This is the first slide',
      lastSlideMessage: 'This is the last slide',
      paginationBulletMessage: 'Go to slide {{index}}',
      containerMessage: null,
      containerRoleDescription: 'carousel',
      slideRole: 'group',
      slideRoleDescription: 'slide',
      liveRegion: true,
    },
  });

  let liveRegionEl = null;

  function initSlides() {
    const params = slider.params.a11y;
    const slides = slider.slides;

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      slide.setAttribute('role', params.slideRole);
      slide.setAttribute('aria-roledescription', params.slideRoleDescription);
      slide.setAttribute('aria-label', `${i + 1} / ${slides.length}`);
    }
  }

  function initContainer() {
    const params = slider.params.a11y;

    slider.el.setAttribute('role', 'region');
    slider.el.setAttribute('aria-roledescription', params.containerRoleDescription);

    if (params.containerMessage) {
      slider.el.setAttribute('aria-label', params.containerMessage);
    }

    // Tab index for keyboard focus
    slider.el.setAttribute('tabindex', '0');
  }

  function createLiveRegion() {
    const params = slider.params.a11y;
    if (!params.liveRegion) return;

    liveRegionEl = document.createElement('div');
    liveRegionEl.setAttribute('aria-live', 'polite');
    liveRegionEl.setAttribute('aria-atomic', 'true');
    liveRegionEl.className = 'drift-sr-only';
    liveRegionEl.style.cssText =
      'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    slider.el.appendChild(liveRegionEl);
  }

  function updateLiveRegion() {
    if (!liveRegionEl) return;

    const index = slider.realIndex + 1;
    const total = slider.params.loop && slider._loopedSlides
      ? slider.slides.length - slider._loopedSlides * 2
      : slider.snapGrid.length;

    liveRegionEl.textContent = `Slide ${index} of ${total}`;
  }

  function handleReducedMotion() {
    if (prefersReducedMotion()) {
      slider.params.speed = 0;
      if (slider.params.autoplay && slider.params.autoplay.enabled) {
        slider.params.autoplay.delay = Math.max(slider.params.autoplay.delay, 5000);
      }
    }
  }

  function updateAria() {
    const slides = slider.slides;
    const activeIdx = slider.activeIndex;

    for (let i = 0; i < slides.length; i++) {
      slides[i].setAttribute('aria-hidden', i !== activeIdx ? 'true' : 'false');
    }

    updateLiveRegion();
  }

  function init() {
    const params = slider.params.a11y;
    if (!params || !params.enabled) return;

    handleReducedMotion();
    initContainer();
    initSlides();
    createLiveRegion();
    updateAria();
  }

  function destroy() {
    if (liveRegionEl) {
      liveRegionEl.remove();
      liveRegionEl = null;
    }
  }

  on('init', init);
  on('slideChange', updateAria);
  on('destroy', destroy);

  slider.a11y = { updateAria, initSlides };
}

function EffectCoverflow({ slider, extendParams, on }) {
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

function EffectCards({ slider, extendParams, on }) {
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

function ScrollAos({ slider, extendParams, on }) {
  extendParams({
    scrollAos: {
      enabled: true,
      animation: 'fade-up',
      duration: 800,
      offset: 120,
      once: true,
      setContainerAos: false,
      slideAnimation: null,
      slideDelay: 100,
      refreshOnChange: true,
    },
  });

  const AOS_ATTRS = [
    'data-aos',
    'data-aos-duration',
    'data-aos-offset',
    'data-aos-once',
    'data-aos-delay',
  ];

  let containerAosWasSet = false;
  const slideAosIndexes = [];

  function getAOS() {
    if (typeof window !== 'undefined' && typeof window.AOS !== 'undefined') {
      return window.AOS;
    }
    return null;
  }

  function init() {
    const params = slider.params.scrollAos;
    if (!params || params.enabled === false) return;

    // Only set container data-aos if explicitly opted in
    if (params.setContainerAos && !slider.el.hasAttribute('data-aos')) {
      slider.el.setAttribute('data-aos', params.animation);
      slider.el.setAttribute('data-aos-duration', String(params.duration));
      slider.el.setAttribute('data-aos-offset', String(params.offset));
      slider.el.setAttribute('data-aos-once', String(params.once));
      containerAosWasSet = true;
    }

    // Per-slide AOS attributes
    if (params.slideAnimation) {
      for (let i = 0; i < slider.slides.length; i++) {
        const slide = slider.slides[i];
        slide.setAttribute('data-aos', params.slideAnimation);
        slide.setAttribute('data-aos-delay', String(i * params.slideDelay));
        slideAosIndexes.push(i);
      }
    }

    const aos = getAOS();
    if (aos) {
      aos.refresh();
    }
  }

  function onSlideChange() {
    const params = slider.params.scrollAos;
    if (!params || params.enabled === false) return;
    if (!params.refreshOnChange) return;

    const aos = getAOS();
    if (aos) {
      aos.refresh();
    }
  }

  function destroy() {
    // Only remove container attrs if we set them
    if (containerAosWasSet) {
      AOS_ATTRS.forEach(function (attr) {
        slider.el.removeAttribute(attr);
      });
      containerAosWasSet = false;
    }

    // Remove AOS attributes from slides we modified
    for (let i = 0; i < slideAosIndexes.length; i++) {
      const idx = slideAosIndexes[i];
      if (slider.slides[idx]) {
        AOS_ATTRS.forEach(function (attr) {
          slider.slides[idx].removeAttribute(attr);
        });
      }
    }
    slideAosIndexes.length = 0;
  }

  on('init', init);
  on('slideChange', onSlideChange);
  on('destroy', destroy);
}

export { A11y, Autoplay, DriftSlider, EffectCards, EffectCoverflow, EffectFade, Keyboard, Navigation, Pagination, ScrollAos, DriftSlider as default };
