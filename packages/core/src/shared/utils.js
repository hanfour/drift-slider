let idCounter = 0;

export function uniqueId(prefix = 'drift') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function deepMerge(target, ...sources) {
  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      // Guard against prototype pollution from untrusted config (e.g. JSON)
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }
      const val = source[key];
      if (Array.isArray(val)) {
        // Clone arrays so the merged result does not alias the source
        target[key] = val.slice();
      } else if (isObject(val) && isObject(target[key])) {
        target[key] = deepMerge({}, target[key], val);
      } else {
        // Assign by reference for everything else, including class instances
        // (e.g. a thumbs slider instance) which must not be cloned
        target[key] = val;
      }
    }
  }
  return target;
}

/**
 * Like deepMerge but only sets keys that don't already exist in target.
 * Used by extendParams so module defaults don't overwrite user options.
 */
export function deepMergeDefaults(target, ...sources) {
  for (const source of sources) {
    if (!isObject(source)) continue;
    for (const key of Object.keys(source)) {
      if (!(key in target)) {
        // Key doesn't exist in target, set it
        target[key] = isObject(source[key]) ? deepMerge({}, source[key]) : source[key];
      } else if (isObject(source[key]) && isObject(target[key])) {
        // Both are objects, recurse to fill missing sub-keys
        deepMergeDefaults(target[key], source[key]);
      } else if (isObject(source[key]) && !isObject(target[key])) {
        // Source is an object but target is a primitive (e.g. false/true/null).
        // Module's extendParams provides the full default object — use it.
        // The module being loaded means the user wants this feature.
        target[key] = deepMerge({}, source[key]);
      }
      // else: key exists in target as a leaf and source is also a leaf — keep user's value
    }
  }
  return target;
}

export function debounce(fn, delay) {
  let timer;
  function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  }
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  return debounced;
}

export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

export function noop() {}
