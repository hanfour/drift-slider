import { describe, it, expect, afterEach } from 'vitest'
import { createSlider } from '../helpers/create-slider.js'
import Pagination from '../../src/modules/pagination/pagination.js'

describe('module/pagination', () => {
  let cleanup

  afterEach(() => cleanup?.())

  it('creates pagination element', () => {
    const s = createSlider({ sliderOptions: { modules: [Pagination] } })
    cleanup = s.cleanup
    const el = s.container.querySelector('.drift-pagination')
    expect(el).toBeTruthy()
  })

  it('renders bullets by default', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [Pagination] },
    })
    cleanup = s.cleanup
    const bullets = s.container.querySelectorAll('.drift-pagination__bullet')
    expect(bullets.length).toBe(3)
  })

  it('marks active bullet', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [Pagination] },
    })
    cleanup = s.cleanup
    const active = s.container.querySelector('.drift-pagination__bullet--active')
    expect(active).toBeTruthy()
  })

  it('clicking bullet navigates to slide', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [Pagination] },
    })
    cleanup = s.cleanup
    const bullets = s.container.querySelectorAll('.drift-pagination__bullet')
    bullets[2].click()
    expect(s.slider.activeIndex).toBe(2)
  })

  it('renders fraction type', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { type: 'fraction' },
      },
    })
    cleanup = s.cleanup
    const current = s.container.querySelector('.drift-pagination__current')
    const total = s.container.querySelector('.drift-pagination__total')
    expect(current).toBeTruthy()
    expect(total).toBeTruthy()
    expect(total.textContent).toBe('3')
  })

  it('renders progressbar type', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { type: 'progressbar' },
      },
    })
    cleanup = s.cleanup
    const progress = s.container.querySelector('.drift-pagination__progress')
    expect(progress).toBeTruthy()
  })

  it('sets ARIA attributes on pagination', () => {
    const s = createSlider({ sliderOptions: { modules: [Pagination] } })
    cleanup = s.cleanup
    const el = s.container.querySelector('.drift-pagination')
    expect(el.getAttribute('role')).toBe('tablist')
  })

  it('bullets have aria-label', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [Pagination] },
    })
    cleanup = s.cleanup
    const bullet = s.container.querySelector('.drift-pagination__bullet')
    expect(bullet.getAttribute('aria-label')).toMatch(/slide/i)
  })
})
