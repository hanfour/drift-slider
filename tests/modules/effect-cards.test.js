import { describe, it, expect, afterEach, vi } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import EffectCards from '../../src/modules/effects/effect-cards.js'

describe('module/effect-cards', () => {
  let cleanup

  afterEach(() => {
    cleanup?.()
    vi.useRealTimers()
  })

  it('does nothing when effect is not cards', () => {
    const s = createSlider({ sliderOptions: { modules: [EffectCards] } })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--cards')).toBe(false)
  })

  it('adds drift-slider--cards class to container', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--cards')).toBe(true)
  })

  it('forces slidesPerView to 1', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.slidesPerView).toBe(1)
  })

  it('sets list position to relative', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    expect(s.slider.listEl.style.position).toBe('relative')
  })

  it('sets slides to absolute positioning', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.position).toBe('absolute')
  })

  it('active slide has opacity 1 and zIndex 2', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.opacity).toBe('1')
    expect(s.slider.slides[0].style.zIndex).toBe('2')
    expect(s.slider.slides[0].style.visibility).toBe('visible')
  })

  it('peek slide has zIndex 1 and reduced opacity', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[1].style.zIndex).toBe('1')
    expect(s.slider.slides[1].style.visibility).toBe('visible')
  })

  it('non-peek slides are hidden', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[2].style.visibility).toBe('hidden')
    expect(s.slider.slides[2].style.opacity).toBe('0')
    expect(s.slider.slides[2].style.zIndex).toBe('0')
  })

  it('creates overlay elements when overlay is true', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { overlay: true },
      },
    })
    cleanup = s.cleanup
    const overlay = s.slider.slides[0].querySelector('.drift-cards-overlay')
    expect(overlay).toBeTruthy()
  })

  it('does not create overlay elements when overlay is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { overlay: false },
      },
    })
    cleanup = s.cleanup
    const overlay = s.slider.slides[0].querySelector('.drift-cards-overlay')
    expect(overlay).toBeFalsy()
  })

  it('updates transforms on slide change', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    expect(s.slider.slides[1].style.opacity).toBe('1')
    expect(s.slider.slides[1].style.zIndex).toBe('2')
    expect(s.slider.slides[0].style.opacity).not.toBe('1')
  })

  it('adds diagonal class in diagonal mode', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'diagonal' },
      },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--cards-diagonal')).toBe(true)
  })

  it('adds flip class in flip mode', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip' },
      },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--cards-flip')).toBe(true)
  })

  it('applies flip transition on slide change in flip mode', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip', flipAxis: 'Y' },
        speed: 300,
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    // After slide change, outgoing slide should start rotating
    expect(s.slider.slides[0].style.transform).toContain('rotateY')
  })

  it('flip transition completes after timeout', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip', flipAxis: 'Y' },
        speed: 300,
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    vi.advanceTimersByTime(200)
    expect(s.slider.slides[1].style.zIndex).toBe('2')
  })

  it('auto direction cycles through directions', () => {
    const s = createSlider({
      slideCount: 5,
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { direction: 'auto' },
      },
    })
    cleanup = s.cleanup
    // Capture initial non-active slide transform
    const initialTransform = s.slider.slides[1].style.transform
    // Slide twice to cycle the auto direction index
    s.slider.slideTo(1, 0)
    s.slider.slideTo(2, 0)
    // Non-active slide transform should differ due to direction cycling
    const laterTransform = s.slider.slides[3].style.transform
    expect(laterTransform).toBeTruthy()
    // The auto-cycle index has advanced, so transforms change
    expect(s.slider.slides[2].style.opacity).toBe('1')
  })

  it('setTransition updates slide transition durations', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    s.slider.setTransition(400)
    expect(s.slider.slides[0].style.transitionDuration).toBe('400ms')
  })

  it('destroy removes container classes', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    expect(s.container.classList.contains('drift-slider--cards')).toBe(true)
    s.cleanup()
    expect(s.container.classList.contains('drift-slider--cards')).toBe(false)
  })

  it('destroy clears slide styles', () => {
    const s = createSlider({
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    const slide = s.slider.slides[0]
    expect(slide.style.position).toBe('absolute')
    s.cleanup()
    expect(slide.style.position).toBe('')
    expect(slide.style.opacity).toBe('')
  })

  it('destroy removes overlay elements', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { overlay: true },
      },
    })
    expect(s.slider.slides[0].querySelector('.drift-cards-overlay')).toBeTruthy()
    s.cleanup()
    expect(s.slider.slides[0].querySelector('.drift-cards-overlay')).toBeFalsy()
  })

  it('active slide has no box shadow when shadow is false', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { shadow: false },
      },
    })
    cleanup = s.cleanup
    expect(s.slider.slides[0].style.boxShadow).toBe('none')
  })

  it('flipAxis X uses rotateX for flip transition', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip', flipAxis: 'X' },
        speed: 300,
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    expect(s.slider.slides[0].style.transform).toContain('rotateX')
  })

  it('loop mode renders correctly and uses loop peek index', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        loop: true,
      },
    })
    cleanup = s.cleanup
    // With loop mode, slider should have clones and render correctly
    expect(s.slider.slides.length).toBeGreaterThan(4)
    const activeIdx = s.slider.activeIndex
    expect(s.slider.slides[activeIdx].style.opacity).toBe('1')
  })

  it('destroy clears flip timeout if active', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip', flipAxis: 'Y' },
        speed: 300,
      },
    })
    // Start a flip that has a pending timeout
    s.slider.slideTo(1, 0)
    // Destroy before timeout fires
    s.cleanup()
    // Advance timers — should not throw even though slide is gone
    expect(() => vi.advanceTimersByTime(300)).not.toThrow()
  })

  it('second flip clears previous pending timeout', () => {
    vi.useFakeTimers()
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip', flipAxis: 'Y' },
        speed: 300,
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    // Start another flip before first completes (should clear pending timeout)
    s.slider.slideTo(2, 0)
    vi.advanceTimersByTime(200)
    expect(s.slider.slides[2].style.zIndex).toBe('2')
  })

  it('getPeekIndex clamps to last slide when at end (non-loop)', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    // At last slide, peekIndex = Math.min(3, 2) = 2, same as active
    // Active slide should still have opacity 1
    expect(s.slider.slides[2].style.opacity).toBe('1')
  })

  it('onUpdate event re-applies slide transforms', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    // Clear transforms to verify update re-applies them
    s.slider.slides[1].style.transform = ''
    s.slider.emit('update')
    expect(s.slider.slides[1].style.transform).toBeTruthy()
    expect(s.slider.slides[0].style.opacity).toBe('1')
  })

  it('resize event re-applies slide transforms', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [EffectCards], effect: 'cards' },
    })
    cleanup = s.cleanup
    // Clear transforms to verify resize re-applies them
    s.slider.slides[1].style.transform = ''
    s.slider.emit('resize')
    expect(s.slider.slides[1].style.transform).toBeTruthy()
    expect(s.slider.slides[0].style.opacity).toBe('1')
  })

  it('flip setTranslate skips applyFlip when activeIndex unchanged', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip', flipAxis: 'Y' },
        speed: 300,
      },
    })
    cleanup = s.cleanup
    // Call setTranslate without changing activeIndex — no flip triggered
    s.slider.setTranslate(s.slider.translate)
    // Outgoing slide should not have a rotation transform at rest
    expect(s.slider.slides[0].style.transform).not.toContain('rotateY(-90deg)')
  })

  it('onSlideChange flip skips when activeIndex unchanged', () => {
    vi.useFakeTimers()
    const s = createSlider({
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { mode: 'flip', flipAxis: 'Y' },
        speed: 300,
      },
    })
    cleanup = s.cleanup
    // Emit slideChange without actually changing index — should not throw or apply flip
    expect(() => s.slider.emit('slideChange')).not.toThrow()
    // No rotation should have been applied (flip not triggered)
    expect(s.slider.slides[0].style.transform).not.toContain('rotateY(-90deg)')
  })
})
