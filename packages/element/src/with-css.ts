import css from 'virtual:drift-slider-bundle-css';

if (typeof document !== 'undefined' && !document.querySelector('style[data-drift-element-css]')) {
  const style = document.createElement('style');
  style.setAttribute('data-drift-element-css', '');
  style.textContent = css;
  document.head.appendChild(style);
}
