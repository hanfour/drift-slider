import { $, $$, createElement, addClass, removeClass } from '../../shared/dom.js';

export default function Pagination({ slider, extendParams, on }) {
  extendParams({
    pagination: {
      el: null,
      type: 'bullets',       // 'bullets' | 'fraction' | 'progressbar'
      clickable: true,
      bulletClass: 'drift-pagination__bullet',
      bulletActiveClass: 'drift-pagination__bullet--active',
      currentClass: 'drift-pagination__current',
      totalClass: 'drift-pagination__total',
      progressClass: 'drift-pagination__progress',
      renderBullet: null,     // (index, className) => string
      renderFraction: null,   // (currentClass, totalClass) => string
      renderProgressbar: null, // (progressClass) => string
      style: null,
      bulletStyle: null,
      bulletActiveStyle: null,
      progressStyle: null,
    },
  });

  let paginationEl = null;
  let bullets = [];

  function getTotalSlides() {
    if (slider.params.loop && slider._loopedSlides) {
      return slider.slides.length - slider._loopedSlides * 2;
    }
    return slider.snapGrid.length;
  }

  function renderBullets() {
    const params = slider.params.pagination;
    const total = getTotalSlides();
    let html = '';

    for (let i = 0; i < total; i++) {
      if (typeof params.renderBullet === 'function') {
        html += params.renderBullet(i, params.bulletClass);
      } else {
        html += `<span class="${params.bulletClass}" data-index="${i}" tabindex="0" role="button" aria-label="Go to slide ${i + 1}"></span>`;
      }
    }

    paginationEl.innerHTML = html;
    bullets = $$(`.${params.bulletClass}`, paginationEl);

    if (params.bulletStyle) {
      bullets.forEach((bullet) => {
        Object.assign(bullet.style, params.bulletStyle);
      });
    }

    if (params.clickable) {
      bullets.forEach((bullet) => {
        bullet.addEventListener('click', onBulletClick);
      });
    }
  }

  function renderFraction() {
    const params = slider.params.pagination;

    if (typeof params.renderFraction === 'function') {
      paginationEl.innerHTML = params.renderFraction(
        params.currentClass,
        params.totalClass
      );
    } else {
      paginationEl.innerHTML =
        `<span class="${params.currentClass}"></span>` +
        ' / ' +
        `<span class="${params.totalClass}"></span>`;
    }
  }

  function renderProgressbar() {
    const params = slider.params.pagination;

    if (typeof params.renderProgressbar === 'function') {
      paginationEl.innerHTML = params.renderProgressbar(params.progressClass);
    } else {
      paginationEl.innerHTML = `<span class="${params.progressClass}"></span>`;
    }

    if (params.progressStyle) {
      const progressEl = $(`.${params.progressClass}`, paginationEl);
      if (progressEl) {
        Object.assign(progressEl.style, params.progressStyle);
      }
    }
  }

  function update() {
    if (!paginationEl) return;

    const params = slider.params.pagination;
    const current = slider.realIndex;
    const total = getTotalSlides();

    if (params.type === 'bullets') {
      bullets.forEach((bullet, i) => {
        if (i === current) {
          addClass(bullet, params.bulletActiveClass);
          bullet.setAttribute('aria-current', 'true');
          if (params.bulletActiveStyle) {
            Object.assign(bullet.style, params.bulletActiveStyle);
          }
        } else {
          removeClass(bullet, params.bulletActiveClass);
          bullet.removeAttribute('aria-current');
          if (params.bulletActiveStyle && params.bulletStyle) {
            Object.assign(bullet.style, params.bulletStyle);
          } else if (params.bulletActiveStyle) {
            // Reset active styles to defaults
            Object.keys(params.bulletActiveStyle).forEach((key) => {
              bullet.style[key] = '';
            });
          }
        }
      });
    } else if (params.type === 'fraction') {
      const currentEl = $(`.${params.currentClass}`, paginationEl);
      const totalEl = $(`.${params.totalClass}`, paginationEl);
      if (currentEl) currentEl.textContent = current + 1;
      if (totalEl) totalEl.textContent = total;
    } else if (params.type === 'progressbar') {
      const progressEl = $(`.${params.progressClass}`, paginationEl);
      if (progressEl) {
        const progress = total > 1 ? current / (total - 1) : 1;
        progressEl.style.transform = `scaleX(${progress})`;
      }
    }
  }

  function onBulletClick(e) {
    const index = parseInt(e.currentTarget.getAttribute('data-index'), 10);
    if (isNaN(index)) return;

    if (slider.params.loop && slider._loopedSlides) {
      slider.slideTo(index + slider._loopedSlides);
    } else {
      slider.slideTo(index);
    }
  }

  function init() {
    const params = slider.params.pagination;
    if (!params) return;

    // Find element
    if (params.el) {
      paginationEl = typeof params.el === 'string' ? $(params.el, slider.el) : params.el;
    }
    if (!paginationEl) {
      paginationEl = $('.drift-pagination', slider.el);
    }
    if (!paginationEl) {
      paginationEl = createElement('div', { className: 'drift-pagination' });
      slider.el.appendChild(paginationEl);
    }

    if (params.style) {
      Object.assign(paginationEl.style, params.style);
    }

    // Add type class
    addClass(paginationEl, `drift-pagination--${params.type}`);

    // Set role
    paginationEl.setAttribute('role', 'tablist');
    paginationEl.setAttribute('aria-label', 'Slide pagination');

    // Render
    if (params.type === 'bullets') {
      renderBullets();
    } else if (params.type === 'fraction') {
      renderFraction();
    } else if (params.type === 'progressbar') {
      renderProgressbar();
    }

    update();
  }

  function destroy() {
    if (bullets.length) {
      bullets.forEach((bullet) => {
        bullet.removeEventListener('click', onBulletClick);
      });
    }
    bullets = [];
    paginationEl = null;
  }

  on('init', init);
  on('slideChange', update);
  on('destroy', destroy);

  slider.pagination = { update, render: init, el: paginationEl };
}
