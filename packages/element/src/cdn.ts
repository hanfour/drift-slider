import * as modules from 'drift-slider/modules';
import { DriftSliderElement } from './element';
import { registerModules } from './registry';
import './with-css';

registerModules(modules as unknown as Record<string, import('drift-slider').DriftSliderModule>);

if (typeof customElements !== 'undefined' && !customElements.get('drift-slider')) {
  customElements.define('drift-slider', DriftSliderElement);
}
