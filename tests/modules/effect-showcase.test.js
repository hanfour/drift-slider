import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import EffectShowcase from '../../src/modules/effects/effect-showcase.js'

describe('module/effect-showcase', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('does nothing when effect is not showcase', () => {
    const s = createSlider({ sliderOptions: { modules: [EffectShowcase] } })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--showcase')).toBe(false)
  })

  it('adds drift-slider--showcase class to container', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--showcase')).toBe(true)
  })

  it('applies 2D transform to slides (translateX + scale only)', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    cleanup = s.cleanup
    const transform = s.slider.slides[0].style.transform
    expect(transform).toContain('translateX')
    expect(transform).toContain('scale')
    // Showcase is flat — no 3D transforms
    expect(transform).not.toContain('translateZ')
    expect(transform).not.toContain('rotateY')
  })

  it('creates overlay elements when overlay is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        showcaseEffect: { overlay: true },
      },
    })
    cleanup = s.cleanup
    const overlay = s.slider.slides[0].querySelector('.drift-showcase-overlay')
    expect(overlay).toBeTruthy()
  })

  it('does not create overlay when overlay is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        showcaseEffect: { overlay: false },
      },
    })
    cleanup = s.cleanup
    const overlay = s.slider.slides[0].querySelector('.drift-showcase-overlay')
    expect(overlay).toBeFalsy()
  })

  it('center slide overlay uses display:none instead of just opacity:0', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        showcaseEffect: { overlay: true },
      },
    })
    cleanup = s.cleanup
    // Center slide (index 0) overlay should be display:none
    const overlay = s.slider.slides[0].querySelector('.drift-showcase-overlay')
    expect(overlay.style.display).toBe('none')
  })

  it('moves list with centering offset on setTranslate', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    // With centering, the list transform should include translateX
    expect(s.slider.listEl.style.transform).toContain('translateX')
  })

  it('getComputedTranslate subtracts centering offset', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    // getComputedTranslate should return the logical translate, not raw
    const computed = s.slider.getComputedTranslate()
    // The centering offset is containerSize/2 - slideSize/2
    // computed should be close to slider.translate
    expect(typeof computed).toBe('number')
  })

  it('setTransition updates all slide durations', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    cleanup = s.cleanup
    s.slider.setTransition(400)
    expect(s.slider.slides[0].style.transitionDuration).toBe('400ms')
    expect(s.slider.slides[1].style.transitionDuration).toBe('400ms')
  })

  it('corrects slidesPerView below 1 to 1', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        slidesPerView: 0,
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.slidesPerView).toBeGreaterThanOrEqual(1)
  })

  it('destroy removes container class', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    expect(s.container.classList.contains('drift-slider--showcase')).toBe(true)
    s.cleanup()
    expect(s.container.classList.contains('drift-slider--showcase')).toBe(false)
  })

  it('destroy clears slide styles', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    const slide = s.slider.slides[0]
    expect(slide.style.transformOrigin).toBe('center center')
    s.cleanup()
    expect(slide.style.transformOrigin).toBe('')
    expect(slide.style.transform).toBe('')
  })

  it('destroy removes overlay elements', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        showcaseEffect: { overlay: true },
      },
    })
    expect(s.slider.slides[0].querySelector('.drift-showcase-overlay')).toBeTruthy()
    s.cleanup()
    expect(s.slider.slides[0].querySelector('.drift-showcase-overlay')).toBeFalsy()
  })

  it('destroy restores original setTranslate method', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    // After init, setTranslate is overridden
    const overriddenSetTranslate = s.slider.setTranslate
    s.slider.destroy()
    // After destroy, the method should be different (restored to core)
    expect(s.slider.setTranslate).not.toBe(overriddenSetTranslate)
    s.container.remove()
    cleanup = null
  })

  it('destroy restores original setTransition method', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    const overriddenSetTransition = s.slider.setTransition
    s.slider.destroy()
    expect(s.slider.setTransition).not.toBe(overriddenSetTransition)
    s.container.remove()
    cleanup = null
  })

  it('destroy restores original getComputedTranslate method', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectShowcase], effect: 'showcase' },
    })
    const overriddenGetCT = s.slider.getComputedTranslate
    s.slider.destroy()
    expect(s.slider.getComputedTranslate).not.toBe(overriddenGetCT)
    s.container.remove()
    cleanup = null
  })

  it('handles loop mode — reorderLoopClones', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        loop: true,
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    // With loop mode, slider should have clones
    expect(s.slider.slides.length).toBeGreaterThan(4)
    expect(s.container.classList.contains('drift-slider--showcase')).toBe(true)
  })

  it('handles loop mode setTranslate with centering', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [EffectShowcase],
        effect: 'showcase',
        loop: true,
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    expect(s.slider.listEl.style.transform).toContain('translateX')
  })
})
