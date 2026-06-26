import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import EffectFade from '../../src/modules/effects/effect-fade.js'

describe('module/effect-fade', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('does nothing when effect is not fade', () => {
    const s = createSlider({ sliderOptions: { modules: [EffectFade] } })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.opacity).toBe('')
  })

  it('sets active slide to opacity 1 on init', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.opacity).toBe('1')
    expect(s.slider.slides[0].style.visibility).toBe('visible')
    expect(s.slider.slides[0].style.pointerEvents).toBe('auto')
  })

  it('sets inactive slides to opacity 0', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[1].style.opacity).toBe('0')
    expect(s.slider.slides[1].style.pointerEvents).toBe('none')
  })

  it('inactive slides are visible when crossFade is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectFade],
        effect: 'fade',
        fadeEffect: { crossFade: true },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[1].style.visibility).toBe('visible')
  })

  it('inactive slides are hidden when crossFade is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectFade],
        effect: 'fade',
        fadeEffect: { crossFade: false },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[1].style.visibility).toBe('hidden')
  })

  it('sets slides to absolute positioning on init', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.position).toBe('absolute')
    expect(s.slider.slides[0].style.top).toBe('0px')
    expect(s.slider.slides[0].style.left).toBe('0px')
    expect(s.slider.slides[0].style.width).toBe('100%')
    expect(s.slider.slides[0].style.height).toBe('100%')
  })

  it('sets list position to relative', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    expect(s.slider.listEl.style.position).toBe('relative')
  })

  it('updates opacity on slide change', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    expect(s.slider.slides[1].style.opacity).toBe('1')
    expect(s.slider.slides[0].style.opacity).toBe('0')
  })

  it('overrides setTransition to apply to slides', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    s.slider.setTransition(600)
    expect(s.slider.slides[0].style.transitionDuration).toBe('600ms')
    expect(s.slider.slides[1].style.transitionDuration).toBe('600ms')
  })

  it('overrides setTranslate to update internal state', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    const translate = s.slider.minTranslate
    s.slider.setTranslate(translate)
    expect(s.slider.isEnd).toBe(true)
  })

  it('destroy clears slide styles', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    const slide = s.slider.slides[0]
    expect(slide.style.opacity).toBe('1')
    s.cleanup()
    expect(slide.style.opacity).toBe('')
    expect(slide.style.position).toBe('')
    expect(slide.style.visibility).toBe('')
  })

  // Regression: fade + loop drove list.transform off-screen because core
  // _init → slideTo set a translate before EffectFade's init could intercept.
  it('resets list transform on init so stacked slides stay in the container', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectFade],
        effect: 'fade',
        loop: true,
      },
    })
    cleanup = s.cleanup
    expect(s.slider.listEl.style.transform).toBe('')
  })

  // Regression: update() used to write list width = totalSize regardless of
  // effect, which made slide children resolve to multi-viewport widths and
  // pushed absolutely-positioned overlays off-screen.
  it('does not inflate list width when effect is fade', () => {
    const s = createSlider({
      slideCount: 4,
      containerWidth: 800,
      sliderOptions: { modules: [EffectFade], effect: 'fade' },
    })
    cleanup = s.cleanup
    expect(s.slider.listEl.style.width).toBe('')
  })

  // Regression: loopFix wrote list.transform directly (bypassing the fade
  // override), yanking the visible stack off-screen at the loop boundary.
  it('does not translate the list through a loop wrap', () => {
    const s = createSlider({
      slideCount: 4,
      containerWidth: 800,
      sliderOptions: {
        modules: [EffectFade],
        effect: 'fade',
        loop: true,
      },
    })
    cleanup = s.cleanup

    // Jump into the clone range (end-of-loop) then invoke loopFix directly;
    // loop + fade must never leave a translate on the list.
    const looped = s.slider._loopedSlides || 0
    const total = s.slider.slides.length - looped * 2
    s.slider.activeIndex = looped + total // first clone after real slides
    s.slider.loopFix()

    expect(s.slider.listEl.style.transform).toBe('')
  })
})
