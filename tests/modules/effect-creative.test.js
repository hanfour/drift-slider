import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import EffectCreative from '../../src/modules/effects/effect-creative.js'

describe('module/effect-creative', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('does nothing when effect is not creative', () => {
    const s = createSlider({ sliderOptions: { modules: [EffectCreative] } })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--creative')).toBe(false)
  })

  it('adds drift-slider--creative class to container', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          prev: { translate: [-100, 0, 0] },
          next: { translate: [100, 0, 0] },
        },
      },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--creative')).toBe(true)
  })

  it('applies transform to non-active slides', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          prev: { translate: [-200, 0, 0] },
          next: { translate: [200, 0, 0] },
        },
      },
    })
    cleanup = s.cleanup
    // Slide at index 1 is adjacent (next) and should have a transform applied
    const nextSlideTransform = s.slider.slides[1].style.transform
    expect(nextSlideTransform).toBeTruthy()
    expect(nextSlideTransform).not.toBe('none')
  })

  it('center slide has full opacity when prev/next have opacity 0', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          prev: { opacity: 0, translate: [-100, 0, 0] },
          next: { opacity: 0, translate: [100, 0, 0] },
        },
      },
    })
    cleanup = s.cleanup
    const centerOpacity = parseFloat(s.slider.slides[0].style.opacity)
    expect(centerOpacity).toBe(1)
  })

  it('resolves percentage translate values relative to slide size', () => {
    const s = createSlider({
      containerWidth: 800,
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          prev: { translate: ['-100%', 0, 0] },
          next: { translate: ['100%', 0, 0] },
        },
      },
    })
    cleanup = s.cleanup
    // '100%' of 800px = 800px — next slide transform should contain 800
    const nextSlideTransform = s.slider.slides[1].style.transform
    expect(nextSlideTransform).toContain('800')
  })

  it('applies perspective on trackEl when perspective is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          perspective: true,
          prev: { translate: [-100, 0, -200] },
          next: { translate: [100, 0, -200] },
        },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.trackEl.style.perspective).toBeTruthy()
  })

  it('does not set perspective when perspective is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          perspective: false,
          prev: { translate: [-100, 0, 0] },
          next: { translate: [100, 0, 0] },
        },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.trackEl.style.perspective).toBeFalsy()
  })

  it('applies scale to adjacent slides', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          prev: { scale: 0.8, translate: [-100, 0, 0] },
          next: { scale: 0.8, translate: [100, 0, 0] },
        },
      },
    })
    cleanup = s.cleanup
    const nextSlideTransform = s.slider.slides[1].style.transform
    expect(nextSlideTransform).toContain('scale(')
  })

  it('destroy removes class and restores styles', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          prev: { translate: [-100, 0, 0], opacity: 0.5 },
          next: { translate: [100, 0, 0], opacity: 0.5 },
        },
      },
    })
    expect(s.container.classList.contains('drift-slider--creative')).toBe(true)
    const slide = s.slider.slides[0]
    s.cleanup()
    expect(s.container.classList.contains('drift-slider--creative')).toBe(false)
    expect(slide.style.transform).toBe('')
    expect(slide.style.opacity).toBe('')
  })

  it('handles rotate in transform string', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCreative],
        effect: 'creative',
        creativeEffect: {
          prev: { rotate: [0, -20, 0], translate: [-100, 0, 0] },
          next: { rotate: [0, 20, 0], translate: [100, 0, 0] },
        },
      },
    })
    cleanup = s.cleanup
    const nextSlideTransform = s.slider.slides[1].style.transform
    expect(nextSlideTransform).toContain('rotateY(')
  })
})
