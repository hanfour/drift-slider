import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

function mount(attrs: Record<string, string>): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.innerHTML = '<div>a</div><div>b</div><div>c</div>';
  document.body.appendChild(el);
  return el;
}

describe('config resolution', () => {
  it('applies option attributes to the core options', async () => {
    const el = mount({ loop: '', 'slides-per-view': '2' });
    await Promise.resolve();
    expect(el.instance!.params.loop).toBe(true);
    expect(el.instance!.params.slidesPerView).toBe(2);
  });

  it('parses the JSON config attribute as the base', async () => {
    const el = mount({ config: '{"speed":800}' });
    await Promise.resolve();
    expect(el.instance!.params.speed).toBe(800);
  });

  it('lets the .config property win over a conflicting attribute', async () => {
    const el = mount({ 'slides-per-view': '2' });
    el.config = { slidesPerView: 4 };
    await Promise.resolve();
    expect(el.instance!.params.slidesPerView).toBe(4);
  });

  it('re-inits once for several attribute changes in a tick', async () => {
    const el = mount({});
    await Promise.resolve();
    const first = el.instance;
    el.setAttribute('loop', '');
    el.setAttribute('speed', '500');
    await Promise.resolve();
    expect(el.instance).not.toBe(first);          // re-initialised
    expect(el.instance!.params.loop).toBe(true);
    expect(el.instance!.params.speed).toBe(500);
  });
});
