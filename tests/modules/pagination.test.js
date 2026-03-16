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

  it('custom renderBullet callback is used', () => {
    const renderBullet = (i, cls) => `<button class="${cls} custom" data-index="${i}">•${i}</button>`
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { renderBullet },
      },
    })
    cleanup = s.cleanup
    const custom = s.container.querySelectorAll('.drift-pagination__bullet.custom')
    expect(custom.length).toBe(3)
    expect(custom[0].textContent).toBe('•0')
  })

  it('bulletStyle is applied to bullets', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { bulletStyle: { backgroundColor: 'red' } },
      },
    })
    cleanup = s.cleanup
    const bullet = s.container.querySelector('.drift-pagination__bullet')
    expect(bullet.style.backgroundColor).toBe('red')
  })

  it('bulletActiveStyle is applied to active bullet', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { bulletActiveStyle: { backgroundColor: 'blue' } },
      },
    })
    cleanup = s.cleanup
    const active = s.container.querySelector('.drift-pagination__bullet--active')
    expect(active.style.backgroundColor).toBe('blue')
  })

  it('bulletActiveStyle is reset on inactive bullets when no bulletStyle', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { bulletActiveStyle: { backgroundColor: 'blue' } },
      },
    })
    cleanup = s.cleanup
    // Move to slide 1 so slide 0's active style should be reset
    s.slider.slideTo(1, 0)
    const firstBullet = s.container.querySelectorAll('.drift-pagination__bullet')[0]
    // After leaving active, backgroundColor should be cleared
    expect(firstBullet.style.backgroundColor).toBe('')
  })

  it('bulletActiveStyle is replaced by bulletStyle on inactive bullets', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: {
          bulletStyle: { backgroundColor: 'gray' },
          bulletActiveStyle: { backgroundColor: 'blue' },
        },
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(1, 0)
    const firstBullet = s.container.querySelectorAll('.drift-pagination__bullet')[0]
    expect(firstBullet.style.backgroundColor).toBe('gray')
  })

  it('custom renderFraction callback is used', () => {
    const renderFraction = (currentClass, totalClass) =>
      `<em class="${currentClass}"></em> of <strong class="${totalClass}"></strong>`
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { type: 'fraction', renderFraction },
      },
    })
    cleanup = s.cleanup
    const current = s.container.querySelector('.drift-pagination__current')
    expect(current.tagName).toBe('EM')
  })

  it('custom renderProgressbar callback is used', () => {
    const renderProgressbar = (cls) => `<div class="${cls} custom-bar"></div>`
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { type: 'progressbar', renderProgressbar },
      },
    })
    cleanup = s.cleanup
    const bar = s.container.querySelector('.drift-pagination__progress.custom-bar')
    expect(bar).toBeTruthy()
  })

  it('progressStyle is applied to progress element', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: {
          type: 'progressbar',
          progressStyle: { backgroundColor: 'green' },
        },
      },
    })
    cleanup = s.cleanup
    const progress = s.container.querySelector('.drift-pagination__progress')
    expect(progress.style.backgroundColor).toBe('green')
  })

  it('pagination style is applied to container', () => {
    const s = createSlider({
      sliderOptions: {
        modules: [Pagination],
        pagination: { style: { backgroundColor: 'yellow' } },
      },
    })
    cleanup = s.cleanup
    const el = s.container.querySelector('.drift-pagination')
    expect(el.style.backgroundColor).toBe('yellow')
  })

  it('updates fraction current/total on slide change', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [Pagination],
        pagination: { type: 'fraction' },
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    const current = s.container.querySelector('.drift-pagination__current')
    expect(current.textContent).toBe('3')
  })

  it('updates progressbar transform on slide change', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { type: 'progressbar' },
      },
    })
    cleanup = s.cleanup
    s.slider.slideTo(2, 0)
    const progress = s.container.querySelector('.drift-pagination__progress')
    expect(progress.style.transform).toContain('scaleX(1)')
  })

  it('clickable false does not attach click events to bullets', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: {
        modules: [Pagination],
        pagination: { clickable: false },
      },
    })
    cleanup = s.cleanup
    const bullets = s.container.querySelectorAll('.drift-pagination__bullet')
    // Clicking should not navigate
    bullets[2].click()
    expect(s.slider.activeIndex).toBe(0)
  })

  it('progressbar with single slide shows full progress', () => {
    const s = createSlider({
      slideCount: 1,
      sliderOptions: {
        modules: [Pagination],
        pagination: { type: 'progressbar' },
      },
    })
    cleanup = s.cleanup
    const progress = s.container.querySelector('.drift-pagination__progress')
    // total = 1, so progress = 1
    expect(progress.style.transform).toContain('scaleX(1)')
  })

  it('loop mode getTotalSlides returns original slide count', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [Pagination],
        loop: true,
      },
    })
    cleanup = s.cleanup
    // With loop mode, pagination should show 4 bullets (original count), not clones
    const bullets = s.container.querySelectorAll('.drift-pagination__bullet')
    expect(bullets.length).toBe(4)
  })

  it('loop mode bullet click slides to correct index with offset', () => {
    const s = createSlider({
      slideCount: 4,
      sliderOptions: {
        modules: [Pagination],
        loop: true,
      },
    })
    cleanup = s.cleanup
    const bullets = s.container.querySelectorAll('.drift-pagination__bullet')
    bullets[2].click()
    // In loop mode, activeIndex should be adjusted by _loopedSlides offset
    const looped = s.slider._loopedSlides
    expect(s.slider.activeIndex).toBe(looped + 2)
  })

  it('destroy removes bullet click listeners', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [Pagination] },
    })
    const bullets = s.container.querySelectorAll('.drift-pagination__bullet')
    const indexBeforeDestroy = s.slider.activeIndex
    s.cleanup()
    // After destroy, clicking bullets should not change anything
    expect(() => bullets[2].click()).not.toThrow()
    expect(s.slider.activeIndex).toBe(indexBeforeDestroy)
  })

  it('update returns early when paginationEl is null', () => {
    const s = createSlider({
      slideCount: 3,
      sliderOptions: { modules: [Pagination] },
    })
    s.cleanup()
    // After cleanup paginationEl is null — emit slideChange should not throw
    expect(() => s.slider.emit('slideChange')).not.toThrow()
  })
})
