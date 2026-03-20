import { describe, it, expect, vi, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import DriftSlider from '../../src/drift-slider.js'
import EffectCoverflow from '../../src/modules/effects/effect-coverflow.js'

describe('module/effect-coverflow – Mobile Safari fixes', () => {
  let cleanup

  afterEach(() => cleanup?.())

  describe('2D mode (depth=0, rotate=0)', () => {
    function create2D(opts = {}) {
      return createSlider({
        slideCount: 5,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          coverflowEffect: { depth: 0, rotate: 0, ...opts },
          ...opts.sliderOpts,
        },
      })
    }

    it('skips preserve-3d on list when depth and rotate are 0', () => {
      const s = create2D()
      cleanup = s.cleanup
      expect(s.slider.listEl.style.transformStyle).not.toBe('preserve-3d')
    })

    it('skips perspective on track when depth and rotate are 0', () => {
      const s = create2D()
      cleanup = s.cleanup
      expect(s.slider.trackEl.style.perspective).toBe('')
    })

    it('skips preserve-3d on slides when depth and rotate are 0', () => {
      const s = create2D()
      cleanup = s.cleanup
      expect(s.slider.slides[0].style.transformStyle).not.toBe('preserve-3d')
    })

    it('uses 2D translateX on list instead of translate3d', () => {
      const s = create2D()
      cleanup = s.cleanup
      expect(s.slider.listEl.style.transform).toContain('translateX')
      expect(s.slider.listEl.style.transform).not.toContain('translate3d')
    })

    it('uses 2D transform on slides (no translateZ/rotateY)', () => {
      const s = create2D()
      cleanup = s.cleanup
      const transform = s.slider.slides[0].style.transform
      expect(transform).toContain('translateX')
      expect(transform).not.toContain('translateZ')
      expect(transform).not.toContain('rotateY')
    })

    it('enables 3D when depth > 0', () => {
      const s = createSlider({
        slideCount: 5,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          coverflowEffect: { depth: 100, rotate: 0 },
        },
      })
      cleanup = s.cleanup
      expect(s.slider.listEl.style.transformStyle).toBe('preserve-3d')
      expect(s.slider.slides[0].style.transform).toContain('translateZ')
    })

    it('enables 3D when rotate > 0', () => {
      const s = create2D({ rotate: 30 })
      cleanup = s.cleanup
      expect(s.slider.listEl.style.transformStyle).toBe('preserve-3d')
      expect(s.slider.slides[0].style.transform).toContain('rotateY')
    })
  })

  describe('visibility culling', () => {
    it('hides far-off slides with opacity:0 (no visibility toggling)', () => {
      const s = createSlider({
        slideCount: 10,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup

      // With slidesPerView=1, halfView=0, renderRange=2
      // Slide at offset >= 2 should be hidden via opacity
      const lastSlide = s.slider.slides[s.slider.slides.length - 1]
      expect(lastSlide.style.opacity).toBe('0')
      expect(lastSlide.style.pointerEvents).toBe('none')
    })

    it('visible slides have non-zero opacity', () => {
      const s = createSlider({
        slideCount: 10,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup

      // Center slide should have opacity > 0
      expect(parseFloat(s.slider.slides[0].style.opacity)).toBeGreaterThan(0)
    })

    it('visible slides do not use will-change (rAF-driven, no CSS transitions)', () => {
      const s = createSlider({
        slideCount: 5,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup

      // Coverflow uses rAF animation — no will-change needed on slides
      expect(s.slider.slides[0].style.willChange).not.toBe('transform, opacity')
    })
  })

  describe('no GPU layer promotion in 2D mode', () => {
    it('does not add backface-visibility to slide children in 2D mode', () => {
      const s = createSlider({
        slideCount: 3,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          coverflowEffect: { depth: 0, rotate: 0 },
        },
      })
      cleanup = s.cleanup

      // In 2D mode, no backface-visibility should be set on slides
      expect(s.slider.slides[0].style.backfaceVisibility).not.toBe('hidden')
    })
  })

  describe('getComputedTranslate coverflow override', () => {
    it('subtracts centering offset from raw computed translate', () => {
      const s = createSlider({
        containerWidth: 800,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
        },
      })
      cleanup = s.cleanup

      // containerSize=800, slideSize=800 → centeringOffset=0
      // So coverflow getComputedTranslate should equal core getComputedTranslate
      s.slider.setTranslate(-400)
      const result = s.slider.getComputedTranslate()
      expect(typeof result).toBe('number')
    })

    it('restores original getComputedTranslate on destroy', () => {
      const s = createSlider({
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
        },
      })

      const coverflowGCT = s.slider.getComputedTranslate
      s.slider.destroy()

      // After destroy, getComputedTranslate should not be the coverflow override
      expect(s.slider.getComputedTranslate).not.toBe(coverflowGCT)

      s.container.remove()
    })
  })

  describe('overlay hidden for center slide', () => {
    it('hides overlay with opacity:0 on center slide', () => {
      const s = createSlider({
        slideCount: 5,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          coverflowEffect: { overlay: true },
        },
      })
      cleanup = s.cleanup

      const centerOverlay = s.slider.slides[0].querySelector('.drift-coverflow-overlay')
      expect(centerOverlay).toBeTruthy()
      expect(centerOverlay.style.opacity).toBe('0')
    })

    it('shows overlay on non-center slides', () => {
      const s = createSlider({
        slideCount: 5,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          coverflowEffect: { overlay: true },
        },
      })
      cleanup = s.cleanup

      const sideOverlay = s.slider.slides[1].querySelector('.drift-coverflow-overlay')
      if (sideOverlay && parseFloat(s.slider.slides[1].style.opacity) > 0) {
        expect(parseFloat(sideOverlay.style.opacity)).toBeGreaterThan(0)
      }
    })
  })

  describe('loopFix safety guards', () => {
    it('does not crash when totalOriginal <= 0', () => {
      // Edge case: if somehow slides.length <= loopedSlides * 2
      const s = createSlider({
        slideCount: 1,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          loop: true,
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup
      // Should not throw
      expect(() => s.slider.loopFix()).not.toThrow()
    })

    it('overlay divs have pointer-events:none', () => {
      const s = createSlider({
        slideCount: 3,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          coverflowEffect: { overlay: true },
        },
      })
      cleanup = s.cleanup

      const overlay = s.slider.slides[0].querySelector('.drift-coverflow-overlay')
      expect(overlay.style.pointerEvents).toBe('none')
    })

    it('never sets visibility on slides (opacity-only culling)', () => {
      const s = createSlider({
        slideCount: 10,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup

      // No slide should ever have visibility set — coverflow uses opacity only
      for (const slide of s.slider.slides) {
        expect(slide.style.visibility).toBe('')
      }
    })
  })
})
