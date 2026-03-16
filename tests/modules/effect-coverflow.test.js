import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import EffectCoverflow from '../../src/modules/effects/effect-coverflow.js'

describe('module/effect-coverflow', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('does nothing when effect is not coverflow', () => {
    const s = createSlider({ sliderOptions: { modules: [EffectCoverflow] } })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--coverflow')).toBe(false)
  })

  it('adds drift-slider--coverflow class to container', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--coverflow')).toBe(true)
  })

  it('sets preserve-3d on list element', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    expect(s.slider.listEl.style.transformStyle).toBe('preserve-3d')
  })

  it('sets perspective on track element', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    expect(s.slider.trackEl.style.perspective).toBe('1200px')
  })

  it('sets preserve-3d on slides', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.transformStyle).toBe('preserve-3d')
  })

  it('sets backfaceVisibility on slides', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.backfaceVisibility).toBe('hidden')
  })

  it('sets transformOrigin on slides (default center)', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.transformOrigin).toBe('center center')
  })

  it('sets transformOrigin to center top when align is top', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { align: 'top' },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.transformOrigin).toBe('center top')
  })

  it('sets transformOrigin to center bottom when align is bottom', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { align: 'bottom' },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.transformOrigin).toBe('center bottom')
  })

  it('applies 3D transform to slides', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.transform).toContain('translateZ')
    expect(s.slider.slides[0].style.transform).toContain('rotateY')
  })

  it('center slide (activeIndex) has full opacity', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { activeOpacity: 1, opacity: 0.6 },
      },
    })
    cleanup = s.cleanup
    const centerOpacity = parseFloat(s.slider.slides[0].style.opacity)
    expect(centerOpacity).toBe(1)
  })

  it('creates overlay elements when overlay is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { overlay: true },
      },
    })
    cleanup = s.cleanup
    const overlay = s.slider.slides[0].querySelector('.drift-coverflow-overlay')
    expect(overlay).toBeTruthy()
  })

  it('does not create overlay when overlay is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { overlay: false },
      },
    })
    cleanup = s.cleanup
    const overlay = s.slider.slides[0].querySelector('.drift-coverflow-overlay')
    expect(overlay).toBeFalsy()
  })

  it('moves list with centering offset on setTranslate', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    // With containerSize=800 and slideSize=800, centering offset = 0
    // So listEl.style.transform should be translate3d(0px, 0, 0)
    expect(s.slider.listEl.style.transform).toContain('translate3d')
  })

  it('updates slide transforms on slide change', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    const initialTransform = s.slider.slides[1].style.transform
    s.slider.slideTo(1, 0)
    const newTransform = s.slider.slides[0].style.transform
    // After moving to slide 1, slide 0 should now have an offset transform
    expect(newTransform).toBeTruthy()
    expect(s.slider.slides[1].style.transform).not.toBe(initialTransform)
  })

  it('handles cropSides option', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { cropSides: true },
      },
    })
    cleanup = s.cleanup
    expect(s.container.style.overflowX).toBe('hidden')
    expect(s.container.style.overflowY).toBe('visible')
  })

  it('handles staggerY positive option', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { staggerY: 20 },
      },
    })
    cleanup = s.cleanup
    expect(s.container.style.marginBottom).toBe('20px')
  })

  it('handles staggerY negative option', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { staggerY: -20 },
      },
    })
    cleanup = s.cleanup
    expect(s.container.style.marginTop).toBe('20px')
  })

  it('setTransition updates all slide durations', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    s.slider.setTransition(400)
    expect(s.slider.slides[0].style.transitionDuration).toBe('400ms')
    expect(s.slider.slides[1].style.transitionDuration).toBe('400ms')
  })

  it('destroy removes container class', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    expect(s.container.classList.contains('drift-slider--coverflow')).toBe(true)
    s.cleanup()
    expect(s.container.classList.contains('drift-slider--coverflow')).toBe(false)
  })

  it('destroy clears slide styles', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    const slide = s.slider.slides[0]
    expect(slide.style.transformStyle).toBe('preserve-3d')
    s.cleanup()
    expect(slide.style.transformStyle).toBe('')
    expect(slide.style.transform).toBe('')
  })

  it('destroy removes overlay elements', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { overlay: true },
      },
    })
    expect(s.slider.slides[0].querySelector('.drift-coverflow-overlay')).toBeTruthy()
    s.cleanup()
    expect(s.slider.slides[0].querySelector('.drift-coverflow-overlay')).toBeFalsy()
  })

  it('destroy clears list transformStyle', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    expect(s.slider.listEl.style.transformStyle).toBe('preserve-3d')
    s.cleanup()
    expect(s.slider.listEl.style.transformStyle).toBe('')
  })
})
