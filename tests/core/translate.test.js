import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/translate', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('setTranslate updates slider.translate', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.setTranslate(-100)
    expect(s.slider.translate).toBe(-100)
  })

  it('setTranslate updates list transform style', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.setTranslate(-200)
    expect(s.slider.listEl.style.transform).toBe('translate3d(-200px, 0px, 0)')
  })

  it('vertical direction translates on Y axis', () => {
    const s = createSlider({ sliderOptions: { direction: 'vertical' } })
    cleanup = s.cleanup
    s.slider.setTranslate(-100)
    expect(s.slider.listEl.style.transform).toBe('translate3d(0px, -100px, 0)')
  })

  it('emits setTranslate event', () => {
    const s = createSlider()
    cleanup = s.cleanup
    let emittedVal
    s.slider.on('setTranslate', (_s, val) => { emittedVal = val })
    s.slider.setTranslate(-50)
    expect(emittedVal).toBe(-50)
  })

  it('getTranslate returns current value', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.setTranslate(-300)
    expect(s.slider.getTranslate()).toBe(-300)
  })

  it('updates progress', () => {
    const s = createSlider({ slideCount: 3, containerWidth: 800 })
    cleanup = s.cleanup
    // minTranslate = -1600, maxTranslate = 0
    s.slider.setTranslate(-800)
    expect(s.slider.progress).toBeCloseTo(0.5, 1)
  })
})
