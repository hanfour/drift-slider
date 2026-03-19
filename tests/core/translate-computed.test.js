import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/translate – getComputedTranslate', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('returns slider.translate when no transform is set', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.translate = -200
    // getComputedStyle mock returns el.style.transform, which is translate3d
    const result = s.slider.getComputedTranslate()
    expect(typeof result).toBe('number')
  })

  it('parses matrix() 2D transform for horizontal', () => {
    const s = createSlider()
    cleanup = s.cleanup

    // Override getComputedStyle to return a specific matrix
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      transform: 'matrix(1, 0, 0, 1, -350, 0)',
      webkitTransform: 'matrix(1, 0, 0, 1, -350, 0)',
    }))

    expect(s.slider.getComputedTranslate()).toBe(-350)
  })

  it('parses matrix() 2D transform for vertical', () => {
    const s = createSlider({ sliderOptions: { direction: 'vertical' } })
    cleanup = s.cleanup

    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      transform: 'matrix(1, 0, 0, 1, 0, -150)',
      webkitTransform: 'matrix(1, 0, 0, 1, 0, -150)',
    }))

    expect(s.slider.getComputedTranslate()).toBe(-150)
  })

  it('parses matrix3d() transform for horizontal', () => {
    const s = createSlider()
    cleanup = s.cleanup

    // matrix3d with tx at index 12
    const vals = '1,0,0,0,0,1,0,0,0,0,1,0,-500,0,0,1'
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      transform: `matrix3d(${vals})`,
      webkitTransform: `matrix3d(${vals})`,
    }))

    expect(s.slider.getComputedTranslate()).toBe(-500)
  })

  it('parses matrix3d() transform for vertical', () => {
    const s = createSlider({ sliderOptions: { direction: 'vertical' } })
    cleanup = s.cleanup

    // matrix3d with ty at index 13
    const vals = '1,0,0,0,0,1,0,0,0,0,1,0,0,-250,0,1'
    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      transform: `matrix3d(${vals})`,
      webkitTransform: `matrix3d(${vals})`,
    }))

    expect(s.slider.getComputedTranslate()).toBe(-250)
  })

  it('returns slider.translate ?? 0 when transform is "none"', () => {
    const s = createSlider()
    cleanup = s.cleanup

    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      transform: 'none',
    }))

    s.slider.translate = -100
    expect(s.slider.getComputedTranslate()).toBe(-100)
  })

  it('returns 0 when slider.translate is undefined and transform is "none"', () => {
    const s = createSlider()
    cleanup = s.cleanup

    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      transform: 'none',
    }))

    s.slider.translate = undefined
    expect(s.slider.getComputedTranslate()).toBe(0)
  })

  it('returns 0 (not NaN) when slider.translate is 0 and transform is "none"', () => {
    const s = createSlider()
    cleanup = s.cleanup

    vi.spyOn(window, 'getComputedStyle').mockImplementation(() => ({
      transform: 'none',
    }))

    s.slider.translate = 0
    expect(s.slider.getComputedTranslate()).toBe(0)
  })
})
