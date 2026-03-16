import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import A11y from '../../src/modules/a11y/a11y.js'

describe('module/a11y', () => {
  let cleanup

  beforeEach(() => {
    // jsdom does not implement matchMedia; provide a default stub
    if (!window.matchMedia) {
      window.matchMedia = vi.fn().mockReturnValue({ matches: false })
    }
  })

  afterEach(() => {
    cleanup?.()
    vi.restoreAllMocks()
    // Reset matchMedia mock so it doesn't bleed across test files
    window.matchMedia = undefined
  })

  it('sets role="region" on container', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(s.container.getAttribute('role')).toBe('region')
  })

  it('sets aria-roledescription="carousel" on container', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(s.container.getAttribute('aria-roledescription')).toBe('carousel')
  })

  it('sets tabindex="0" on container', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(s.container.getAttribute('tabindex')).toBe('0')
  })

  it('sets aria-label on container when containerMessage is set', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [A11y],
        a11y: { containerMessage: 'Image gallery' },
      },
    })
    cleanup = s.cleanup
    expect(s.container.getAttribute('aria-label')).toBe('Image gallery')
  })

  it('does not set aria-label when containerMessage is null', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(s.container.hasAttribute('aria-label')).toBe(false)
  })

  it('sets role="group" on each slide', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    s.slider.slides.forEach((slide) => {
      expect(slide.getAttribute('role')).toBe('group')
    })
  })

  it('sets aria-roledescription="slide" on each slide', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    s.slider.slides.forEach((slide) => {
      expect(slide.getAttribute('aria-roledescription')).toBe('slide')
    })
  })

  it('sets aria-label with index/total on slides', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    const total = s.slider.slides.length
    expect(s.slider.slides[0].getAttribute('aria-label')).toBe(`1 / ${total}`)
    expect(s.slider.slides[1].getAttribute('aria-label')).toBe(`2 / ${total}`)
  })

  it('creates live region element', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    const liveRegion = s.container.querySelector('.drift-sr-only')
    expect(liveRegion).toBeTruthy()
    expect(liveRegion.getAttribute('aria-live')).toBe('polite')
    expect(liveRegion.getAttribute('aria-atomic')).toBe('true')
  })

  it('does not create live region when liveRegion is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [A11y],
        a11y: { liveRegion: false },
      },
    })
    cleanup = s.cleanup
    const liveRegion = s.container.querySelector('.drift-sr-only')
    expect(liveRegion).toBeFalsy()
  })

  it('sets aria-hidden on non-active slides', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(s.slider.slides[0].getAttribute('aria-hidden')).toBe('false')
    expect(s.slider.slides[1].getAttribute('aria-hidden')).toBe('true')
  })

  it('updates aria-hidden on slide change', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    expect(s.slider.slides[0].getAttribute('aria-hidden')).toBe('true')
    expect(s.slider.slides[1].getAttribute('aria-hidden')).toBe('false')
  })

  it('updates live region text on slide change', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    const liveRegion = s.container.querySelector('.drift-sr-only')
    expect(liveRegion.textContent).toContain('3')
  })

  it('does nothing when a11y.enabled is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [A11y],
        a11y: { enabled: false },
      },
    })
    cleanup = s.cleanup
    expect(s.container.getAttribute('role')).toBeNull()
  })

  it('exposes a11y.updateAria method on slider', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(typeof s.slider.a11y.updateAria).toBe('function')
  })

  it('exposes a11y.initSlides method on slider', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(typeof s.slider.a11y.initSlides).toBe('function')
  })

  it('destroy removes live region', () => {
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    const liveRegion = s.container.querySelector('.drift-sr-only')
    expect(liveRegion).toBeTruthy()
    s.cleanup()
    expect(s.container.querySelector('.drift-sr-only')).toBeFalsy()
  })

  it('respects reduced motion and sets speed to 0', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const s = createSlider({ sliderOptions: { modules: [A11y] } })
    cleanup = s.cleanup
    expect(s.slider.params.speed).toBe(0)
  })

  it('respects reduced motion and increases autoplay delay', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true })
    const s = createSlider({
      sliderOptions: {
        modules: [A11y],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.autoplay.delay).toBeGreaterThanOrEqual(5000)
  })
})
