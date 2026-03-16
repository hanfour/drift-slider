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

    it('returns slider when destroyed', () => {
      const s = createSlider()
      cleanup = s.cleanup
      s.slider.destroy()
      const result = s.slider.slideTo(1, 0)
      expect(result).toBe(s.slider)
    })

    it('returns slider when snapGrid is empty', () => {
      const s = createSlider()
      cleanup = s.cleanup
      s.slider.snapGrid = []
      const result = s.slider.slideTo(1, 0)
      expect(result).toBe(s.slider)
    })

    it('emits reachBeginning when sliding to first slide', () => {
      const s = createSlider()
      cleanup = s.cleanup
      const handler = vi.fn()
      s.slider.on('reachBeginning', handler)
      s.slider.slideTo(2, 0)
      s.slider.slideTo(0, 0)
      expect(handler).toHaveBeenCalled()
    })

    it('emits reachEnd when sliding to last slide', () => {
      const s = createSlider({ slideCount: 3 })
      cleanup = s.cleanup
      const handler = vi.fn()
      s.slider.on('reachEnd', handler)
      s.slider.slideTo(2, 0)
      expect(handler).toHaveBeenCalled()
    })

    it('sets realIndex in loop mode', () => {
      const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
      cleanup = s.cleanup
      const looped = s.slider._loopedSlides
      s.slider.slideTo(looped + 1, 0)
      expect(s.slider.realIndex).toBe(1)
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

    it('in loop mode advances without clamping to snapGrid length', () => {
      const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
      cleanup = s.cleanup
      const initialIndex = s.slider.activeIndex
      s.slider.slideNext(0)
      // Should have moved forward
      expect(s.slider.activeIndex).toBeGreaterThanOrEqual(initialIndex)
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

    it('in loop mode calls loopFix when at index 0', () => {
      const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
      cleanup = s.cleanup
      const loopFixSpy = vi.spyOn(s.slider, 'loopFix')
      s.slider.activeIndex = 0
      s.slider.slidePrev(0)
      expect(loopFixSpy).toHaveBeenCalled()
    })
  })

  describe('slideToClosest', () => {
    it('slides to nearest snap point', () => {
      const s = createSlider({ slideCount: 5 })
      cleanup = s.cleanup
      // Manually set translate between slides 1 and 2
      const snap1 = s.slider.snapGrid[1]
      const snap2 = s.slider.snapGrid[2]
      const midpoint = -(snap1 + snap2) / 2
      s.slider.setTranslate(midpoint - 10)
      s.slider.slideToClosest(0)
      // Should snap to slide 1 or 2 (whichever is closer)
      expect([1, 2]).toContain(s.slider.activeIndex)
    })

    it('returns slider for chaining', () => {
      const s = createSlider()
      cleanup = s.cleanup
      const result = s.slider.slideToClosest(0)
      expect(result).toBe(s.slider)
    })

    it('snaps to index 0 when at beginning', () => {
      const s = createSlider({ slideCount: 3 })
      cleanup = s.cleanup
      s.slider.setTranslate(0)
      s.slider.slideToClosest(0)
      expect(s.slider.activeIndex).toBe(0)
    })
  })
})
