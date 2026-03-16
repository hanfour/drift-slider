import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/events', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('attaches resize listener on init', () => {
    const spy = vi.spyOn(window, 'addEventListener')
    const s = createSlider()
    cleanup = s.cleanup
    const resizeCall = spy.mock.calls.find((c) => c[0] === 'resize')
    expect(resizeCall).toBeTruthy()
    spy.mockRestore()
  })

  it('detaches resize listener on destroy', () => {
    const spy = vi.spyOn(window, 'removeEventListener')
    const s = createSlider()
    s.slider.destroy()
    cleanup = () => s.container.remove()
    const resizeCall = spy.mock.calls.find((c) => c[0] === 'resize')
    expect(resizeCall).toBeTruthy()
    spy.mockRestore()
  })

  it('attaches transitionend listener on list element', () => {
    const s = createSlider()
    cleanup = s.cleanup
    const spy = vi.spyOn(s.slider, 'onTransitionEnd')
    s.slider.animating = true
    const event = new TransitionEvent('transitionend', {
      propertyName: 'transform',
      bubbles: false,
    })
    s.slider.listEl.dispatchEvent(event)
    expect(spy).toHaveBeenCalled()
  })

  it('handles resize event with debounce', async () => {
    vi.useFakeTimers()
    const s = createSlider()
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('resize', handler)
    window.dispatchEvent(new Event('resize'))
    expect(handler).not.toHaveBeenCalled()
    vi.advanceTimersByTime(250)
    expect(handler).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('onListTransitionEnd ignores transitionend from non-list elements', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.animating = true
    const spy = vi.spyOn(s.slider, 'onTransitionEnd')

    // Dispatch transitionend from a child element (e.target !== listEl)
    const child = document.createElement('span')
    s.slider.listEl.appendChild(child)
    child.dispatchEvent(new Event('transitionend', { bubbles: true }))

    expect(spy).not.toHaveBeenCalled()
  })

  it('onListTransitionEnd ignores non-transform property transitions', () => {
    const s = createSlider()
    cleanup = s.cleanup
    const spy = vi.spyOn(s.slider, 'onTransitionEnd')

    const event = new TransitionEvent('transitionend', {
      propertyName: 'opacity',
      bubbles: false,
    })
    s.slider.listEl.dispatchEvent(event)

    expect(spy).not.toHaveBeenCalled()
  })

  it('onListTransitionEnd calls onTransitionEnd for transform transitions', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.animating = true
    const spy = vi.spyOn(s.slider, 'onTransitionEnd')

    const event = new TransitionEvent('transitionend', {
      propertyName: 'transform',
      bubbles: false,
    })
    s.slider.listEl.dispatchEvent(event)

    expect(spy).toHaveBeenCalled()
  })

  it('detachEvents is safe to call when resizeHandler was never set', () => {
    const s = createSlider()
    cleanup = s.cleanup
    // destroy already calls detachEvents; calling again should not throw
    expect(() => s.slider.detachEvents()).not.toThrow()
  })
})
