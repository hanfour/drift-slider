import { DriftSliderElement } from './element';

if (typeof customElements !== 'undefined' && !customElements.get('drift-slider')) {
  customElements.define('drift-slider', DriftSliderElement);
}

export { DriftSliderElement, registerModules } from './index';
