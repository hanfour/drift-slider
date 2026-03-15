let passiveSupported = null;

export function supportsPassive() {
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

export function supportsTouchEvents() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

export function supportsPointerEvents() {
  return !!window.PointerEvent;
}

export function supportsScrollSnap() {
  return 'scrollSnapType' in document.documentElement.style;
}

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function passiveListener() {
  return supportsPassive() ? { passive: true } : false;
}

export function activeListener() {
  return supportsPassive() ? { passive: false } : false;
}
