import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import Keyboard from '../../src/modules/keyboard/keyboard.js'

describe('module/keyboard', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('does not listen when keyboard.enabled is false', () => {
    const s = createSlider({ sliderOptions: { modules: [Keyboard] } })
    cleanup = s.cleanup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(s.slider.activeIndex).toBe(0)
  })

  it('ArrowRight advances slide when enabled', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(s.slider.activeIndex).toBe(1)
  })

  it('ArrowLeft goes to previous slide', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(s.slider.activeIndex).toBe(1)
  })

  it('Home goes to first slide', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(3, 0)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }))
    expect(s.slider.activeIndex).toBe(0)
  })

  it('End goes to last slide', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }))
    expect(s.slider.activeIndex).toBe(3)
  })

  it('ArrowUp/Down work for vertical direction', () => {
    const s = createSlider({
      sliderOptions: {
        direction: 'vertical',
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(s.slider.activeIndex).toBe(1)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(s.slider.activeIndex).toBe(0)
  })

  it('ArrowLeft/Right do nothing on vertical slider', () => {
    const s = createSlider({
      sliderOptions: {
        direction: 'vertical',
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(s.slider.activeIndex).toBe(0)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(s.slider.activeIndex).toBe(0)
  })

  it('ArrowUp/Down do nothing on horizontal slider', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }))
    expect(s.slider.activeIndex).toBe(0)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(s.slider.activeIndex).toBe(0)
  })

  it('does nothing when isLocked is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: false },
      },
    })
    cleanup = s.cleanup
    s.slider.isLocked = true
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(s.slider.activeIndex).toBe(0)
  })

  it('onlyInViewport: navigates when slider is in viewport', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: true },
      },
    })
    cleanup = s.cleanup
    // Mock getBoundingClientRect to be in viewport
    vi.spyOn(s.container, 'getBoundingClientRect').mockReturnValue({
      top: 100, bottom: 300, left: 100, right: 500,
    })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(s.slider.activeIndex).toBe(1)
  })

  it('onlyInViewport: does not navigate when slider is out of viewport', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Keyboard],
        keyboard: { enabled: true, onlyInViewport: true },
      },
    })
    cleanup = s.cleanup
    // Mock getBoundingClientRect to be out of viewport (below fold)
    vi.spyOn(s.container, 'getBoundingClientRect').mockReturnValue({
      top: 2000, bottom: 2400, left: 0, right: 800,
    })
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true })
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(s.slider.activeIndex).toBe(0)
  })
})
