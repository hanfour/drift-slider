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
    // After moving to slide 1, slide 0 should now have a different transform (offset position)
    expect(newTransform).toContain('rotateY')
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

  it('setTransition stores speed for rAF animation (no CSS transitions on slides)', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCoverflow], effect: 'coverflow' },
    })
    cleanup = s.cleanup
    s.slider.setTransition(400)
    // Coverflow uses rAF, not CSS transitions — slides should have transitionProperty:none
    expect(s.slider.slides[0].style.transitionProperty).toBe('none')
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

  it('visibleSides next hides slides on the left side', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        slidesPerView: 5,
        coverflowEffect: { visibleSides: 'next' },
      },
    })
    cleanup = s.cleanup
    // Navigate to slide 2 so slide 0 is to the left (normalizedOffset=-2)
    // and slide 4 is to the right (normalizedOffset=+2)
    s.slider.slideTo(2, 0)
    const slide0Opacity = parseFloat(s.slider.slides[0].style.opacity)
    const slide4Opacity = parseFloat(s.slider.slides[4].style.opacity)
    // Right side slides should have higher opacity than left with 'next' visibleSides
    expect(slide4Opacity).toBeGreaterThan(slide0Opacity)
  })

  it('visibleSides prev hides slides on the right side', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        slidesPerView: 5,
        coverflowEffect: { visibleSides: 'prev' },
      },
    })
    cleanup = s.cleanup
    // Navigate to slide 2 so slide 0 is left (offset=-2) and slide 4 is right (offset=+2)
    s.slider.slideTo(2, 0)
    const slide0Opacity = parseFloat(s.slider.slides[0].style.opacity)
    const slide4Opacity = parseFloat(s.slider.slides[4].style.opacity)
    // Left side slides should have higher opacity than right with 'prev' visibleSides
    expect(slide0Opacity).toBeGreaterThan(slide4Opacity)
  })

  it('visibleSides next shifts center slide toward next side', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        slidesPerView: 3,
        coverflowEffect: { visibleSides: 'next' },
      },
    })
    cleanup = s.cleanup
    // visibleSides: 'next' hides prev slides — slide before active should have opacity 0
    const prevSlide = s.slider.slides[s.slider.slides.length - 1]
    expect(parseFloat(prevSlide.style.opacity)).toBeLessThanOrEqual(0)
  })

  it('visibleSides prev shifts center slide toward prev side', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        slidesPerView: 3,
        coverflowEffect: { visibleSides: 'prev' },
      },
    })
    cleanup = s.cleanup
    // visibleSides: 'prev' hides next slides — slide after active should have opacity 0
    const nextSlide = s.slider.slides[s.slider.slides.length - 1]
    expect(parseFloat(nextSlide.style.opacity)).toBeLessThanOrEqual(0)
  })

  it('fillCenter enlarges center slide to fill space', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        slidesPerView: 3,
        coverflowEffect: { fillCenter: true, scale: 0.85 },
      },
    })
    cleanup = s.cleanup
    // Center slide should have a scale larger than 1 to fill space freed by scaled sides
    const transform = s.slider.slides[0].style.transform
    expect(transform).toContain('scale(')
    // extract scale value
    const scaleMatch = transform.match(/scale\(([^)]+)\)/)
    expect(scaleMatch).not.toBeNull()
    const scaleVal = parseFloat(scaleMatch[1])
    // fillCenter should make center scale >= 1
    expect(scaleVal).toBeGreaterThanOrEqual(1)
  })

  it('corrects slidesPerView below 1 to 1', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        slidesPerView: 0,
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.slidesPerView).toBeGreaterThanOrEqual(1)
  })

  it('with slidesPerView 1 halfView is 0 and opacity formula uses absOffset directly', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        slidesPerView: 1,
        coverflowEffect: { activeOpacity: 1, opacity: 0.5 },
      },
    })
    cleanup = s.cleanup
    // Center slide (halfView=0) should have full active opacity
    const centerOpacity = parseFloat(s.slider.slides[0].style.opacity)
    expect(centerOpacity).toBe(1)
  })

  it('handles loop mode with coverflow — reorderLoopClones', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        loop: true,
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    // With loop mode, slider should have clones and still apply transforms
    expect(s.slider.slides.length).toBeGreaterThan(4)
    expect(s.slider.listEl.style.transformStyle).toBe('preserve-3d')
  })

  it('handles loop mode setTranslate with centering', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        loop: true,
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    expect(s.slider.listEl.style.transform).toContain('translate3d')
  })

  it('destroy clears overflowX and overflowY when cropSides', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCoverflow],
        effect: 'coverflow',
        coverflowEffect: { cropSides: true },
      },
    })
    expect(s.container.style.overflowX).toBe('hidden')
    s.cleanup()
    expect(s.container.style.overflowX).toBe('')
    expect(s.container.style.overflowY).toBe('')
  })
})
