import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/transition', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('setTransition sets transition-duration', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.setTransition(400)
    expect(s.slider.listEl.style.transitionDuration).toBe('400ms')
  })

  it('transitionStart sets animating to true', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.transitionStart()
    expect(s.slider.animating).toBe(true)
  })

  it('transitionEnd sets animating to false', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.transitionStart()
    s.slider.transitionEnd()
    expect(s.slider.animating).toBe(false)
  })

  it('transitionEnd resets transition duration to 0', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.setTransition(400)
    s.slider.transitionStart()
    s.slider.transitionEnd()
    expect(s.slider.listEl.style.transitionDuration).toBe('0ms')
  })

  it('emits slideChangeTransitionEnd on transitionEnd', () => {
    const s = createSlider()
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('slideChangeTransitionEnd', handler)
    s.slider.transitionStart()
    s.slider.transitionEnd()
    expect(handler).toHaveBeenCalled()
  })
})
