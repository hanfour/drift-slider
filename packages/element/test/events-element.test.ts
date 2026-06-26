import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

function mount(): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  el.innerHTML = '<div>a</div><div>b</div><div>c</div>';
  document.body.appendChild(el);
  return el;
}

describe('events re-dispatch', () => {
  it('fires drift:init with a serializable detail', async () => {
    const el = mount();
    const seen: CustomEvent[] = [];
    el.addEventListener('drift:init', (e) => seen.push(e as CustomEvent));
    await Promise.resolve();
    expect(seen.length).toBe(1);
    expect(seen[0].bubbles).toBe(true);
    expect(seen[0].composed).toBe(false);
    expect(typeof seen[0].detail.activeIndex).toBe('number');
    expect(seen[0].detail.slider).toBeUndefined();  // not the raw instance
  });

  it('fires drift:slidechange on navigation', async () => {
    const el = mount();
    await Promise.resolve();
    const seen: CustomEvent[] = [];
    el.addEventListener('drift:slidechange', (e) => seen.push(e as CustomEvent));
    el.instance!.slideNext(0);
    expect(seen.length).toBeGreaterThan(0);
    expect(seen[0].detail.activeIndex).toBe(1);
  });
});
