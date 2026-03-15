import defaults from './defaults.js';
import eventsEmitter from './events-emitter.js';
import { deepMerge, deepMergeDefaults, uniqueId } from './shared/utils.js';
import { $, $$ } from './shared/dom.js';

// Core modules
import updateModule from './core/update.js';
import translateModule from './core/translate.js';
import transitionModule from './core/transition.js';
import slideModule from './core/slide.js';
import classesModule from './core/classes.js';
import eventsModule from './core/events.js';
import grabCursorModule from './core/grab-cursor.js';
import touchModule from './core/touch.js';
import loopModule from './core/loop.js';
import breakpointsModule from './core/breakpoints.js';

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

export default DriftSlider;
