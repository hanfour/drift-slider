export function $(selector, context = document) {
  if (typeof selector === 'string') {
    return context.querySelector(selector);
  }
  return selector;
}

export function $$(selector, context = document) {
  if (typeof selector === 'string') {
    return Array.from(context.querySelectorAll(selector));
  }
  if (selector instanceof NodeList || selector instanceof HTMLCollection) {
    return Array.from(selector);
  }
  return Array.isArray(selector) ? selector : [selector];
}

export function createElement(tag, attrs = {}, children = []) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = val;
    } else if (key === 'innerHTML') {
      el.innerHTML = val;
    } else if (key === 'textContent') {
      el.textContent = val;
    } else {
      el.setAttribute(key, val);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  }
  return el;
}

export function addClass(el, ...classes) {
  el.classList.add(...classes.filter(Boolean));
}

export function removeClass(el, ...classes) {
  el.classList.remove(...classes.filter(Boolean));
}

export function hasClass(el, cls) {
  return el.classList.contains(cls);
}

export function getTranslate(el, axis = 'x') {
  const style = window.getComputedStyle(el);
  const transform = style.transform || style.webkitTransform;
  if (!transform || transform === 'none') return 0;

  const match = transform.match(/matrix\((.+)\)/);
  if (!match) return 0;

  const values = match[1].split(',').map(Number);
  // matrix(a, b, c, d, tx, ty)
  return axis === 'x' ? values[4] : values[5];
}

export function outerWidth(el, includeMargin = false) {
  let width = el.offsetWidth;
  if (includeMargin) {
    const style = window.getComputedStyle(el);
    width += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
  }
  return width;
}

export function outerHeight(el, includeMargin = false) {
  let height = el.offsetHeight;
  if (includeMargin) {
    const style = window.getComputedStyle(el);
    height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  }
  return height;
}
