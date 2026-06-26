import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { DriftSliderElement } from '../src/element';

beforeAll(() => {
  if (!customElements.get('drift-slider')) customElements.define('drift-slider', DriftSliderElement);
});
afterEach(() => { document.body.innerHTML = ''; });

function mount(html: string): DriftSliderElement {
  const el = document.createElement('drift-slider') as DriftSliderElement;
  el.innerHTML = html;
  document.body.appendChild(el);
  return el;
}

describe('scaffold generation', () => {
  it('wraps plain children into .drift-track>.drift-list and inits', async () => {
    const el = mount('<div id="keep">a</div><div>b</div>');
    await Promise.resolve();
    expect(el.querySelector(':scope > .drift-track > .drift-list')).toBeTruthy();
    expect(el.querySelectorAll('.drift-list > *').length).toBe(2);
    expect(el.querySelector('#keep')).toBeTruthy();           // author id preserved
    expect(el.instance).toBeTruthy();
  });

  it('is idempotent when a valid scaffold already exists', async () => {
    const el = mount('<div class="drift-track"><ul class="drift-list"><li>a</li></ul></div>');
    await Promise.resolve();
    expect(el.querySelectorAll(':scope > .drift-track').length).toBe(1);  // not double-wrapped
  });

  it('leaves <template> and <script> outside the list', async () => {
    const el = mount('<div>a</div><template>t</template>');
    await Promise.resolve();
    expect(el.querySelector('.drift-list > template')).toBeNull();
    expect(el.querySelector('template')).toBeTruthy();
  });

  it('restores focus if an author child was focused at upgrade', async () => {
    const el = mount('<button id="b">x</button>');
    el.querySelector<HTMLButtonElement>('#b')!.focus();
    await Promise.resolve();
    expect(document.activeElement).toBe(el.querySelector('#b'));
  });

  it('leaves <style> outside the list (SKIP set)', async () => {
    const el = mount('<div>a</div><style>.x{}</style>');
    await Promise.resolve();
    expect(el.querySelector('.drift-list > style')).toBeNull();
    expect(el.querySelector('style')).toBeTruthy();
  });

  it('dispatches drift:error and keeps _slider null when scaffold fails', async () => {
    const spy = vi.spyOn(Element.prototype, 'replaceChildren').mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const el = mount('<div>a</div>');
    let errorFired = false;
    el.addEventListener('drift:error', () => { errorFired = true; });
    await Promise.resolve();
    spy.mockRestore();
    expect(errorFired).toBe(true);
    expect(el.instance).toBeNull();
  });

  it('preserves relative order of skipped nodes after the track', async () => {
    const el = mount('<div>a</div><template id="t1"></template><script id="s1"></script>');
    await Promise.resolve();
    const children = Array.from(el.children);
    const trackIdx = children.findIndex(c => c.classList.contains('drift-track'));
    const t1Idx = children.findIndex(c => c.id === 't1');
    const s1Idx = children.findIndex(c => c.id === 's1');
    expect(trackIdx).toBeLessThan(t1Idx);
    expect(t1Idx).toBeLessThan(s1Idx);
  });
});
