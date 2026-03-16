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
      sliderOptions: {
        modules: [EffectCards],
        effect: 'cards',
        cardsEffect: { direction: 'auto' },
      },
    })
    cleanup = s.cleanup
    // Initially renders without error
    expect(s.slider.slides[0].style.opacity).toBe('1')
    // Trigger slide change to cycle direction
    s.slider.slideTo(1, 0)
    expect(s.slider.slides[1].style.opacity).toBe('1')
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
})
