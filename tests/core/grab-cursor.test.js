import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/grab-cursor', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('sets grab cursor when enabled', () => {
    const s = createSlider({ sliderOptions: { grabCursor: true } })
    cleanup = s.cleanup
    const el = s.slider.trackEl || s.slider.el
    expect(el.style.cursor).toBe('grab')
  })

  it('does not set cursor when disabled', () => {
    const s = createSlider({ sliderOptions: { grabCursor: false } })
    cleanup = s.cleanup
    const el = s.slider.trackEl || s.slider.el
    expect(el.style.cursor).toBe('')
  })

  it('sets grabbing cursor when moving=true', () => {
    const s = createSlider({ sliderOptions: { grabCursor: true } })
    cleanup = s.cleanup
    s.slider.setGrabCursor(true)
    const el = s.slider.trackEl || s.slider.el
    expect(el.style.cursor).toBe('grabbing')
  })

  it('unsetGrabCursor clears cursor', () => {
    const s = createSlider({ sliderOptions: { grabCursor: true } })
    cleanup = s.cleanup
    s.slider.unsetGrabCursor()
    const el = s.slider.trackEl || s.slider.el
    expect(el.style.cursor).toBe('')
  })
})
