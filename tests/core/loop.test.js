import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/loop', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('does nothing when loop is false', () => {
    const s = createSlider({ slideCount: 3 })
    cleanup = s.cleanup
    expect(s.slider._loopedSlides).toBeUndefined()
  })

  it('creates cloned slides when loop is true', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    // With slidesPerView=1, cloneCount=1, so 3 original + 2 clones = 5
    expect(s.slider.slides.length).toBeGreaterThan(3)
  })

  it('sets _loopedSlides', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    expect(s.slider._loopedSlides).toBeGreaterThan(0)
  })

  it('clone slides have clone class', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    const clones = s.slider.listEl.querySelectorAll('.drift-slide--clone')
    expect(clones.length).toBeGreaterThan(0)
  })

  it('destroyLoop removes cloned slides', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    s.slider.destroyLoop()
    const clones = s.slider.listEl.querySelectorAll('.drift-slide--clone')
    expect(clones.length).toBe(0)
  })

  it('_getRealIndex maps clone index to real index', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    const looped = s.slider._loopedSlides
    expect(s.slider._getRealIndex(looped)).toBe(0)
    expect(s.slider._getRealIndex(looped + 1)).toBe(1)
    expect(s.slider._getRealIndex(looped + 2)).toBe(2)
  })

  it('_getRealIndex returns index directly when no loop', () => {
    const s = createSlider({ slideCount: 3 })
    cleanup = s.cleanup
    expect(s.slider._getRealIndex(2)).toBe(2)
  })

  it('loopAdditionalSlides increases clone count', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: { loop: true, loopAdditionalSlides: 2 },
    })
    cleanup = s.cleanup
    // cloneCount = perView(1) + additional(2) = 3
    expect(s.slider._loopedSlides).toBe(3)
  })

  it('loopFix does nothing when loop is false', () => {
    const s = createSlider({ slideCount: 3 })
    cleanup = s.cleanup
    const origIndex = s.slider.activeIndex
    s.slider.loopFix()
    expect(s.slider.activeIndex).toBe(origIndex)
  })

  it('loopFix does nothing when _loopedSlides is 0', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    const origIndex = s.slider.activeIndex
    s.slider._loopedSlides = 0
    s.slider.loopFix()
    expect(s.slider.activeIndex).toBe(origIndex)
  })

  it('loopFix jumps forward when navigating past end of real slides', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    const looped = s.slider._loopedSlides

    // Navigate to the last real slide, then advance past it
    s.slider.slideTo(looped + 2, 0) // last real slide
    s.slider.slideNext(0) // enters end clone region
    s.slider.loopFix()

    // Should have wrapped back to the beginning of real slides
    expect(s.slider.activeIndex).toBe(looped)
  })

  it('loopFix jumps back when navigating before start of real slides', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    const looped = s.slider._loopedSlides

    // Navigate to the first real slide, then go back into start clone region
    s.slider.slideTo(looped, 0) // first real slide
    s.slider.slidePrev(0) // enters start clone region
    s.slider.loopFix()

    // Should have wrapped to the end of real slides area
    expect(s.slider.activeIndex).toBeGreaterThanOrEqual(looped)
  })

  it('_getRealIndex handles negative modulo (index before looped offset)', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { loop: true } })
    cleanup = s.cleanup
    // Index 0 is before looped offset, gives negative modulo
    const result = s.slider._getRealIndex(0)
    expect(result).toBeGreaterThanOrEqual(0)
    expect(result).toBeLessThan(3)
  })
})
