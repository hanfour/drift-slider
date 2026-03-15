declare module 'drift-slider' {
  export interface PhysicsOptions {
    friction?: number;
    attraction?: number;
    bounceRate?: number;
  }

  export interface NavigationOptions {
    nextEl?: string | HTMLElement | null;
    prevEl?: string | HTMLElement | null;
    disabledClass?: string;
    hiddenClass?: string;
    prevStyle?: Partial<CSSStyleDeclaration> | null;
    nextStyle?: Partial<CSSStyleDeclaration> | null;
  }

  export interface PaginationOptions {
    el?: string | HTMLElement | null;
    type?: 'bullets' | 'fraction' | 'progressbar';
    clickable?: boolean;
    bulletClass?: string;
    bulletActiveClass?: string;
    currentClass?: string;
    totalClass?: string;
    progressClass?: string;
    renderBullet?: (index: number, className: string) => string;
    renderFraction?: (currentClass: string, totalClass: string) => string;
    renderProgressbar?: (progressClass: string) => string;
    style?: Partial<CSSStyleDeclaration> | null;
    bulletStyle?: Partial<CSSStyleDeclaration> | null;
    bulletActiveStyle?: Partial<CSSStyleDeclaration> | null;
    progressStyle?: Partial<CSSStyleDeclaration> | null;
  }

  export interface AutoplayOptions {
    enabled?: boolean;
    delay?: number;
    disableOnInteraction?: boolean;
    pauseOnMouseEnter?: boolean;
    stopOnLastSlide?: boolean;
    reverseDirection?: boolean;
  }

  export interface KeyboardOptions {
    enabled?: boolean;
    onlyInViewport?: boolean;
  }

  export interface A11yOptions {
    enabled?: boolean;
    prevSlideMessage?: string;
    nextSlideMessage?: string;
    firstSlideMessage?: string;
    lastSlideMessage?: string;
    paginationBulletMessage?: string;
    containerMessage?: string | null;
    containerRoleDescription?: string;
    slideRole?: string;
    slideRoleDescription?: string;
    liveRegion?: boolean;
  }

  export interface FadeEffectOptions {
    crossFade?: boolean;
  }

  export interface CardsEffectOptions {
    mode?: 'stack' | 'diagonal' | 'flip';
    direction?: 'tl-br' | 'bl-tr' | 'tr-bl' | 'br-tl' | 'auto';
    offsetX?: number;
    offsetY?: number;
    scale?: number;
    opacity?: number;
    diagonalMultiplier?: number;
    flipAxis?: 'Y' | 'X';
    overlay?: boolean;
    overlayColor?: string;
    shadow?: boolean;
    shadowColor?: string;
    shadowBlur?: number;
  }

  export interface ScrollAosOptions {
    enabled?: boolean;
    animation?: string;
    duration?: number;
    offset?: number;
    once?: boolean;
    setContainerAos?: boolean;
    slideAnimation?: string | null;
    slideDelay?: number;
    refreshOnChange?: boolean;
  }

  export interface CoverflowEffectOptions {
    depth?: number;
    rotate?: number;
    scale?: number;
    stretch?: number;
    modifier?: number;
    overlay?: boolean;
    overlayColor?: string;
    opacity?: number;
    activeOpacity?: number;
    align?: 'center' | 'bottom' | 'top';
    fillCenter?: boolean;
    cropSides?: boolean;
    staggerY?: number;
    visibleSides?: 'both' | 'prev' | 'next';
  }

  export interface BreakpointOptions {
    slidesPerView?: number;
    spaceBetween?: number;
    slidesPerGroup?: number;
    centeredSlides?: boolean;
    loop?: boolean;
    speed?: number;
    grabCursor?: boolean;
  }

  export type DriftSliderModule = (context: ModuleContext) => void;

  export interface ModuleContext {
    slider: DriftSlider;
    extendParams: (params: Record<string, any>) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    once: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler: (...args: any[]) => void) => void;
    emit: (event: string, ...args: any[]) => void;
  }

  export interface DriftSliderEvents {
    init: (slider: DriftSlider) => void;
    destroy: (slider: DriftSlider) => void;
    beforeDestroy: (slider: DriftSlider) => void;
    slideChange: (slider: DriftSlider) => void;
    slideChangeTransitionStart: (slider: DriftSlider) => void;
    slideChangeTransitionEnd: (slider: DriftSlider) => void;
    touchStart: (slider: DriftSlider, event: Event) => void;
    touchMove: (slider: DriftSlider, event: Event) => void;
    touchEnd: (slider: DriftSlider, event: Event) => void;
    progress: (slider: DriftSlider, progress: number) => void;
    reachBeginning: (slider: DriftSlider) => void;
    reachEnd: (slider: DriftSlider) => void;
    resize: (slider: DriftSlider) => void;
    breakpoint: (slider: DriftSlider, breakpoint: number | null) => void;
    setTranslate: (slider: DriftSlider, translate: number) => void;
    setTransition: (slider: DriftSlider, duration: number) => void;
    update: (slider: DriftSlider) => void;
    autoplayStart: (slider: DriftSlider) => void;
    autoplayStop: (slider: DriftSlider) => void;
    autoplayPause: (slider: DriftSlider) => void;
    autoplayResume: (slider: DriftSlider) => void;
  }

  export interface DriftSliderOptions {
    direction?: 'horizontal' | 'vertical';
    slidesPerView?: number;
    spaceBetween?: number;
    centeredSlides?: boolean;
    slidesPerGroup?: number;
    speed?: number;
    easing?: string;
    physics?: PhysicsOptions;
    touchEnabled?: boolean;
    threshold?: number;
    touchAngle?: number;
    shortSwipes?: boolean;
    longSwipesRatio?: number;
    followFinger?: boolean;
    resistance?: boolean;
    resistanceRatio?: number;
    loop?: boolean;
    loopAdditionalSlides?: number;
    autoplay?: boolean | AutoplayOptions;
    navigation?: boolean | NavigationOptions;
    pagination?: boolean | PaginationOptions;
    keyboard?: boolean | KeyboardOptions;
    a11y?: boolean | A11yOptions;
    effect?: 'slide' | 'fade' | 'coverflow' | 'cards';
    fadeEffect?: FadeEffectOptions;
    cardsEffect?: CardsEffectOptions;
    coverflowEffect?: CoverflowEffectOptions;
    scrollAos?: boolean | ScrollAosOptions;
    breakpoints?: Record<number, BreakpointOptions> | null;
    initialSlide?: number;
    grabCursor?: boolean;
    watchOverflow?: boolean;
    modules?: DriftSliderModule[];
    on?: Partial<DriftSliderEvents>;

    // CSS classes
    containerClass?: string;
    trackClass?: string;
    listClass?: string;
    slideClass?: string;
    slideActiveClass?: string;
    slidePrevClass?: string;
    slideNextClass?: string;
    slideVisibleClass?: string;
    slideCloneClass?: string;
  }

  export class DriftSlider {
    constructor(el: string | HTMLElement, options?: DriftSliderOptions);

    // Properties
    el: HTMLElement;
    trackEl: HTMLElement;
    listEl: HTMLElement;
    slides: HTMLElement[];
    params: DriftSliderOptions;
    activeIndex: number;
    realIndex: number;
    previousIndex: number;
    progress: number;
    isBeginning: boolean;
    isEnd: boolean;
    isLocked: boolean;
    animating: boolean;
    translate: number;
    snapGrid: number[];
    slidesGrid: number[];
    containerSize: number;
    slideSize: number;
    maxTranslate: number;
    minTranslate: number;
    destroyed: boolean;
    id: string;

    // Navigation
    navigation?: {
      update: () => void;
      enable: () => void;
      disable: () => void;
    };

    // Pagination
    pagination?: {
      update: () => void;
      render: () => void;
      el: HTMLElement | null;
    };

    // Autoplay
    autoplay?: {
      start: () => void;
      stop: () => void;
      pause: () => void;
      resume: () => void;
      running: () => boolean;
    };

    // Keyboard
    keyboard?: {
      enable: () => void;
      disable: () => void;
    };

    // Methods
    slideTo(index: number, speed?: number, runCallbacks?: boolean): DriftSlider;
    slideNext(speed?: number, runCallbacks?: boolean): DriftSlider;
    slidePrev(speed?: number, runCallbacks?: boolean): DriftSlider;
    slideToClosest(speed?: number): DriftSlider;
    update(): void;
    destroy(cleanStyles?: boolean): void;
    enable(): void;
    disable(): void;

    // Events
    on<K extends keyof DriftSliderEvents>(event: K, handler: DriftSliderEvents[K]): DriftSlider;
    on(event: string, handler: (...args: any[]) => void): DriftSlider;
    once(event: string, handler: (...args: any[]) => void): DriftSlider;
    off(event: string, handler?: (...args: any[]) => void): DriftSlider;
    emit(event: string, ...args: any[]): DriftSlider;

    // Static
    static use(modules: DriftSliderModule | DriftSliderModule[]): void;
  }

  // Module exports
  export const Navigation: DriftSliderModule;
  export const Pagination: DriftSliderModule;
  export const Autoplay: DriftSliderModule;
  export const EffectFade: DriftSliderModule;
  export const EffectCoverflow: DriftSliderModule;
  export const EffectCards: DriftSliderModule;
  export const Keyboard: DriftSliderModule;
  export const A11y: DriftSliderModule;
  export const ScrollAos: DriftSliderModule;

  export default DriftSlider;
}

// jQuery plugin augmentation
interface JQuery {
  driftSlider(options?: import('drift-slider').DriftSliderOptions): JQuery;
}
