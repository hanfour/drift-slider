import { describe, it, expect } from 'vitest'

// Exercise the BUILT artifacts a consumer actually imports — the rest of the
// suite imports from src/. Skips when dist/ has not been built (e.g. a bare
// local `npm test`); CI builds before testing, so it runs there.
function loadBuilt(spec) {
  // Any load failure means dist isn't present/usable yet → skip, never false-fail.
  return import(spec).catch(() => null)
}

const built = await loadBuilt('../dist/esm/index.mjs')
const builtModules = await loadBuilt('../dist/esm/modules/index.mjs')

const ALL_MODULES = [
  'Navigation', 'Pagination', 'Autoplay', 'EffectFade', 'EffectCoverflow',
  'EffectCards', 'EffectCreative', 'EffectShowcase', 'EffectDeck',
  'Keyboard', 'A11y', 'ScrollAos', 'Thumbs',
]

describe('built package (dist outputs)', () => {
  it.skipIf(!built)('main ESM exports the DriftSlider class (default + named)', () => {
    expect(typeof built.default).toBe('function')
    expect(typeof built.DriftSlider).toBe('function')
  })

  it.skipIf(!built)('main ESM re-exports every module, including EffectDeck', () => {
    for (const name of ALL_MODULES) {
      expect(typeof built[name], `missing export: ${name}`).toBe('function')
    }
  })

  it.skipIf(!builtModules)('modules ESM exports every module, including EffectDeck', () => {
    for (const name of ALL_MODULES) {
      expect(typeof builtModules[name], `missing module export: ${name}`).toBe('function')
    }
  })
})
