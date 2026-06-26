import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

// Markup with a valid pre-built scaffold (Task 5 makes this optional).
function mountWithScaffold(): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  el.innerHTML = `<div class="drift-track"><ul class="drift-list">
    <li class="drift-slide">a</li><li class="drift-slide">b</li></ul></div>`;
  document.body.appendChild(el);
  return el;
}

describe('element lifecycle', () => {
  it('initialises a core instance one microtask after connect', async () => {
    const el = mountWithScaffold();
    expect(el.instance).toBeNull();           // not yet (deferred)
    await Promise.resolve();                    // flush microtask
    expect(el.instance).toBeTruthy();
    expect(el.instance!.destroyed).toBe(false);
  });

  it('destroys the instance on disconnect', async () => {
    const el = mountWithScaffold();
    await Promise.resolve();
    const inst = el.instance!;
    el.remove();
    expect(inst.destroyed).toBe(true);
    expect(el.instance).toBeNull();
  });

  it('cancels a pending init if disconnected before the microtask flush', async () => {
    const el = mountWithScaffold();
    el.remove();                                // disconnect before flush
    await Promise.resolve();
    expect(el.instance).toBeNull();
  });
});
