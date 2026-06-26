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

describe('imperative API', () => {
  it('delegates navigation to the core and reflects activeIndex', async () => {
    const el = mount();
    await Promise.resolve();
    el.slideNext(0);
    expect(el.activeIndex).toBe(1);
    el.slideTo(2, 0);
    expect(el.activeIndex).toBe(2);
    el.slidePrev(0);
    expect(el.activeIndex).toBe(1);
  });

  it('guards methods when not initialised', () => {
    const el = document.createElement('drift-slider') as DriftSliderElement;
    expect(() => el.slideNext(0)).not.toThrow();
    expect(el.slideNext(0)).toBeUndefined();
    expect(el.activeIndex).toBe(-1);
  });

  it('destroy() tears down without removing from the DOM', async () => {
    const el = mount();
    await Promise.resolve();
    el.destroy();
    expect(el.instance).toBeNull();
    expect(el.isConnected).toBe(true);
  });
});
