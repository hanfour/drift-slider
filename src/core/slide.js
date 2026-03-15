import { clamp } from '../shared/utils.js';

export default function slideModule({ slider }) {
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
