import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import Autoplay from '../../src/modules/autoplay/autoplay.js'

describe('module/autoplay - ticker mode', () => {
  let cleanup

  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { cleanup?.(); vi.useRealTimers() })

  it('exposes ticker methods on slider.autoplay (start/stop/running)', () => {
    const { slider, cleanup: c } = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, ticker: true, tickerSpeed: 1 },
      },
    })
    cleanup = c

    expect(slider.autoplay).toBeDefined()
    expect(typeof slider.autoplay.start).toBe('function')
    expect(typeof slider.autoplay.stop).toBe('function')
    expect(typeof slider.autoplay.running).toBe('function')
    expect(slider.autoplay.running()).toBe(true)
  })

  it('sets transitionProperty to "none" on listEl when ticker is active', () => {
    const { slider, cleanup: c } = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, ticker: true, tickerSpeed: 1 },
      },
    })
    cleanup = c

    // Ticker mode uses rAF-driven translate, not CSS transitions
    expect(slider.listEl.style.transitionProperty).toBe('none')
  })

  it('emits autoplayStart on init', () => {
    const onStart = vi.fn()
    const { slider, cleanup: c } = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, ticker: true, tickerSpeed: 1 },
        on: { autoplayStart: onStart },
      },
    })
    cleanup = c

    expect(onStart).toHaveBeenCalledTimes(1)
    expect(onStart).toHaveBeenCalledWith(slider)
  })

  it('stop cancels ticker (running() returns false)', () => {
    const { slider, cleanup: c } = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, ticker: true, tickerSpeed: 1 },
      },
    })
    cleanup = c

    expect(slider.autoplay.running()).toBe(true)
    slider.autoplay.stop()
    expect(slider.autoplay.running()).toBe(false)
  })

  it('reverseDirection initializes without error', () => {
    expect(() => {
      const { cleanup: c } = createSlider({
        sliderOptions: {
          modules: [Autoplay],
          autoplay: {
            enabled: true,
            ticker: true,
            tickerSpeed: 1,
            reverseDirection: true,
          },
        },
      })
      cleanup = c
    }).not.toThrow()
  })

  it('does not use setTimeout-based slideNext in ticker mode', () => {
    const { slider, cleanup: c } = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, ticker: true, tickerSpeed: 1 },
      },
    })
    cleanup = c

    const slideNextSpy = vi.spyOn(slider, 'slideNext')

    // Advance timers significantly — ticker mode should NOT call slideNext
    vi.advanceTimersByTime(10000)

    expect(slideNextSpy).not.toHaveBeenCalled()
  })

  it('pause sets running state appropriately', () => {
    const { slider, cleanup: c } = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, ticker: true, tickerSpeed: 1 },
      },
    })
    cleanup = c

    expect(slider.autoplay.running()).toBe(true)

    slider.autoplay.pause()

    // After pause the autoplay is still "running" (not stopped), just paused.
    // running() should still return true — the ticker is suspended, not ended.
    expect(slider.autoplay.running()).toBe(true)
  })

  it('ticker defaults: tickerSpeed defaults to 1', () => {
    const { slider, cleanup: c } = createSlider({
      sliderOptions: {
        modules: [Autoplay],
        autoplay: { enabled: true, ticker: true },
      },
    })
    cleanup = c

    expect(slider.params.autoplay.tickerSpeed).toBe(1)
  })
})
