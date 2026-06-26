import { describe, it, expect } from 'vitest';
import { coerceAttr, attrToOption, OBSERVED_ATTRIBUTES, MODULE_ATTRS } from '../src/attributes';

describe('attribute coercion', () => {
  it('treats boolean attrs by presence, with the Angular "false" string guard', () => {
    expect(coerceAttr('loop', '')).toBe(true);     // <drift-slider loop>
    expect(coerceAttr('loop', 'false')).toBe(false); // [loop]="false" -> "false"
    expect(coerceAttr('loop', null)).toBe(false);    // absent
  });

  it('coerces number attrs, dropping NaN', () => {
    expect(coerceAttr('slides-per-view', '3')).toBe(3);
    expect(coerceAttr('space-between', '12.5')).toBe(12.5);
    expect(coerceAttr('speed', 'abc')).toBeUndefined();
  });

  it('passes string enums through', () => {
    expect(coerceAttr('direction', 'vertical')).toBe('vertical');
    expect(coerceAttr('effect', 'fade')).toBe('fade');
  });

  it('maps kebab attr names to camelCase option keys', () => {
    expect(attrToOption('slides-per-view')).toBe('slidesPerView');
    expect(attrToOption('loop')).toBe('loop');
  });

  it('lists module-toggle attrs and the full observed set', () => {
    expect(MODULE_ATTRS).toMatchObject({ navigation: 'navigation', pagination: 'pagination', keyboard: 'keyboard', autoplay: 'autoplay' });
    expect(OBSERVED_ATTRIBUTES).toContain('config');
    expect(OBSERVED_ATTRIBUTES).toContain('modules');
  });
});
