export default function translateModule({ slider }) {
  /**
   * Update progress, isBeginning, isEnd and emit events.
   * Shared by core setTranslate and effect overrides (coverflow, showcase)
   * to avoid duplicating this logic.
   */
  function updateProgress(translate) {
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

  function setTranslate(translate) {
    const isHorizontal = slider.params.direction === 'horizontal';
    const x = isHorizontal ? translate : 0;
    const y = isHorizontal ? 0 : translate;

    slider.listEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    updateProgress(translate);
  }

  function getTranslate() {
    return slider.translate ?? 0;
  }

  /**
   * Read the current visual translate from the DOM computed style.
   * Crucial for mid-transition interruption: slider.translate holds the
   * transition TARGET, but the element may be frozen at an intermediate
   * position after setTransition(0).
   */
  function getComputedTranslate() {
    const style = window.getComputedStyle(slider.listEl);
    const transform = style.transform || style.webkitTransform;
    if (!transform || transform === 'none') return slider.translate ?? 0;

    const isHorizontal = slider.params.direction === 'horizontal';
    const m3d = transform.match(/matrix3d\((.+)\)/);
    if (m3d) {
      const v = m3d[1].split(',');
      return parseFloat(v[isHorizontal ? 12 : 13]);
    }
    const m2d = transform.match(/matrix\((.+)\)/);
    if (m2d) {
      const v = m2d[1].split(',');
      return parseFloat(v[isHorizontal ? 4 : 5]);
    }
    return slider.translate ?? 0;
  }

  slider.setTranslate = setTranslate;
  slider.getTranslate = getTranslate;
  slider.getComputedTranslate = getComputedTranslate;
  slider.updateProgress = updateProgress;
}
