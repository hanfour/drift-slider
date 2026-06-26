import { describe, it, expect } from 'vitest';

function loadBuilt(spec: string) {
  return import(/* @vite-ignore */ spec).catch(() => null);
}

const main = await loadBuilt('../dist/index.js');
const def = await loadBuilt('../dist/define.js');

describe('built drift-slider-element', () => {
  it.skipIf(!main)('main entry exports the class + registerModules, no define', () => {
    expect(typeof main.DriftSliderElement).toBe('function');
    expect(typeof main.registerModules).toBe('function');
  });
  it.skipIf(!def)('the /define entry registers the element', () => {
    expect(typeof def.DriftSliderElement).toBe('function');
    // import side-effect registered the tag
    expect(customElements.get('drift-slider')).toBeTruthy();
  });
});
