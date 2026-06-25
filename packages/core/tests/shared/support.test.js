import { describe, it, expect, vi } from 'vitest'
import {
  supportsPassive,
  supportsTouchEvents,
  supportsPointerEvents,
  supportsScrollSnap,
  prefersReducedMotion,
  passiveListener,
  activeListener,
} from '../../src/shared/support.js'

describe('supportsPassive', () => {
  it('returns a boolean', () => {
    expect(typeof supportsPassive()).toBe('boolean')
  })

  it('caches result', () => {
    const a = supportsPassive()
    const b = supportsPassive()
    expect(a).toBe(b)
  })

  it('returns a cached boolean even when the passive getter is never read', async () => {
    vi.resetModules()
    const add = vi.spyOn(window, 'addEventListener').mockImplementation(() => {})
    vi.spyOn(window, 'removeEventListener').mockImplementation(() => {})

    const fresh = await import('../../src/shared/support.js')
    const first = fresh.supportsPassive()
    expect(typeof first).toBe('boolean')

    const callsAfterFirst = add.mock.calls.length
    fresh.supportsPassive()
    // Second call must use the cache, not re-run the feature detection
    expect(add.mock.calls.length).toBe(callsAfterFirst)

    vi.restoreAllMocks()
  })
})

describe('supportsTouchEvents', () => {
  it('returns a boolean', () => {
    expect(typeof supportsTouchEvents()).toBe('boolean')
  })
})

describe('supportsPointerEvents', () => {
  it('returns a boolean', () => {
    expect(typeof supportsPointerEvents()).toBe('boolean')
  })
})

describe('supportsScrollSnap', () => {
  it('returns a boolean', () => {
    expect(typeof supportsScrollSnap()).toBe('boolean')
  })
})

describe('prefersReducedMotion', () => {
  it('returns a boolean', () => {
    // jsdom does not implement matchMedia — mock it
    window.matchMedia = window.matchMedia || ((query) => ({
      matches: false,
      media: query,
      addListener: () => {},
      removeListener: () => {},
    }))
    expect(typeof prefersReducedMotion()).toBe('boolean')
  })
})

describe('passiveListener / activeListener', () => {
  it('passiveListener returns an object or false', () => {
    const result = passiveListener()
    expect(result === false || (typeof result === 'object' && result.passive === true)).toBe(true)
  })

  it('activeListener returns an object or false', () => {
    const result = activeListener()
    expect(result === false || (typeof result === 'object' && result.passive === false)).toBe(true)
  })
})
