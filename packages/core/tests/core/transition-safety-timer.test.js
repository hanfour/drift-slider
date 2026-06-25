import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/transition – safety timer', () => {
  let cleanup

  afterEach(() => {
    cleanup?.()
    vi.useRealTimers()
  })

  it('forces transitionEnd when CSS transitionend does not fire', () => {
    vi.useFakeTimers()
    const s = createSlider()
    cleanup = s.cleanup

    s.slider.setTransition(300)
    s.slider.transitionStart()
    expect(s.slider.animating).toBe(true)

    // Advance past speed + 50ms buffer
    vi.advanceTimersByTime(351)
    expect(s.slider.animating).toBe(false)
  })

  it('does not double-fire when CSS transitionend fires before safety timer', () => {
    vi.useFakeTimers()
    const s = createSlider()
    cleanup = s.cleanup

    const handler = vi.fn()
    s.slider.on('slideChangeTransitionEnd', handler)

    s.slider.setTransition(300)
    s.slider.transitionStart()

    // Simulate CSS transitionend firing normally
    s.slider.onTransitionEnd()
    expect(handler).toHaveBeenCalledTimes(1)

    // Advance past safety timer
    vi.advanceTimersByTime(400)

    // Should not have fired again
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('does not fire safety timer when speed is 0', () => {
    vi.useFakeTimers()
    const s = createSlider()
    cleanup = s.cleanup

    s.slider.setTransition(0)
    s.slider.transitionStart()
    expect(s.slider.animating).toBe(true)

    // No safety timer for 0 speed
    vi.advanceTimersByTime(100)
    // Still animating (no timer to force end)
    expect(s.slider.animating).toBe(true)
  })

  it('clears safety timer when transitionEnd is called manually', () => {
    vi.useFakeTimers()
    const s = createSlider()
    cleanup = s.cleanup

    s.slider.setTransition(300)
    s.slider.transitionStart()

    // Manually call transitionEnd
    s.slider.transitionEnd()
    expect(s.slider.animating).toBe(false)

    const handler = vi.fn()
    s.slider.on('slideChangeTransitionEnd', handler)

    // Advance past safety timer
    vi.advanceTimersByTime(400)
    // Should not fire again
    expect(handler).not.toHaveBeenCalled()
  })
})
