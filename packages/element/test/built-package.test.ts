import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

function loadBuilt(spec: string) {
  return import(/* @vite-ignore */ spec).catch(() => null);
}

const main = await loadBuilt('../dist/index.js');
const def = await loadBuilt('../dist/define.js');

const distIndexPath = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.js');
const distIndexExists = existsSync(distIndexPath);

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
  it.skipIf(!distIndexExists)('ESM index.js does not contain customElements (opt-in registration contract)', () => {
    const src = readFileSync(distIndexPath, 'utf8');
    expect(src).not.toContain('customElements');
  });
});
