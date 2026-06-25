import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/classes', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('adds initialized class to container', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--initialized')).toBe(true)
  })

  it('adds horizontal direction class by default', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--horizontal')).toBe(true)
  })

  it('adds vertical direction class', () => {
    const s = createSlider({ sliderOptions: { direction: 'vertical' } })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--vertical')).toBe(true)
  })

  it('marks active slide', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.slider.slides[0].classList.contains('drift-slide--active')).toBe(true)
  })

  it('marks next slide', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.slider.slides[1].classList.contains('drift-slide--next')).toBe(true)
  })

  it('updates classes after slideTo', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    expect(s.slider.slides[2].classList.contains('drift-slide--active')).toBe(true)
    expect(s.slider.slides[1].classList.contains('drift-slide--prev')).toBe(true)
    expect(s.slider.slides[3].classList.contains('drift-slide--next')).toBe(true)
  })

  it('marks the correct active slide with slidesPerGroup > 1', () => {
    const s = createSlider({ slideCount: 9, sliderOptions: { slidesPerView: 3, slidesPerGroup: 3 } })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0) // page 1 → first slide of group is slide index 3
    expect(s.slider.slides[3].classList.contains('drift-slide--active')).toBe(true)
  })

  it('marks the active group as visible with slidesPerGroup > 1', () => {
    const s = createSlider({ slideCount: 9, sliderOptions: { slidesPerView: 3, slidesPerGroup: 3 } })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    expect(s.slider.slides[3].classList.contains('drift-slide--visible')).toBe(true)
    expect(s.slider.slides[4].classList.contains('drift-slide--visible')).toBe(true)
    expect(s.slider.slides[5].classList.contains('drift-slide--visible')).toBe(true)
  })
})
