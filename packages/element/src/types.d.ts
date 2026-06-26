// Allow importing the virtual CSS module (handled by esbuild plugin at build time; resolves to drift-slider/css/bundle)
declare module 'virtual:drift-slider-bundle-css' {
  const css: string;
  export default css;
}
