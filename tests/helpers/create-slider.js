import DriftSlider from '../../src/drift-slider.js'

/**
 * Create a standard DriftSlider DOM fixture with mocked dimensions.
 *
 * @param {object} [options]
 * @param {number} [options.slideCount=5]      Number of slides
 * @param {number} [options.containerWidth=800] Mocked container width
 * @param {number} [options.containerHeight=400] Mocked container height
 * @param {object} [options.sliderOptions={}]  Options forwarded to DriftSlider
 * @returns {{ slider: DriftSlider, container: HTMLElement, cleanup: () => void }}
 */
export function createSlider({
  slideCount = 5,
  containerWidth = 800,
  containerHeight = 400,
  sliderOptions = {},
} = {}) {
  // Build DOM
  const container = document.createElement('section')
  container.className = 'drift-slider'

  const track = document.createElement('div')
  track.className = 'drift-track'

  const list = document.createElement('ul')
  list.className = 'drift-list'

  for (let i = 0; i < slideCount; i++) {
    const slide = document.createElement('li')
    slide.className = 'drift-slide'
    slide.textContent = `Slide ${i + 1}`
    list.appendChild(slide)
  }

  track.appendChild(list)
  container.appendChild(track)
  document.body.appendChild(container)

  // Mock dimensions (jsdom has no layout engine)
  Object.defineProperty(container, 'clientWidth', { value: containerWidth, configurable: true })
  Object.defineProperty(container, 'clientHeight', { value: containerHeight, configurable: true })

  // Mock offsetWidth/offsetHeight on slides
  const slides = list.querySelectorAll('.drift-slide')
  slides.forEach((slide) => {
    Object.defineProperty(slide, 'offsetWidth', { value: containerWidth, configurable: true })
    Object.defineProperty(slide, 'offsetHeight', { value: containerHeight, configurable: true })
  })

  // Mock getComputedStyle to return a default transform matrix
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

  const slider = new DriftSlider(container, sliderOptions)

  function cleanup() {
    slider.destroy()
    container.remove()
    vi.restoreAllMocks()
  }

  return { slider, container, cleanup }
}

/**
 * Build raw DOM fixture without creating a DriftSlider instance.
 */
export function createDOM({ slideCount = 5, containerWidth = 800, containerHeight = 400 } = {}) {
  const container = document.createElement('section')
  container.className = 'drift-slider'

  const track = document.createElement('div')
  track.className = 'drift-track'

  const list = document.createElement('ul')
  list.className = 'drift-list'

  for (let i = 0; i < slideCount; i++) {
    const slide = document.createElement('li')
    slide.className = 'drift-slide'
    slide.textContent = `Slide ${i + 1}`
    list.appendChild(slide)
  }

  track.appendChild(list)
  container.appendChild(track)
  document.body.appendChild(container)

  Object.defineProperty(container, 'clientWidth', { value: containerWidth, configurable: true })
  Object.defineProperty(container, 'clientHeight', { value: containerHeight, configurable: true })

  const slides = list.querySelectorAll('.drift-slide')
  slides.forEach((slide) => {
    Object.defineProperty(slide, 'offsetWidth', { value: containerWidth, configurable: true })
    Object.defineProperty(slide, 'offsetHeight', { value: containerHeight, configurable: true })
  })

  function cleanup() {
    container.remove()
  }

  return { container, cleanup }
}
