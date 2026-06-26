import { describe, it, expect, vi, afterEach } from 'vitest'
import DriftSlider from '../src/drift-slider.js'
import { createSlider, createDOM } from './helpers/create-slider.js'

describe('DriftSlider', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('creates instance with default options', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.slider).toBeInstanceOf(DriftSlider)
  })

  it('throws when container not found', () => {
    expect(() => new DriftSlider('#nonexistent')).toThrow('container element not found')
  })

  it('throws when list element not found', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    expect(() => new DriftSlider(el)).toThrow('list element')
    el.remove()
  })

  it('accepts string selector', () => {
    const dom = createDOM()
    const originalGetComputedStyle = window.getComputedStyle
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const real = originalGetComputedStyle(el)
      return new Proxy(real, {
        get(target, prop) {
          if (prop === 'transform' || prop === 'webkitTransform') {
            return el.style.transform || 'matrix(1, 0, 0, 1, 0, 0)'
          }
          if (prop === 'marginLeft' || prop === 'marginRight' ||
              prop === 'marginTop' || prop === 'marginBottom') {
            return '0px'
          }
          return target[prop]
        },
      })
    })
    const slider = new DriftSlider('.drift-slider')
    expect(slider).toBeInstanceOf(DriftSlider)
    slider.destroy()
    dom.cleanup()
    vi.restoreAllMocks()
  })

  it('stores instance on element', () => {
    const s = createSlider()
    cleanup = s.cleanup
    expect(s.container.driftSlider).toBe(s.slider)
  })

  it('has unique id', () => {
    const s1 = createSlider()
    const s2 = createSlider()
    expect(s1.slider.id).not.toBe(s2.slider.id)
    s1.cleanup()
    s2.cleanup()
    cleanup = null
  })

  it('emits init event', () => {
    const handler = vi.fn()
    const s = createSlider({ sliderOptions: { on: { init: handler } } })
    cleanup = s.cleanup
    expect(handler).toHaveBeenCalledWith(s.slider)
  })

  it('destroy cleans up', () => {
    const s = createSlider()
    cleanup = () => s.container.remove()
    s.slider.destroy()
    expect(s.slider.destroyed).toBe(true)
    expect(s.container.driftSlider).toBeNull()
  })

  it('destroy emits beforeDestroy and destroy events', () => {
    const beforeDestroy = vi.fn()
    const destroy = vi.fn()
    const s = createSlider({
      sliderOptions: { on: { beforeDestroy, destroy } },
    })
    cleanup = () => s.container.remove()
    s.slider.destroy()
    expect(beforeDestroy).toHaveBeenCalled()
    expect(destroy).toHaveBeenCalled()
  })

  it('enable/disable toggles touch and lock state', () => {
    const s = createSlider()
    cleanup = s.cleanup
    s.slider.disable()
    expect(s.slider.isLocked).toBe(true)
    expect(s.slider.params.touchEnabled).toBe(false)
    s.slider.enable()
    expect(s.slider.isLocked).toBe(false)
    expect(s.slider.params.touchEnabled).toBe(true)
  })

  it('static use() registers global module', () => {
    const mod = vi.fn()
    DriftSlider.use(mod)
    const s = createSlider()
    cleanup = s.cleanup
    expect(mod).toHaveBeenCalled()
  })

  it('initialSlide option sets starting index', () => {
    const s = createSlider({ sliderOptions: { initialSlide: 2 } })
    cleanup = s.cleanup
    expect(s.slider.activeIndex).toBe(2)
  })
})
