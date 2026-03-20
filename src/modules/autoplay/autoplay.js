export default function Autoplay({ slider, extendParams, on }) {
  extendParams({
    autoplay: {
      enabled: false,
      delay: 3000,
      disableOnInteraction: true,
      pauseOnMouseEnter: true,
      stopOnLastSlide: false,
      reverseDirection: false,
      ticker: false,
      tickerSpeed: 1,
    },
  });

  let timer = null;
  let paused = false;
  let running = false;

  // Ticker state
  let _tickerRafId = null;
  let _tickerCurrentSpeed = 0;
  let _tickerTargetSpeed = 0;
  let _tickerLastTime = 0;

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

  function getTickerBaseSpeed() {
    const params = slider.params.autoplay;
    const speed = slider.params.speed || 3000;
    let baseSpeed = (slider.slideSize || 300) / speed * (params.tickerSpeed || 1);
    if (params.reverseDirection) baseSpeed = -baseSpeed;
    return baseSpeed;
  }

  function tickerStart() {
    const baseSpeed = getTickerBaseSpeed();
    _tickerTargetSpeed = baseSpeed;
    _tickerCurrentSpeed = baseSpeed;
    _tickerLastTime = performance.now();
    slider.listEl.style.transitionProperty = 'none';
    _tickerRafId = requestAnimationFrame(tickerTick);
  }

  function tickerTick(now) {
    if (slider.destroyed || !running) return;

    let elapsed = now - _tickerLastTime;
    if (elapsed > 100) elapsed = 100;

    _tickerCurrentSpeed += (_tickerTargetSpeed - _tickerCurrentSpeed) * 0.1;

    const delta = _tickerCurrentSpeed * elapsed;
    let newTranslate = slider.translate - delta;

    if (slider.params.loop) {
      slider.setTranslate(newTranslate);
      slider.loopFix();
    } else {
      const min = typeof slider.minTranslate === 'function' ? slider.minTranslate() : 0;
      const max = typeof slider.maxTranslate === 'function' ? slider.maxTranslate() : -Infinity;
      if (newTranslate > min) {
        newTranslate = min;
        _tickerTargetSpeed = -Math.abs(_tickerTargetSpeed);
      } else if (newTranslate < max) {
        newTranslate = max;
        _tickerTargetSpeed = Math.abs(_tickerTargetSpeed);
      }
      slider.setTranslate(newTranslate);
    }

    _tickerLastTime = now;
    _tickerRafId = requestAnimationFrame(tickerTick);
  }

  function tickerStop() {
    cancelAnimationFrame(_tickerRafId);
    _tickerRafId = null;
  }

  function tickerPause() {
    _tickerTargetSpeed = 0;
  }

  function tickerResume() {
    _tickerTargetSpeed = getTickerBaseSpeed();
  }

  function start() {
    if (running) return;
    running = true;
    paused = false;
    const params = slider.params.autoplay;
    if (params.ticker) {
      tickerStart();
    } else {
      run();
    }
    slider.emit('autoplayStart', slider);
  }

  function stop() {
    if (!running) return;
    running = false;
    const params = slider.params.autoplay;
    if (params.ticker) {
      tickerStop();
    }
    clearTimeout(timer);
    timer = null;
    slider.emit('autoplayStop', slider);
  }

  function pause() {
    if (!running || paused) return;
    paused = true;
    const params = slider.params.autoplay;
    if (params.ticker) {
      tickerPause();
    } else {
      clearTimeout(timer);
    }
    slider.emit('autoplayPause', slider);
  }

  function resume() {
    if (!running || !paused) return;
    paused = false;
    const params = slider.params.autoplay;
    if (params.ticker) {
      tickerResume();
    } else {
      run();
    }
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

    if (params.ticker) {
      slider.listEl.style.transitionProperty = 'none';
      tickerStart();
      slider.emit('autoplayStart', slider);
      running = true;
      return;
    }

    start();
  }

  function destroy() {
    stop();
    tickerStop();
    slider.el.removeEventListener('mouseenter', onMouseEnter);
    slider.el.removeEventListener('mouseleave', onMouseLeave);
  }

  on('init', init);
  on('touchStart', onTouchStart);
  on('touchEnd', onTouchEnd);
  on('destroy', destroy);

  slider.autoplay = { start, stop, pause, resume, running: () => running };
}
