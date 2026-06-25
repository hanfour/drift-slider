import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'

describe('core/update', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('calculates containerSize from clientWidth', () => {
    const s = createSlider({ containerWidth: 1000 })
    cleanup = s.cleanup
    expect(s.slider.containerSize).toBe(1000)
  })

  it('calculates slideSize for single slide per view', () => {
    const s = createSlider({ containerWidth: 800 })
    cleanup = s.cleanup
    expect(s.slider.slideSize).toBe(800)
  })

  it('calculates slideSize with slidesPerView > 1', () => {
    const s = createSlider({ sliderOptions: { slidesPerView: 2, spaceBetween: 20 } })
    cleanup = s.cleanup
    // (800 - 20) / 2 = 390
    expect(s.slider.slideSize).toBe(390)
  })

  it('builds snapGrid with correct length', () => {
    const s = createSlider({ slideCount: 5 })
    cleanup = s.cleanup
    expect(s.slider.snapGrid).toHaveLength(5)
  })

  it('calculates minTranslate correctly', () => {
    const s = createSlider({ slideCount: 3, containerWidth: 800 })
    cleanup = s.cleanup
    // totalSize = 3 * 800 + 0 = 2400, min = -(2400 - 800) = -1600
    expect(s.slider.minTranslate).toBe(-1600)
  })

  it('sets maxTranslate to 0', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.slider.maxTranslate).toBe(0)
  })

  it('sets isLocked when only 1 snap point', () => {
    const s = createSlider({ slideCount: 1 })
    cleanup = s.cleanup
    expect(s.slider.isLocked).toBe(true)
  })

  it('emits update event on update()', () => {
    const s = createSlider()
    cleanup = s.cleanup
    let called = false
    s.slider.on('update', () => { called = true })
    s.slider.update()
    expect(called).toBe(true)
  })

  it('refreshSlides re-queries the slide elements from the list', () => {
    const s = createSlider({ slideCount: 3 })
    cleanup = s.cleanup
    const extra = document.createElement('li')
    extra.className = 'drift-slide'
    s.slider.listEl.appendChild(extra)
    s.slider.refreshSlides()
    expect(s.slider.slides.length).toBe(4)
  })

  it('skips list/slide sizing for any module that sets _managesOwnLayout', () => {
    // Declarative contract: core asks the flag, not a hardcoded effect-name list.
    const CustomLayout = ({ slider }) => { slider._managesOwnLayout = true }
    const s = createSlider({ slideCount: 5, sliderOptions: { modules: [CustomLayout] } })
    cleanup = s.cleanup
    s.slider.update()
    expect(s.slider.listEl.style.width).toBe('')
  })

  describe('snapGrid end clamping (slidesPerView > 1)', () => {
    it('no snap point overscrolls past minTranslate', () => {
      const s = createSlider({ slideCount: 5, containerWidth: 800, sliderOptions: { slidesPerView: 2, spaceBetween: 0 } })
      cleanup = s.cleanup
      // slideSize 400, raw grid would be [0,400,800,1200,1600] but minTranslate is -1200
      const maxSnap = -s.slider.minTranslate
      expect(Math.max(...s.slider.snapGrid)).toBeLessThanOrEqual(maxSnap)
    })

    it('sliding to the last snap point does not move past the content end', () => {
      const s = createSlider({ slideCount: 5, containerWidth: 800, sliderOptions: { slidesPerView: 2, spaceBetween: 0 } })
      cleanup = s.cleanup
      s.slider.slideTo(s.slider.snapGrid.length - 1, 0)
      expect(s.slider.translate).toBeGreaterThanOrEqual(s.slider.minTranslate)
    })

    it('keeps a full per-slide snapGrid when slides fill evenly (slidesPerView 1)', () => {
      const s = createSlider({ slideCount: 5 })
      cleanup = s.cleanup
      expect(s.slider.snapGrid).toHaveLength(5)
    })
  })

  describe('centeredSlides', () => {
    // container 800, slidesPerView 2, spaceBetween 0 → slideSize 400, offset 200
    const opts = { centeredSlides: true, slidesPerView: 2, spaceBetween: 0 }

    it('shifts maxTranslate by the centering offset', () => {
      const s = createSlider({ slideCount: 5, containerWidth: 800, sliderOptions: opts })
      cleanup = s.cleanup
      expect(s.slider.maxTranslate).toBe(200)
    })

    it('centers the first slide on init (translate equals offset)', () => {
      const s = createSlider({ slideCount: 5, containerWidth: 800, sliderOptions: opts })
      cleanup = s.cleanup
      expect(s.slider.translate).toBe(200)
    })

    it('offsets snapGrid so each slide can sit centered', () => {
      const s = createSlider({ slideCount: 5, containerWidth: 800, sliderOptions: opts })
      cleanup = s.cleanup
      expect(s.slider.snapGrid[0]).toBe(-200)
    })

    it('centers a middle slide after slideTo', () => {
      const s = createSlider({ slideCount: 5, containerWidth: 800, sliderOptions: opts })
      cleanup = s.cleanup
      s.slider.slideTo(2, 0)
      // slide 2 natural position 800, centered translate = offset - 800 = -600
      expect(s.slider.translate).toBe(-600)
    })

    it('minTranslate centers the last slide', () => {
      const s = createSlider({ slideCount: 5, containerWidth: 800, sliderOptions: opts })
      cleanup = s.cleanup
      // last slide position = 4 * 400 = 1600, centered = 200 - 1600 = -1400
      expect(s.slider.minTranslate).toBe(-1400)
    })
  })
})
