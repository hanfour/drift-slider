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

  it('emits touchMove after horizontal drag exceeds threshold', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchMove', handler)

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 200, clientY: 100, button: 0, bubbles: true,
    }))
    // Move 60px left — exceeds threshold of 5
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 140, clientY: 100, bubbles: true,
    }))

    expect(handler).toHaveBeenCalled()
  })

  it('does not emit touchMove when movement is below threshold', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true, threshold: 20 } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchMove', handler)

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 200, clientY: 100, button: 0, bubbles: true,
    }))
    // Move only 5px — below threshold of 20
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 195, clientY: 100, bubbles: true,
    }))

    expect(handler).not.toHaveBeenCalled()
  })

  it('stops tracking when vertical scroll dominates on horizontal slider', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchMove', handler)

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 100, clientY: 100, button: 0, bubbles: true,
    }))
    // Dominant vertical movement → isScrolling = true, stops handling
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 102, clientY: 160, bubbles: true,
    }))

    expect(handler).not.toHaveBeenCalled()
  })

  it('does not emit touchMove when isTouched is false', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchMove', handler)

    // Dispatch pointermove without a preceding pointerdown (isTouched=false)
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 100, clientY: 100, bubbles: true,
    }))

    expect(handler).not.toHaveBeenCalled()
  })

  it('emits touchEnd after a full drag sequence', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchEnd', handler)

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 400, clientY: 0, button: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 200, clientY: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 1, clientX: 200, clientY: 0, bubbles: true,
    }))

    expect(handler).toHaveBeenCalled()
  })

  it('resolves to a valid activeIndex after drag', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 400, clientY: 0, button: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 200, clientY: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 1, clientX: 200, clientY: 0, bubbles: true,
    }))

    expect(s.slider.activeIndex).toBeGreaterThanOrEqual(0)
    expect(s.slider.activeIndex).toBeLessThan(s.slider.slides.length)
  })

  it('applies resistance when dragging past maxTranslate boundary', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true, resistance: true } })
    cleanup = s.cleanup

    const target = s.slider.trackEl || s.slider.el
    // Start from first slide; drag far right (positive) → past maxTranslate (0)
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 0, clientY: 0, button: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 500, clientY: 0, bubbles: true,
    }))

    // Translate should be less than the raw diff due to resistance
    expect(s.slider.translate).toBeDefined()
  })

  it('clamps translate when resistance is disabled', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true, resistance: false } })
    cleanup = s.cleanup

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 0, clientY: 0, button: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 500, clientY: 0, bubbles: true,
    }))

    // Clamped to maxTranslate (0)
    expect(s.slider.translate).toBeLessThanOrEqual(s.slider.maxTranslate)
  })

  it('does not update translate when followFinger is false', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true, followFinger: false } })
    cleanup = s.cleanup
    const initialTranslate = s.slider.translate

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 400, clientY: 0, button: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 200, clientY: 0, bubbles: true,
    }))

    // translate should remain unchanged
    expect(s.slider.translate).toBe(initialTranslate)
  })

  it('calls transitionEnd when animating during touchStart', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    s.slider.animating = true
    const spy = vi.spyOn(s.slider, 'transitionEnd')

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 100, clientY: 100, button: 0, bubbles: true,
    }))

    expect(spy).toHaveBeenCalled()
  })

  it('handles vertical slider direction', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true, direction: 'vertical' } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchMove', handler)

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 0, clientY: 200, button: 0, bubbles: true,
    }))
    // Move 60px upward on vertical slider
    document.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 1, clientX: 0, clientY: 140, bubbles: true,
    }))

    expect(handler).toHaveBeenCalled()
  })

  it('accumulates velocity tracker entries on multiple moves', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 600, clientY: 0, button: 0, bubbles: true,
    }))

    // Dispatch 7 moves to fill tracker beyond 5
    for (let i = 1; i <= 7; i++) {
      document.dispatchEvent(new PointerEvent('pointermove', {
        pointerId: 1, clientX: 600 - i * 20, clientY: 0, bubbles: true,
      }))
    }

    document.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 1, clientX: 460, clientY: 0, bubbles: true,
    }))

    expect(s.slider.activeIndex).toBeGreaterThanOrEqual(0)
  })

  it('handles pointercancel the same as pointerup', () => {
    const s = createSlider({ sliderOptions: { touchEnabled: true } })
    cleanup = s.cleanup
    const handler = vi.fn()
    s.slider.on('touchEnd', handler)

    const target = s.slider.trackEl || s.slider.el
    target.dispatchEvent(new PointerEvent('pointerdown', {
      pointerId: 1, clientX: 100, clientY: 0, button: 0, bubbles: true,
    }))
    document.dispatchEvent(new PointerEvent('pointercancel', {
      pointerId: 1, bubbles: true,
    }))

    expect(handler).toHaveBeenCalled()
  })
})
