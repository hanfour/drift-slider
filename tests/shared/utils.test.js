import { describe, it, expect, vi } from 'vitest'
import {
  uniqueId,
  isObject,
  deepMerge,
  deepMergeDefaults,
  debounce,
  clamp,
  noop,
} from '../../src/shared/utils.js'

describe('uniqueId', () => {
  it('returns a string with default prefix', () => {
    const id = uniqueId()
    expect(id).toMatch(/^drift-\d+$/)
  })

  it('uses custom prefix', () => {
    const id = uniqueId('custom')
    expect(id).toMatch(/^custom-\d+$/)
  })

  it('increments on each call', () => {
    const a = uniqueId()
    const b = uniqueId()
    expect(a).not.toBe(b)
  })
})

describe('isObject', () => {
  it('returns true for plain objects', () => {
    expect(isObject({})).toBe(true)
    expect(isObject({ a: 1 })).toBe(true)
  })

  it('returns false for arrays', () => {
    expect(isObject([])).toBe(false)
  })

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false)
  })

  it('returns false for primitives', () => {
    expect(isObject(42)).toBe(false)
    expect(isObject('str')).toBe(false)
    expect(isObject(undefined)).toBe(false)
    expect(isObject(true)).toBe(false)
  })
})

describe('deepMerge', () => {
  it('merges flat objects', () => {
    const result = deepMerge({}, { a: 1 }, { b: 2 })
    expect(result).toEqual({ a: 1, b: 2 })
  })

  it('deep merges nested objects', () => {
    const result = deepMerge({}, { a: { x: 1 } }, { a: { y: 2 } })
    expect(result).toEqual({ a: { x: 1, y: 2 } })
  })

  it('overwrites non-object values', () => {
    const result = deepMerge({}, { a: 1 }, { a: 2 })
    expect(result.a).toBe(2)
  })

  it('skips non-object sources', () => {
    const result = deepMerge({}, null, { a: 1 })
    expect(result).toEqual({ a: 1 })
  })

  it('mutates and returns the target', () => {
    const target = { a: 1 }
    const result = deepMerge(target, { b: 2 })
    expect(result).toBe(target)
    expect(target.b).toBe(2)
  })
})

describe('deepMergeDefaults', () => {
  it('sets missing keys from source', () => {
    const target = { a: 1 }
    deepMergeDefaults(target, { b: 2 })
    expect(target).toEqual({ a: 1, b: 2 })
  })

  it('does not overwrite existing leaf values', () => {
    const target = { a: 10 }
    deepMergeDefaults(target, { a: 99 })
    expect(target.a).toBe(10)
  })

  it('recursively fills missing sub-keys', () => {
    const target = { nav: { color: 'red' } }
    deepMergeDefaults(target, { nav: { color: 'blue', size: 10 } })
    expect(target.nav.color).toBe('red')
    expect(target.nav.size).toBe(10)
  })

  it('expands primitive target to object when source is object', () => {
    const target = { pagination: true }
    deepMergeDefaults(target, { pagination: { type: 'bullets', clickable: true } })
    expect(target.pagination).toEqual({ type: 'bullets', clickable: true })
  })
})

describe('debounce', () => {
  it('delays function execution', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it('resets timer on subsequent calls', () => {
    vi.useFakeTimers()
    const fn = vi.fn()
    const debounced = debounce(fn, 100)

    debounced()
    vi.advanceTimersByTime(50)
    debounced()
    vi.advanceTimersByTime(99)
    expect(fn).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5)
  })

  it('clamps to min', () => {
    expect(clamp(-1, 0, 10)).toBe(0)
  })

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10)
  })
})

describe('noop', () => {
  it('is a function that returns undefined', () => {
    expect(typeof noop).toBe('function')
    expect(noop()).toBeUndefined()
  })
})
