import DriftSlider from '../drift-slider.js';
import { Navigation, Pagination, Autoplay, EffectFade, Keyboard, A11y } from '../modules/index.js';

// All modules auto-loaded for jQuery interface
const allModules = [Navigation, Pagination, Autoplay, EffectFade, Keyboard, A11y];

(function ($) {
  if (!$ || !$.fn) return;

  function getInstance(el) {
    return el.driftSlider || $.data(el, 'driftSlider');
  }

  $.fn.driftSlider = function (options, ...args) {
    // Method invocation: $el.driftSlider('slideNext', ...args)
    if (typeof options === 'string') {
      const method = options;
      let result;
      this.each(function () {
        const instance = getInstance(this);
        if (!instance || typeof instance[method] !== 'function') return;

        const ret = instance[method](...args);
        // Capture the first non-instance return value (getters); method calls
        // that return the instance itself stay chainable.
        if (result === undefined && ret !== instance) {
          result = ret;
        }
        if (method === 'destroy') {
          $.removeData(this, 'driftSlider');
        }
      });
      return result !== undefined ? result : this;
    }

    return this.each(function () {
      // Destroy existing instance
      if (getInstance(this)) {
        getInstance(this).destroy();
        $.removeData(this, 'driftSlider');
      }

      // Normalize shorthand options
      const opts = $.extend({}, options);

      // Auto-include all modules
      opts.modules = allModules.concat(opts.modules || []);

      // Navigation shorthand: true => auto-find elements
      if (opts.navigation === true) {
        opts.navigation = {};
      }

      // Pagination shorthand: true => bullets
      if (opts.pagination === true) {
        opts.pagination = { type: 'bullets' };
      }

      // Autoplay shorthand: true => enabled
      if (opts.autoplay === true) {
        opts.autoplay = { enabled: true };
      }

      // Keyboard shorthand: true => enabled
      if (opts.keyboard === true) {
        opts.keyboard = { enabled: true };
      }

      const instance = new DriftSlider(this, opts);

      // Store instance via jQuery data
      $.data(this, 'driftSlider', instance);
    });
  };

  // Static access
  $.fn.driftSlider.Constructor = DriftSlider;

})(typeof jQuery !== 'undefined' ? jQuery : typeof $ !== 'undefined' ? $ : undefined);

export default DriftSlider;
