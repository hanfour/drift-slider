import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/breakpoints', () => {
  let cleanup

  afterEach(() => {
    cleanup?.()
    vi.restoreAllMocks()
  })

  it('getBreakpoint returns null when no breakpoints', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.slider.getBreakpoint()).toBeNull()
  })

  it('getBreakpoint matches correct breakpoint', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    const s = createSlider({
      sliderOptions: {
        breakpoints: {
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.getBreakpoint()).toBe(1024)
  })

  it('applies breakpoint overrides to params', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    const s = createSlider({
      sliderOptions: {
        slidesPerView: 1,
        breakpoints: {
          1024: { slidesPerView: 3, spaceBetween: 20 },
        },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.slidesPerView).toBe(3)
    expect(s.slider.params.spaceBetween).toBe(20)
  })

  it('emits breakpoint event', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    const handler = vi.fn()
    const s = createSlider({
      sliderOptions: {
        breakpoints: {
          1024: { slidesPerView: 2 },
        },
        on: { breakpoint: handler },
      },
    })
    cleanup = s.cleanup
    expect(handler).toHaveBeenCalled()
  })

  it('returns null below all breakpoints', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(500)
    const s = createSlider({
      sliderOptions: {
        breakpoints: {
          768: { slidesPerView: 2 },
        },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.getBreakpoint()).toBeNull()
  })

  it('builds loop clones when a breakpoint enables loop', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        loop: false,
        breakpoints: { 1024: { loop: true } },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.loop).toBe(true)
    expect(s.slider._loopedSlides).toBeGreaterThan(0)
    expect(s.slider.listEl.querySelectorAll('.drift-slide--clone').length).toBeGreaterThan(0)
  })

  it('removes loop clones when a breakpoint disables loop', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1024)
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        loop: true,
        breakpoints: { 1024: { loop: false } },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.loop).toBe(false)
    expect(s.slider.listEl.querySelectorAll('.drift-slide--clone').length).toBe(0)
  })
})
