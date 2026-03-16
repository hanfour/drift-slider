import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import Autoplay from '../../src/modules/autoplay/autoplay.js'

describe('module/autoplay', () => {
  let cleanup

  afterEach(() => {
    cleanup?.()
    vi.useRealTimers()
  })

  it('does not start when autoplay.enabled is false', () => {
    const s = createSlider({ sliderOptions: { modules: [Autoplay] } })
    cleanup = s.cleanup
    expect(s.slider.autoplay.running()).toBe(false)
  })

  it('starts autoplay when enabled', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.autoplay.running()).toBe(true)
  })

  it('advances slide after delay', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.activeIndex).toBe(0)
    vi.advanceTimersByTime(1100)
    expect(s.slider.activeIndex).toBe(1)
  })

  it('stop() stops autoplay', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    s.slider.autoplay.stop()
    expect(s.slider.autoplay.running()).toBe(false)
    vi.advanceTimersByTime(2000)
    expect(s.slider.activeIndex).toBe(0)
  })

  it('pause() and resume() work', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    s.slider.autoplay.pause()
    vi.advanceTimersByTime(2000)
    expect(s.slider.activeIndex).toBe(0)
    s.slider.autoplay.resume()
    vi.advanceTimersByTime(1100)
    expect(s.slider.activeIndex).toBe(1)
  })

  it('emits autoplayStart event', () => {
    const handler = vi.fn()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
        on: { autoplayStart: handler },
      },
    })
    cleanup = s.cleanup
    expect(handler).toHaveBeenCalled()
  })

  it('emits autoplayStop event', () => {
    const handler = vi.fn()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
        on: { autoplayStop: handler },
      },
    })
    cleanup = s.cleanup
    s.slider.autoplay.stop()
    expect(handler).toHaveBeenCalled()
  })

  it('reverseDirection goes backward', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000, reverseDirection: true },
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    vi.advanceTimersByTime(1100)
    expect(s.slider.activeIndex).toBe(1)
  })

  it('start() is idempotent - calling twice does not double-run', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    // autoplay already started during init - calling start() again should be a no-op
    s.slider.autoplay.start()
    vi.advanceTimersByTime(1100)
    // Should only advance by 1, not 2
    expect(s.slider.activeIndex).toBe(1)
  })

  it('pause() is idempotent - calling twice has no extra effect', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    s.slider.autoplay.pause()
    s.slider.autoplay.pause() // second call should not throw
    vi.advanceTimersByTime(2000)
    expect(s.slider.activeIndex).toBe(0)
  })

  it('resume() does nothing when not paused', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    // Not paused, calling resume() should be a no-op (won't restart)
    s.slider.autoplay.resume()
    vi.advanceTimersByTime(1100)
    expect(s.slider.activeIndex).toBe(1)
  })

  it('stop() is idempotent - calling twice has no extra effect', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    s.slider.autoplay.stop()
    s.slider.autoplay.stop() // second call should not throw
    expect(s.slider.autoplay.running()).toBe(false)
  })

  it('pauseOnMouseEnter pauses on mouseenter and resumes on mouseleave', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000, pauseOnMouseEnter: true },
      },
    })
    cleanup = s.cleanup
    s.container.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(2000)
    expect(s.slider.activeIndex).toBe(0) // paused
    s.container.dispatchEvent(new MouseEvent('mouseleave'))
    vi.advanceTimersByTime(1100)
    expect(s.slider.activeIndex).toBe(1) // resumed
  })

  it('mouseenter does nothing when pauseOnMouseEnter is false', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000, pauseOnMouseEnter: false },
      },
    })
    cleanup = s.cleanup
    s.container.dispatchEvent(new MouseEvent('mouseenter'))
    vi.advanceTimersByTime(1100)
    expect(s.slider.activeIndex).toBe(1) // not paused
  })

  it('touchStart pauses autoplay', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
      },
    })
    cleanup = s.cleanup
    s.slider.emit('touchStart')
    vi.advanceTimersByTime(2000)
    expect(s.slider.activeIndex).toBe(0)
  })

  it('touchEnd with disableOnInteraction stops autoplay', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000, disableOnInteraction: true },
      },
    })
    cleanup = s.cleanup
    s.slider.emit('touchStart')
    s.slider.emit('touchEnd')
    expect(s.slider.autoplay.running()).toBe(false)
  })

  it('touchEnd without disableOnInteraction resumes autoplay', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000, disableOnInteraction: false },
      },
    })
    cleanup = s.cleanup
    s.slider.emit('touchStart')
    s.slider.emit('touchEnd')
    vi.advanceTimersByTime(1100)
    expect(s.slider.activeIndex).toBe(1) // resumed and advanced
  })

  it('stopOnLastSlide stops at last slide without loop', () => {
    vi.useFakeTimers()
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000, stopOnLastSlide: true },
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0) // go to last slide
    vi.advanceTimersByTime(1100) // autoplay fires
    expect(s.slider.autoplay.running()).toBe(false)
  })

  it('emits autoplayPause event on pause', () => {
    const handler = vi.fn()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
        on: { autoplayPause: handler },
      },
    })
    cleanup = s.cleanup
    s.slider.autoplay.pause()
    expect(handler).toHaveBeenCalled()
  })

  it('emits autoplayResume event on resume', () => {
    const handler = vi.fn()
    const s = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, delay: 1000 },
        on: { autoplayResume: handler },
      },
    })
    cleanup = s.cleanup
    s.slider.autoplay.pause()
    s.slider.autoplay.resume()
    expect(handler).toHaveBeenCalled()
  })
})
