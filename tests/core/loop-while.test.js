import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/loop – while-loop loopFix (loopedSlides > totalOriginal)', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('handles loopedSlides > totalOriginal by jumping multiple times', () => {
    // 3 slides with loopAdditionalSlides=3 → cloneCount = 1 + 3 = 4
    // totalOriginal = 3, loopedSlides = 4
    // So loopedSlides (4) > totalOriginal (3)
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { loop: true, loopAdditionalSlides: 3 },
    })
    cleanup = s.cleanup

    const looped = s.slider._loopedSlides
    const totalOriginal = s.slider.slides.length - looped * 2

    // Verify the edge case condition
    expect(looped).toBeGreaterThan(totalOriginal)

    // Force activeIndex past the end clone range (double-wrap scenario)
    s.slider.activeIndex = totalOriginal + looped + totalOriginal
    s.slider.loopFix()

    // Should have wrapped back into valid range
    expect(s.slider.activeIndex).toBeGreaterThanOrEqual(looped)
    expect(s.slider.activeIndex).toBeLessThan(totalOriginal + looped)
  })

  it('handles activeIndex deeply in prepend clone range', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { loop: true, loopAdditionalSlides: 3 },
    })
    cleanup = s.cleanup

    const looped = s.slider._loopedSlides
    const totalOriginal = s.slider.slides.length - looped * 2

    // Force activeIndex far below loopedSlides
    s.slider.activeIndex = 0
    s.slider.loopFix()

    // Should have jumped forward into valid range
    expect(s.slider.activeIndex).toBeGreaterThanOrEqual(looped)
    expect(s.slider.activeIndex).toBeLessThan(totalOriginal + looped)
  })

  it('does nothing when activeIndex is already in valid range', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: { loop: true },
    })
    cleanup = s.cleanup

    const looped = s.slider._loopedSlides
    const origIndex = looped + 1
    s.slider.activeIndex = origIndex
    s.slider.loopFix()

    expect(s.slider.activeIndex).toBe(origIndex)
  })
})
