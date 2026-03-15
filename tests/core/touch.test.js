import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/touch', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('attachTouchEvents is a function', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(typeof s.slider.attachTouchEvents).toBe('function')
  })

  it('detachTouchEvents is a function', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(typeof s.slider.detachTouchEvents).toBe('function')
  })

  it('emits touchStart on pointerdown', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchStart', handler)

    const target = s.slider.trackEl || s.slider.el
    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 0,
      bubbles: true,
    })
    target.dispatchEvent(event)

    expect(handler).toHaveBeenCalled()
  })

  it('does not respond when destroyed', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.destroy()
    const handler = vi.fn()
    s.slider.on('touchStart', handler)

    const target = s.slider.trackEl || s.slider.el
    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 0,
      bubbles: true,
    })
    target.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('does not respond when locked', () => {
    const s = createSlider({ slideCount: 1 })
    cleanup = s.cleanup
    // With 1 slide, slider is locked
    const handler = vi.fn()
    s.slider.on('touchStart', handler)

    const target = s.slider.trackEl || s.slider.el
    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 0,
      bubbles: true,
    })
    target.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('ignores non-primary mouse button', () => {
    const s = createSlider()
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchStart', handler)

    const target = s.slider.trackEl || s.slider.el
    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 2, // right click
      bubbles: true,
    })
    target.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('does not respond when touchEnabled is false', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: false } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchStart', handler)

    const target = s.slider.trackEl || s.slider.el
    const event = new PointerEvent('pointerdown', {
      pointerId: 1,
      clientX: 100,
      clientY: 100,
      button: 0,
      bubbles: true,
    })
    target.dispatchEvent(event)

    expect(handler).not.toHaveBeenCalled()
  })

  it('emits touchEnd on pointerup', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchEnd', handler)

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 100, clientY: 100, button: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 1, clientX: 100, clientY: 100, bubbles: true,
    }))

    expect(handler).toHaveBeenCalled()
  })

  it('detachTouchEvents does not throw', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(() => s.slider.detachTouchEvents()).not.toThrow()
  })

  it('handles touchEnabled toggle via disable/enable', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.disable()
    expect(s.slider.params.touchEnabled).toBe(false)
    s.slider.enable()
    expect(s.slider.params.touchEnabled).toBe(true)
  })
})
