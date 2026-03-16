import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import Navigation from '../../src/modules/navigation/navigation.js'

describe('module/navigation', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('creates prev/next buttons automatically', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    const prev = s.container.querySelector('.drift-arrow--prev')
    const next = s.container.querySelector('.drift-arrow--next')
    expect(prev).toBeTruthy()
    expect(next).toBeTruthy()
  })

  it('navigation buttons have aria-label', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    const prev = s.container.querySelector('.drift-arrow--prev')
    const next = s.container.querySelector('.drift-arrow--next')
    expect(prev.getAttribute('aria-label')).toBe('Previous slide')
    expect(next.getAttribute('aria-label')).toBe('Next slide')
  })

  it('clicking next advances slide', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    const next = s.container.querySelector('.drift-arrow--next')
    next.click()
    expect(s.slider.activeIndex).toBe(1)
  })

  it('clicking prev goes back', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    const prev = s.container.querySelector('.drift-arrow--prev')
    prev.click()
    expect(s.slider.activeIndex).toBe(1)
  })

  it('disables prev button at beginning', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    const prev = s.container.querySelector('.drift-arrow--prev')
    expect(prev.classList.contains('drift-arrow--disabled')).toBe(true)
  })

  it('slider.navigation object exists', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    expect(s.slider.navigation).toBeTruthy()
    expect(typeof s.slider.navigation.update).toBe('function')
  })

  it('in loop mode both buttons remain enabled', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { modules: [Navigation], loop: true } })
    cleanup = s.cleanup
    const prev = s.container.querySelector('.drift-arrow--prev')
    const next = s.container.querySelector('.drift-arrow--next')
    expect(prev.classList.contains('drift-arrow--disabled')).toBe(false)
    expect(next.classList.contains('drift-arrow--disabled')).toBe(false)
  })

  it('disables next button at end', () => {
    const s = createSlider({ slideCount: 3, sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    const next = s.container.querySelector('.drift-arrow--next')
    expect(next.classList.contains('drift-arrow--disabled')).toBe(true)
  })

  it('clicking next when isLocked does not navigate', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    s.slider.isLocked = true
    const next = s.container.querySelector('.drift-arrow--next')
    next.click()
    expect(s.slider.activeIndex).toBe(0)
  })

  it('clicking prev when isLocked does not navigate', () => {
    const s = createSlider({ sliderOptions: { modules: [Navigation] } })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    s.slider.isLocked = true
    const prev = s.container.querySelector('.drift-arrow--prev')
    prev.click()
    expect(s.slider.activeIndex).toBe(2)
  })

  it('prevStyle is applied to prev button', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Navigation],
        navigation: { prevStyle: { color: 'red' } },
      },
    })
    cleanup = s.cleanup
    const prev = s.container.querySelector('.drift-arrow--prev')
    expect(prev.style.color).toBe('red')
  })

  it('nextStyle is applied to next button', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Navigation],
        navigation: { nextStyle: { color: 'blue' } },
      },
    })
    cleanup = s.cleanup
    const next = s.container.querySelector('.drift-arrow--next')
    expect(next.style.color).toBe('blue')
  })
})
