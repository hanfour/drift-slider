export default {
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
