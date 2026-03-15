export default function translateModule({ slider }) {
  function setTranslate(translate) {
    const isHorizontal = slider.params.direction === 'horizontal';
    const x = isHorizontal ? translate : 0;
    const y = isHorizontal ? 0 : translate;

    slider.listEl.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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

  function getTranslate() {
    return slider.translate || 0;
  }

  slider.setTranslate = setTranslate;
  slider.getTranslate = getTranslate;
}
