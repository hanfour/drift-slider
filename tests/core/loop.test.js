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
})
