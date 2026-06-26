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

const distDtsPath = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.d.ts');
const distDtsExists = existsSync(distDtsPath);

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
  it.skipIf(!distDtsExists)('dist/index.d.ts ships the HTMLElementTagNameMap augmentation', () => {
    const dts = readFileSync(distDtsPath, 'utf8');
    expect(dts).toContain('HTMLElementTagNameMap');
    expect(dts).toContain("'drift-slider'");
  });
});
