import { describe, it, expect, vi } from 'vitest'
import eventsEmitter from '../src/events-emitter.js'

function createEmitter() {
  const obj = {}
  Object.assign(obj, eventsEmitter)
  return obj
}

describe('EventsEmitter', () => {
  describe('on / emit', () => {
    it('registers and triggers handler', () => {
      const emitter = createEmitter()
      const handler = vi.fn()
      emitter.on('test', handler)
      emitter.emit('test', 'arg1', 'arg2')
      expect(handler).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('supports multiple handlers', () => {
      const emitter = createEmitter()
      const h1 = vi.fn()
      const h2 = vi.fn()
      emitter.on('test', h1)
      emitter.on('test', h2)
      emitter.emit('test')
      expect(h1).toHaveBeenCalled()
      expect(h2).toHaveBeenCalled()
    })

    it('returns this for chaining', () => {
      const emitter = createEmitter()
      const result = emitter.on('test', () => {})
      expect(result).toBe(emitter)
    })
  })

  describe('off', () => {
    it('removes specific handler', () => {
      const emitter = createEmitter()
      const handler = vi.fn()
      emitter.on('test', handler)
      emitter.off('test', handler)
      emitter.emit('test')
      expect(handler).not.toHaveBeenCalled()
    })

    it('removes all handlers when no handler specified', () => {
      const emitter = createEmitter()
      const h1 = vi.fn()
      const h2 = vi.fn()
      emitter.on('test', h1)
      emitter.on('test', h2)
      emitter.off('test')
      emitter.emit('test')
      expect(h1).not.toHaveBeenCalled()
      expect(h2).not.toHaveBeenCalled()
    })

    it('returns this for chaining', () => {
      const emitter = createEmitter()
      expect(emitter.off('test')).toBe(emitter)
    })
  })

  describe('once', () => {
    it('handler fires only once', () => {
      const emitter = createEmitter()
      const handler = vi.fn()
      emitter.once('test', handler)
      emitter.emit('test')
      emitter.emit('test')
      expect(handler).toHaveBeenCalledOnce()
    })

    it('can be removed before firing', () => {
      const emitter = createEmitter()
      const handler = vi.fn()
      emitter.once('test', handler)
      emitter.off('test', handler)
      emitter.emit('test')
      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('priority', () => {
    it('priority handlers fire first', () => {
      const emitter = createEmitter()
      const order = []
      emitter.on('test', () => order.push('normal'))
      emitter.on('test', () => order.push('priority'), true)
      emitter.emit('test')
      expect(order).toEqual(['priority', 'normal'])
    })
  })

  describe('emit without listeners', () => {
    it('does not throw when no events registered', () => {
      const emitter = createEmitter()
      expect(() => emitter.emit('nonexistent')).not.toThrow()
    })
  })
})
