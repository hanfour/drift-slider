import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest'

/**
 * Minimal jQuery stub exposing only the surface the plugin uses:
 * a callable collection factory, `.fn`, `.each`, `.extend`, `.data`, `.removeData`.
 */
function makeJQuery() {
  const dataStore = new WeakMap()

  function jq(selectorOrEl) {
    let els
    if (typeof selectorOrEl === 'string') {
      els = Array.from(document.querySelectorAll(selectorOrEl))
    } else if (selectorOrEl instanceof Element) {
      els = [selectorOrEl]
    } else {
      els = Array.from(selectorOrEl || [])
    }
    const coll = Object.create(jq.fn)
    coll._els = els
    coll.length = els.length
    els.forEach((el, i) => { coll[i] = el })
    return coll
  }

  jq.fn = {
    each(fn) {
      this._els.forEach((el, i) => fn.call(el, i, el))
      return this
    },
  }
  jq.extend = Object.assign
  jq.data = (el, key, val) => {
    let m = dataStore.get(el)
    if (val === undefined) return m ? m[key] : undefined
    if (!m) { m = {}; dataStore.set(el, m) }
    m[key] = val
    return val
  }
  jq.removeData = (el, key) => {
    const m = dataStore.get(el)
    if (m) delete m[key]
  }
  return jq
}

let $

beforeAll(async () => {
  $ = makeJQuery()
  globalThis.jQuery = $
  await import('../src/jquery/jquery-plugin.js')
})

function buildSliderDOM({ slideCount = 5, width = 800, height = 400 } = {}) {
  const container = document.createElement('section')
  container.className = 'drift-slider'
  const track = document.createElement('div')
  track.className = 'drift-track'
  const list = document.createElement('ul')
  list.className = 'drift-list'
  for (let i = 0; i < slideCount; i++) {
    const slide = document.createElement('li')
    slide.className = 'drift-slide'
    list.appendChild(slide)
  }
  track.appendChild(list)
  container.appendChild(track)
  document.body.appendChild(container)

  Object.defineProperty(container, 'clientWidth', { value: width, configurable: true })
  Object.defineProperty(container, 'clientHeight', { value: height, configurable: true })

  const original = window.getComputedStyle
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
    const real = original(el)
    return new Proxy(real, {
      get(t, p) {
        if (p === 'transform' || p === 'webkitTransform') {
          return el.style.transform || 'matrix(1, 0, 0, 1, 0, 0)'
        }
        if (String(p).startsWith('margin')) return '0px'
        return t[p]
      },
    })
  })

  return { container }
}

describe('jQuery plugin', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  it('registers $.fn.driftSlider', () => {
    expect(typeof $.fn.driftSlider).toBe('function')
  })

  it('initializes an instance and stores it via $.data', () => {
    const { container } = buildSliderDOM()
    $('.drift-slider').driftSlider({})
    expect($.data(container, 'driftSlider')).toBe(container.driftSlider)
    expect(container.driftSlider).toBeTruthy()
  })

  it('proxies method calls to the instance instead of re-initializing', () => {
    const { container } = buildSliderDOM()
    $('.drift-slider').driftSlider({})
    const instance = container.driftSlider
    const spy = vi.spyOn(instance, 'slideNext')

    $('.drift-slider').driftSlider('slideNext')

    expect(spy).toHaveBeenCalled()
    // The same instance must remain — a method call must not destroy + recreate it.
    expect(container.driftSlider).toBe(instance)
  })

  it('clears $.data on destroy via the plugin', () => {
    const { container } = buildSliderDOM()
    $('.drift-slider').driftSlider({})
    expect($.data(container, 'driftSlider')).toBeTruthy()

    $('.drift-slider').driftSlider('destroy')

    expect($.data(container, 'driftSlider')).toBeUndefined()
  })
})
