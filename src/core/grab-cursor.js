export default function grabCursorModule({ slider }) {
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
