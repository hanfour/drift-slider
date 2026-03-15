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
})
