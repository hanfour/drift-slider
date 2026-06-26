import type { DriftSliderElement } from '../src/element';

// HTMLElementTagNameMap augmentation resolves the element type
const el = document.createElement('drift-slider');
const _check: DriftSliderElement = el;
void _check;
// methods are typed
el.slideNext(0);
const _idx: number = el.activeIndex;
void _idx;
