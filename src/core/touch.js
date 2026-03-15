import { now, clamp } from '../shared/utils.js';
import { supportsTouchEvents, supportsPointerEvents, passiveListener, activeListener } from '../shared/support.js';

export default function touchModule({ slider }) {
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
