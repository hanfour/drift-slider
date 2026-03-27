import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from './helpers/create-slider.js'
import EffectDeck from '../src/modules/effects/effect-deck.js'

describe('EffectDeck', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('sets slidesPerView to 1 on init', () => {
    const s = createSlider({
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
        slidesPerView: 3,
      },
    })
    cleanup = s.cleanup
    expect(s.slider.params.slidesPerView).toBe(1)
  })

  it('adds drift-slider--deck class to container', () => {
    const s = createSlider({
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
      },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--deck')).toBe(true)
  })

  it('positions slides absolutely', () => {
    const s = createSlider({
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
      },
    })
    cleanup = s.cleanup
    for (const slide of s.slider.slides) {
      expect(slide.style.position).toBe('absolute')
    }
  })

  it('active slide has highest z-index', () => {
    const s = createSlider({
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
        deckEffect: { stackVisibleCount: 3 },
      },
    })
    cleanup = s.cleanup
    const activeSlide = s.slider.slides[s.slider.activeIndex]
    const zIndex = parseInt(activeSlide.style.zIndex, 10)
    expect(zIndex).toBeGreaterThanOrEqual(3 + 1)
  })

  it('does nothing when effect is not deck', () => {
    const s = createSlider({
      sliderOptions: {
        effect: 'fade',
        modules: [EffectDeck],
      },
    })
    cleanup = s.cleanup
    expect(s.container.classList.contains('drift-slider--deck')).toBe(false)
  })

  it('stack cards are visible up to stackVisibleCount', () => {
    const s = createSlider({
      slideCount: 6,
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
        deckEffect: { stackVisibleCount: 3 },
      },
    })
    cleanup = s.cleanup
    const slides = s.slider.slides
    // Active index is 0 by default
    // Slides 1, 2, 3 should be visible (stack)
    expect(slides[1].style.visibility).toBe('visible')
    expect(slides[2].style.visibility).toBe('visible')
    expect(slides[3].style.visibility).toBe('visible')
    // Slide 4+ should be hidden
    expect(slides[4].style.visibility).toBe('hidden')
    expect(slides[5].style.visibility).toBe('hidden')
  })

  it('applies 3D transforms when perspective > 0', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
        deckEffect: { perspective: 1200, tiltX: 5, tiltY: -3 },
      },
    })
    cleanup = s.cleanup
    const trackEl = s.container.querySelector('.drift-track')
    expect(trackEl.style.perspective).toBe('1200px')
    expect(trackEl.style.transformStyle).toBe('preserve-3d')

    // Stack card (slide index 1) should have rotateX/rotateY
    const stackSlide = s.slider.slides[1]
    expect(stackSlide.style.transform).toContain('rotateX')
    expect(stackSlide.style.transform).toContain('rotateY')
  })

  it('no 3D transforms when perspective is 0', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
        deckEffect: { perspective: 0 },
      },
    })
    cleanup = s.cleanup
    const trackEl = s.container.querySelector('.drift-track')
    expect(trackEl.style.perspective).toBe('')

    // Stack card should not have rotateX/rotateY
    const stackSlide = s.slider.slides[1]
    expect(stackSlide.style.transform).not.toContain('rotateX')
    expect(stackSlide.style.transform).not.toContain('rotateY')
  })

  it('destroy cleans up styles and classes', () => {
    const s = createSlider({
      sliderOptions: {
        effect: 'deck',
        modules: [EffectDeck],
      },
    })
    // Verify setup happened
    expect(s.container.classList.contains('drift-slider--deck')).toBe(true)

    // Destroy (cleanup calls slider.destroy())
    s.cleanup()
    cleanup = null // already cleaned up

    expect(s.container.classList.contains('drift-slider--deck')).toBe(false)

    // Check slides have cleared styles
    const slides = s.container.querySelectorAll('.drift-slide')
    for (const slide of slides) {
      expect(slide.style.position).toBe('')
      expect(slide.style.transform).toBe('')
      expect(slide.style.transformOrigin).toBe('')
    }

    // Overlays should be removed
    const overlays = s.container.querySelectorAll('.drift-deck-overlay')
    expect(overlays.length).toBe(0)
  })
})
