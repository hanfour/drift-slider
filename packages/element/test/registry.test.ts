import { describe, it, expect, vi, afterEach } from 'vitest';
import { Navigation, EffectFade } from 'drift-slider/modules';
import { registerModules, resolveModuleNames, moduleForEffect, clearRegistry } from '../src/registry';

afterEach(() => clearRegistry());

describe('module registry', () => {
  it('resolves registered names case/separator-insensitively', () => {
    registerModules({ Navigation, EffectFade });
    expect(resolveModuleNames(['navigation'])).toEqual([Navigation]);
    expect(resolveModuleNames(['Navigation', 'effect-fade'])).toEqual([Navigation, EffectFade]);
  });

  it('warns and skips unknown names', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveModuleNames(['nope'])).toEqual([]);
    expect(warn).toHaveBeenCalledWith('DriftSlider: unknown module "nope", ignoring');
    warn.mockRestore();
  });

  it('maps an effect name to its module', () => {
    registerModules({ EffectFade });
    expect(moduleForEffect('fade')).toBe(EffectFade);
    expect(moduleForEffect('nonesuch')).toBeUndefined();
  });
});
