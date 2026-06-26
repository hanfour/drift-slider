import type { DriftSliderElement } from './element';

declare global {
  interface HTMLElementTagNameMap {
    'drift-slider': DriftSliderElement;
  }
}

type DriftSliderAttributes = {
  config?: string;
  modules?: string;
  loop?: boolean | '';
  'slides-per-view'?: number | string;
  'space-between'?: number | string;
  effect?: string;
  direction?: 'horizontal' | 'vertical';
  speed?: number | string;
  'initial-slide'?: number | string;
  'centered-slides'?: boolean | '';
  navigation?: boolean | '';
  pagination?: boolean | '';
  keyboard?: boolean | '';
  autoplay?: boolean | '';
  // common HTML attributes
  id?: string;
  class?: string;
  style?: string;
  children?: unknown;
  ref?: unknown;
};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'drift-slider': DriftSliderAttributes;
    }
  }
}

export {};
