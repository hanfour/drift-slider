import { describe, it, expect, beforeAll, afterEach } from 'vitest';
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
});
