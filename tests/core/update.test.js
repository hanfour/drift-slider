import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/update', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('calculates containerSize from clientWidth', () => {
    const s = createSlider({ containerWidth: 1000 })
    cleanup = s.cleanup
    expect(s.slider.containerSize).toBe(1000)
  })

  it('calculates slideSize for single slide per view', () => {
    const s = createSlider({ containerWidth: 800 })
    cleanup = s.cleanup
    expect(s.slider.slideSize).toBe(800)
  })

  it('calculates slideSize with slidesPerView > 1', () => {
    const s = createSlider({ sliderOptions: { slidesPerView: 2, spaceBetween: 20 } })
    cleanup = s.cleanup
    // (800 - 20) / 2 = 390
    expect(s.slider.slideSize).toBe(390)
  })

  it('builds snapGrid with correct length', () => {
    const s = createSlider({ slideCount: 5 })
    cleanup = s.cleanup
    expect(s.slider.snapGrid).toHaveLength(5)
  })

  it('calculates minTranslate correctly', () => {
    const s = createSlider({ slideCount: 3, containerWidth: 800 })
    cleanup = s.cleanup
    // totalSize = 3 * 800 + 0 = 2400, min = -(2400 - 800) = -1600
    expect(s.slider.minTranslate).toBe(-1600)
  })

  it('sets maxTranslate to 0', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.slider.maxTranslate).toBe(0)
  })

  it('sets isLocked when only 1 snap point', () => {
    const s = createSlider({ slideCount: 1 })
    cleanup = s.cleanup
    expect(s.slider.isLocked).toBe(true)
  })

  it('emits update event on update()', () => {
    const s = createSlider()
    cleanup = s.cleanup
    let called = false
    s.slider.on('update', () => { called = true })
    s.slider.update()
    expect(called).toBe(true)
  })
})
