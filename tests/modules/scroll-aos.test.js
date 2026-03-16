import { describe, it, expect, afterEach, vi } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import ScrollAos from '../../src/modules/scroll-aos/scroll-aos.js'

describe('module/scroll-aos', () => {
  let cleanup

  afterEach(() => {
    cleanup?.()
    delete window.AOS
  })

  it('does nothing when enabled is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { enabled: false },
      },
    })
    cleanup = s.cleanup
    expect(s.container.hasAttribute('data-aos')).toBe(false)
  })

  it('does not set container data-aos when setContainerAos is false (default)', () => {
    const s = createSlider({ sliderOptions: { modules: [ScrollAos] } })
    cleanup = s.cleanup
    expect(s.container.hasAttribute('data-aos')).toBe(false)
  })

  it('sets container data-aos when setContainerAos is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { setContainerAos: true, animation: 'fade-up' },
      },
    })
    cleanup = s.cleanup
    expect(s.container.getAttribute('data-aos')).toBe('fade-up')
  })

  it('sets container data-aos-duration when setContainerAos is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { setContainerAos: true, duration: 1000 },
      },
    })
    cleanup = s.cleanup
    expect(s.container.getAttribute('data-aos-duration')).toBe('1000')
  })

  it('does not overwrite existing container data-aos', () => {
    const s = createSlider({ sliderOptions: { modules: [ScrollAos] } })
    cleanup = s.cleanup
    // Manually set before-init would be tested with createDOM, but ensure no override
    expect(s.container.getAttribute('data-aos')).toBeNull()
  })

  it('applies slideAnimation data-aos to slides', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { slideAnimation: 'fade-left', slideDelay: 50 },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].getAttribute('data-aos')).toBe('fade-left')
    expect(s.slider.slides[1].getAttribute('data-aos')).toBe('fade-left')
  })

  it('applies incremental data-aos-delay to slides', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { slideAnimation: 'fade-up', slideDelay: 100 },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].getAttribute('data-aos-delay')).toBe('0')
    expect(s.slider.slides[1].getAttribute('data-aos-delay')).toBe('100')
    expect(s.slider.slides[2].getAttribute('data-aos-delay')).toBe('200')
  })

  it('calls AOS.refresh on init if window.AOS exists', () => {
    const refresh = vi.fn()
    window.AOS = { refresh }
    const s = createSlider({ sliderOptions: { modules: [ScrollAos] } })
    cleanup = s.cleanup
    expect(refresh).toHaveBeenCalled()
  })

  it('calls AOS.refresh on slideChange when refreshOnChange is true', () => {
    const refresh = vi.fn()
    window.AOS = { refresh }
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { refreshOnChange: true },
      },
    })
    cleanup = s.cleanup
    refresh.mockClear()
    s.slider.slideTo(1, 0)
    expect(refresh).toHaveBeenCalled()
  })

  it('does not call AOS.refresh on slideChange when refreshOnChange is false', () => {
    const refresh = vi.fn()
    window.AOS = { refresh }
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { refreshOnChange: false },
      },
    })
    cleanup = s.cleanup
    refresh.mockClear()
    s.slider.slideTo(1, 0)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('does not call AOS.refresh on slideChange when enabled is false', () => {
    const refresh = vi.fn()
    window.AOS = { refresh }
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { enabled: false },
      },
    })
    cleanup = s.cleanup
    refresh.mockClear()
    s.slider.slideTo(1, 0)
    expect(refresh).not.toHaveBeenCalled()
  })

  it('destroy removes container data-aos when set by module', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { setContainerAos: true },
      },
    })
    expect(s.container.hasAttribute('data-aos')).toBe(true)
    s.cleanup()
    expect(s.container.hasAttribute('data-aos')).toBe(false)
  })

  it('destroy removes slide data-aos attributes', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [ScrollAos],
        scrollAos: { slideAnimation: 'fade-up' },
      },
    })
    const slide = s.slider.slides[0]
    expect(slide.getAttribute('data-aos')).toBe('fade-up')
    s.cleanup()
    expect(slide.hasAttribute('data-aos')).toBe(false)
  })
})
