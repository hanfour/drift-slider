export default {
  on(event, handler, priority) {
    if (typeof handler !== 'function') return this;
    if (!this._events) this._events = {};
    if (!this._events[event]) this._events[event] = [];

    this._events[event].push({ handler, priority: priority || false });
    return this;
  },

  once(event, handler, priority) {
    if (typeof handler !== 'function') return this;
    if (!this._events) this._events = {};

    const onceHandler = (...args) => {
      this.off(event, onceHandler);
      handler.apply(this, args);
    };
    onceHandler._original = handler;
    return this.on(event, onceHandler, priority);
  },

  off(event, handler) {
    if (!this._events || !this._events[event]) return this;

    if (!handler) {
      this._events[event] = [];
    } else {
      this._events[event] = this._events[event].filter(
        (h) => h.handler !== handler && h.handler._original !== handler
      );
    }
    return this;
  },

  emit(event, ...args) {
    if (!this._events || !this._events[event]) return this;

    const handlers = [...this._events[event]];
    // Priority handlers first
    handlers.sort((a, b) => (b.priority ? 1 : 0) - (a.priority ? 1 : 0));

    for (const { handler } of handlers) {
      // Isolate handlers: one throwing listener must not abort the rest
      // (internal modules and user callbacks share the same event bus).
      try {
        handler.apply(this, args);
      } catch (err) {
        console.error(`DriftSlider: error in "${event}" handler`, err);
      }
    }
    return this;
  },
};
