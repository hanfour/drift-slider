/* DriftSlider Docs — Shared Logic */
(function () {
  'use strict';

  // ─── 1. HTML Include ───────────────────────────────────────────────
  function loadIncludes() {
    var els = document.querySelectorAll('[data-include]');
    var promises = [];
    els.forEach(function (el) {
      var src = el.getAttribute('data-include');
      promises.push(
        fetch(src)
          .then(function (r) { return r.text(); })
          .then(function (html) {
            el.innerHTML = html;
            el.removeAttribute('data-include');
          })
      );
    });
    return Promise.all(promises);
  }

  // ─── 2. Active Nav ─────────────────────────────────────────────────
  function setActiveNav() {
    var page = location.pathname.split('/').pop().replace('.html', '') || 'index';
    // demos sub-pages → highlight "demos"
    if (location.pathname.indexOf('/demos/') !== -1) page = 'demos';
    var links = document.querySelectorAll('.main-nav a[data-nav]');
    links.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('data-nav') === page);
    });
  }

  // ─── 3. Sidebar Scroll Spy ─────────────────────────────────────────
  function initScrollSpy() {
    var sidebarLinks = document.querySelectorAll('.sidebar-nav a[href^="#"]');
    if (!sidebarLinks.length) return;

    var headings = [];
    sidebarLinks.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) headings.push({ el: el, link: a });
    });

    if (!headings.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          sidebarLinks.forEach(function (l) { l.classList.remove('active'); });
          var match = headings.find(function (h) { return h.el === entry.target; });
          if (match) match.link.classList.add('active');
        }
      });
    }, {
      rootMargin: '-80px 0px -70% 0px',
      threshold: 0
    });

    headings.forEach(function (h) { observer.observe(h.el); });
  }

  // ─── 4. Hamburger Menu ─────────────────────────────────────────────
  function initHamburger() {
    var btn = document.getElementById('hamburger');
    var nav = document.getElementById('main-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', !open);
      nav.classList.toggle('open', !open);
    });
    // Close on link click
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        btn.setAttribute('aria-expanded', 'false');
        nav.classList.remove('open');
      }
    });
  }

  // ─── 5. Code Copy Buttons ──────────────────────────────────────────
  function initCodeCopy() {
    document.querySelectorAll('.code-block').forEach(function (block) {
      if (block.querySelector('.copy-btn')) return;
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = 'Copy';
      btn.addEventListener('click', function () {
        var code = block.querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent).then(function () {
          btn.textContent = 'Copied!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'Copy';
            btn.classList.remove('copied');
          }, 2000);
        });
      });
      block.appendChild(btn);
    });
  }

  // ─── 6. Code Tabs ──────────────────────────────────────────────────
  function initCodeTabs() {
    document.querySelectorAll('.code-tabs').forEach(function (tabs) {
      var btns = tabs.querySelectorAll('.tab-btn');
      var panels = tabs.querySelectorAll('.tab-panel');
      btns.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var target = btn.getAttribute('data-tab');
          btns.forEach(function (b) { b.classList.remove('active'); });
          panels.forEach(function (p) { p.classList.remove('active'); });
          btn.classList.add('active');
          var panel = tabs.querySelector('.tab-panel[data-tab="' + target + '"]');
          if (panel) panel.classList.add('active');
        });
      });
    });
  }

  // ─── 7. i18n Toggle ────────────────────────────────────────────────
  function initI18n() {
    var saved = localStorage.getItem('ds-lang') || 'en';
    applyLang(saved);

    document.addEventListener('click', function (e) {
      var span = e.target.closest('.lang-toggle span[data-lang]');
      if (!span) return;
      var lang = span.getAttribute('data-lang');
      applyLang(lang);
      localStorage.setItem('ds-lang', lang);
    });
  }

  function applyLang(lang) {
    document.documentElement.lang = lang === 'zh' ? 'zh-Hant' : 'en';
    // Update toggle UI
    document.querySelectorAll('.lang-toggle span[data-lang]').forEach(function (s) {
      s.classList.toggle('active', s.getAttribute('data-lang') === lang);
    });
  }

  // ─── 8. Smooth Scroll ──────────────────────────────────────────────
  function initSmoothScroll() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href').slice(1);
      var target = document.getElementById(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', '#' + id);
      }
    });
  }

  // ─── Init ──────────────────────────────────────────────────────────
  function init() {
    loadIncludes().then(function () {
      setActiveNav();
      initHamburger();
      initI18n();
    });
    initScrollSpy();
    initCodeCopy();
    initCodeTabs();
    initSmoothScroll();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
