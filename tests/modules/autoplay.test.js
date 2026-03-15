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
})
