import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';
import { registerModules, clearRegistry } from '../src/registry';
import { Navigation, Pagination, EffectFade } from 'drift-slider/modules';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; clearRegistry(); });

function mount(attrs: Record<string, string>): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = '<div>a</div><div>b</div>';
  document.body.appendChild(el);
  return el;
}

describe('modules wiring', () => {
  it('resolves the modules attribute via the registry', async () => {
    registerModules({ Navigation, Pagination });
    const el = mount({ modules: 'navigation pagination' });
    await Promise.resolve();
    expect(el.instance!.params.modules).toEqual(expect.arrayContaining([Navigation, Pagination]));
  });

  it('treats boolean module attrs as toggles', async () => {
    registerModules({ Navigation });
    const el = mount({ navigation: '' });
    await Promise.resolve();
    expect(el.instance!.params.modules).toContain(Navigation);
  });

  it('auto-wires the effect module', async () => {
    registerModules({ EffectFade });
    const el = mount({ effect: 'fade' });
    await Promise.resolve();
    expect(el.instance!.params.modules).toContain(EffectFade);
  });

  it('merges and dedupes the .modules property with attribute sources', async () => {
    registerModules({ Navigation });
    const el = mount({ navigation: '' });
    el.modules = [Navigation];
    await Promise.resolve();
    const mods = el.instance!.params.modules as unknown[];
    expect(mods.filter((m) => m === Navigation).length).toBe(1);
  });
});
