export default function Autoplay({ slider, extendParams, on }) {
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
