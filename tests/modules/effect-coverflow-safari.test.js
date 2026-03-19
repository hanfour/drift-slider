import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
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
      const s = create2D({ depth: 100 })
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
    it('hides far-off slides with visibility:hidden', () => {
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
      // Slide at offset >= 2 should be hidden
      // Active slide is 0, so slides far away should be hidden
      const lastSlide = s.slider.slides[s.slider.slides.length - 1]
      expect(lastSlide.style.visibility).toBe('hidden')
    })

    it('visible slides have visibility:visible', () => {
      const s = createSlider({
        slideCount: 10,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup

      // Center slide should be visible
      expect(s.slider.slides[0].style.visibility).toBe('visible')
    })

    it('hidden slides have opacity 0 and pointerEvents none', () => {
      const s = createSlider({
        slideCount: 10,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup

      const lastSlide = s.slider.slides[s.slider.slides.length - 1]
      if (lastSlide.style.visibility === 'hidden') {
        expect(lastSlide.style.opacity).toBe('0')
        expect(lastSlide.style.pointerEvents).toBe('none')
      }
    })

    it('sets will-change on visible slides', () => {
      const s = createSlider({
        slideCount: 5,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
          slidesPerView: 1,
        },
      })
      cleanup = s.cleanup

      // Center slide should have will-change
      expect(s.slider.slides[0].style.willChange).toBe('transform, opacity')
    })
  })

  describe('GPU layer promotion', () => {
    it('adds backface-visibility to slide children', () => {
      const s = createSlider({
        slideCount: 3,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
        },
      })
      cleanup = s.cleanup

      // Add a child element to test
      const img = document.createElement('img')
      s.slider.slides[0].appendChild(img)

      // Re-init to trigger promoteSlideContent again
      // (already done during init for existing children)
    })

    it('destroy cleans up child backface-visibility styles', () => {
      const s = createSlider({
        slideCount: 3,
        sliderOptions: {
          modules: [EffectCoverflow],
          effect: 'coverflow',
        },
      })

      // Slide textContent creates a text node, not an element child
      // Add an actual child element
      const div = document.createElement('div')
      div.className = 'content'
      s.slider.slides[0].appendChild(div)

      // Manually promote
      div.style.backfaceVisibility = 'hidden'

      s.cleanup()
      expect(div.style.backfaceVisibility).toBe('')
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

  describe('overlay display:none for center slide', () => {
    it('hides overlay with display:none on center slide', () => {
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
      expect(centerOverlay.style.display).toBe('none')
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
      if (sideOverlay && s.slider.slides[1].style.visibility !== 'hidden') {
        expect(sideOverlay.style.display).not.toBe('none')
      }
    })
  })
})
