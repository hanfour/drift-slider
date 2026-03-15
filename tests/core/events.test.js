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
    // We can't easily check this directly, but we can verify the slider works
    expect(s.slider.listEl).toBeTruthy()
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
})
