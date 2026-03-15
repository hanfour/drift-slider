import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/slide', () => {
  let cleanup

  afterEach(() => cleanup?.())

  describe('slideTo', () => {
    it('slides to the given index', () => {
      const s = createSlider()
      cleanup = s.cleanup
      s.slider.slideTo(2, 0)
      expect(s.slider.activeIndex).toBe(2)
    })

    it('clamps index to valid range', () => {
      const s = createSlider({ slideCount: 3 })
      cleanup = s.cleanup
      s.slider.slideTo(10, 0)
      expect(s.slider.activeIndex).toBe(2)
    })

    it('clamps negative index to 0', () => {
      const s = createSlider()
      cleanup = s.cleanup
      s.slider.slideTo(-1, 0)
      expect(s.slider.activeIndex).toBe(0)
    })

    it('updates translate value', () => {
      const s = createSlider({ containerWidth: 800 })
      cleanup = s.cleanup
      s.slider.slideTo(1, 0)
      expect(s.slider.translate).toBe(-s.slider.snapGrid[1])
    })

    it('emits slideChange when index differs', () => {
      const s = createSlider()
      cleanup = s.cleanup
      const handler = vi.fn()
      s.slider.on('slideChange', handler)
      s.slider.slideTo(2, 0)
      expect(handler).toHaveBeenCalled()
    })

    it('does not emit slideChange when same index', () => {
      const s = createSlider()
      cleanup = s.cleanup
      // Already at 0, slide to 0
      const handler = vi.fn()
      s.slider.on('slideChange', handler)
      s.slider.slideTo(0, 0)
      expect(handler).not.toHaveBeenCalled()
    })

    it('returns slider for chaining', () => {
      const s = createSlider()
      cleanup = s.cleanup
      const result = s.slider.slideTo(1, 0)
      expect(result).toBe(s.slider)
    })
  })

  describe('slideNext', () => {
    it('advances by slidesPerGroup', () => {
      const s = createSlider()
      cleanup = s.cleanup
      s.slider.slideNext(0)
      expect(s.slider.activeIndex).toBe(1)
    })

    it('does not exceed last slide', () => {
      const s = createSlider({ slideCount: 3 })
      cleanup = s.cleanup
      s.slider.slideTo(2, 0)
      s.slider.slideNext(0)
      expect(s.slider.activeIndex).toBe(2)
    })
  })

  describe('slidePrev', () => {
    it('goes to previous slide', () => {
      const s = createSlider()
      cleanup = s.cleanup
      s.slider.slideTo(2, 0)
      s.slider.slidePrev(0)
      expect(s.slider.activeIndex).toBe(1)
    })

    it('does not go below 0', () => {
      const s = createSlider()
      cleanup = s.cleanup
      s.slider.slidePrev(0)
      expect(s.slider.activeIndex).toBe(0)
    })
  })
})
