import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  $,
  $$,
  createElement,
  addClass,
  removeClass,
  hasClass,
  getTranslate,
  outerWidth,
  outerHeight,
} from '../../src/shared/dom.js'

describe('$ (querySelector)', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = '<span class="child">hello</span>'
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('queries by selector string', () => {
    const el = $('.child')
    expect(el).toBeTruthy()
    expect(el.textContent).toBe('hello')
  })

  it('uses context parameter', () => {
    const el = $('.child', container)
    expect(el.textContent).toBe('hello')
  })

  it('returns element directly if not a string', () => {
    const div = document.createElement('div')
    expect($(div)).toBe(div)
  })
})

describe('$$ (querySelectorAll)', () => {
  let container

  beforeEach(() => {
    container = document.createElement('div')
    container.innerHTML = '<span class="item">1</span><span class="item">2</span>'
    document.body.appendChild(container)
  })

  afterEach(() => {
    container.remove()
  })

  it('returns array of elements for string selector', () => {
    const els = $$('.item', container)
    expect(Array.isArray(els)).toBe(true)
    expect(els).toHaveLength(2)
  })

  it('converts NodeList to array', () => {
    const nodeList = container.querySelectorAll('.item')
    const arr = $$(nodeList)
    expect(Array.isArray(arr)).toBe(true)
    expect(arr).toHaveLength(2)
  })

  it('wraps single element in array', () => {
    const div = document.createElement('div')
    expect($$(div)).toEqual([div])
  })

  it('returns array as-is', () => {
    const arr = [1, 2, 3]
    expect($$(arr)).toBe(arr)
  })
})

describe('createElement', () => {
  it('creates element with tag', () => {
    const el = createElement('div')
    expect(el.tagName).toBe('DIV')
  })

  it('sets className', () => {
    const el = createElement('div', { className: 'foo bar' })
    expect(el.className).toBe('foo bar')
  })

  it('sets innerHTML', () => {
    const el = createElement('div', { innerHTML: '<b>bold</b>' })
    expect(el.innerHTML).toBe('<b>bold</b>')
  })

  it('sets textContent', () => {
    const el = createElement('span', { textContent: 'hello' })
    expect(el.textContent).toBe('hello')
  })

  it('sets attributes', () => {
    const el = createElement('button', { type: 'button', 'aria-label': 'Close' })
    expect(el.getAttribute('type')).toBe('button')
    expect(el.getAttribute('aria-label')).toBe('Close')
  })

  it('appends string children as text nodes', () => {
    const el = createElement('p', {}, ['Hello'])
    expect(el.textContent).toBe('Hello')
    expect(el.childNodes[0].nodeType).toBe(Node.TEXT_NODE)
  })

  it('appends element children', () => {
    const child = document.createElement('span')
    const el = createElement('div', {}, [child])
    expect(el.children[0]).toBe(child)
  })
})

describe('addClass / removeClass / hasClass', () => {
  it('adds and checks classes', () => {
    const el = document.createElement('div')
    addClass(el, 'foo', 'bar')
    expect(hasClass(el, 'foo')).toBe(true)
    expect(hasClass(el, 'bar')).toBe(true)
  })

  it('removes classes', () => {
    const el = document.createElement('div')
    el.className = 'foo bar baz'
    removeClass(el, 'bar')
    expect(hasClass(el, 'bar')).toBe(false)
    expect(hasClass(el, 'foo')).toBe(true)
  })

  it('filters falsy values', () => {
    const el = document.createElement('div')
    expect(() => addClass(el, '', null, 'valid')).not.toThrow()
    expect(hasClass(el, 'valid')).toBe(true)
  })
})

describe('getTranslate', () => {
  it('returns 0 for no transform', () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    // jsdom getComputedStyle won't have transform
    expect(getTranslate(el, 'x')).toBe(0)
    el.remove()
  })
})

describe('outerWidth / outerHeight', () => {
  it('returns offsetWidth', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetWidth', { value: 200 })
    expect(outerWidth(el)).toBe(200)
  })

  it('returns offsetHeight', () => {
    const el = document.createElement('div')
    Object.defineProperty(el, 'offsetHeight', { value: 100 })
    expect(outerHeight(el)).toBe(100)
  })
})
