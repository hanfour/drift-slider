import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import Thumbs from '../../src/modules/thumbs/thumbs.js'

describe('module/thumbs', () => {
  let cleanup1, cleanup2

  afterEach(() => { cleanup1?.(); cleanup2?.() })

  it('does nothing when thumbs config is not provided', () => {
    const s = createSlider({ sliderOptions: { modules: [Thumbs] } })
    cleanup1 = s.cleanup
    expect(s.slider).toBeTruthy()
  })

  it('adds active class to thumb matching active slide', () => {
    const thumbs = createSlider({ slideCount: 5 })
    cleanup1 = thumbs.cleanup
    const main = createSlider({
      slideCount: 5,
      sliderOptions: { modules: [Thumbs], thumbs: { slider: thumbs.slider, slideThumbActiveClass: 'drift-thumb--active' } },
    })
    cleanup2 = main.cleanup
    expect(thumbs.slider.slides[0].classList.contains('drift-thumb--active')).toBe(true)
  })

  it('updates thumb active class on slideChange', () => {
    const thumbs = createSlider({ slideCount: 5 })
    cleanup1 = thumbs.cleanup
    const main = createSlider({
      slideCount: 5,
      sliderOptions: { modules: [Thumbs], thumbs: { slider: thumbs.slider } },
    })
    cleanup2 = main.cleanup
    main.slider.slideTo(2, 0)
    expect(thumbs.slider.slides[2].classList.contains('drift-thumb--active')).toBe(true)
    expect(thumbs.slider.slides[0].classList.contains('drift-thumb--active')).toBe(false)
  })

  it('clicking thumb navigates main slider', () => {
    const thumbs = createSlider({ slideCount: 5 })
    cleanup1 = thumbs.cleanup
    const main = createSlider({
      slideCount: 5,
      sliderOptions: { modules: [Thumbs], thumbs: { slider: thumbs.slider } },
    })
    cleanup2 = main.cleanup
    thumbs.slider.slides[3].click()
    expect(main.slider.activeIndex).toBe(3)
  })

  it('destroy removes click listeners and active classes', () => {
    const thumbs = createSlider({ slideCount: 5 })
    cleanup1 = thumbs.cleanup
    const main = createSlider({
      slideCount: 5,
      sliderOptions: { modules: [Thumbs], thumbs: { slider: thumbs.slider } },
    })
    main.slider.destroy()
    main.container.remove()
    vi.restoreAllMocks()
    expect(thumbs.slider.slides[0].classList.contains('drift-thumb--active')).toBe(false)
  })

  it('default activeClass is drift-thumb--active', () => {
    const thumbs = createSlider({ slideCount: 3 })
    cleanup1 = thumbs.cleanup
    const main = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [Thumbs], thumbs: { slider: thumbs.slider } },
    })
    cleanup2 = main.cleanup
    expect(thumbs.slider.slides[0].classList.contains('drift-thumb--active')).toBe(true)
  })
})
