# Contributing to DriftSlider

Thank you for your interest in contributing to DriftSlider! This guide will help you get started.

## Development Setup

1. **Fork & Clone**

   ```bash
   git clone https://github.com/<your-username>/drift-slider.git
   cd drift-slider
   npm install
   ```

2. **Start Development**

   ```bash
   npm run dev    # Watch mode — rebuilds on file changes
   ```

3. **Run Tests**

   ```bash
   npm test              # Run all tests once
   npm run test:watch    # Watch mode
   npm run test:coverage # With coverage report
   ```

4. **Build**

   ```bash
   npm run build       # JS bundles (ESM, CJS, UMD)
   npm run build:css   # Compile SCSS → CSS
   ```

## Project Structure

```
src/
├── index.js              # Main entry, re-exports
├── defaults.js           # Default configuration
├── drift-slider.js       # Core DriftSlider class
├── events-emitter.js     # Event system mixin
├── shared/
│   ├── utils.js          # Pure utility functions
│   ├── dom.js            # DOM helper functions
│   └── support.js        # Browser feature detection
├── core/
│   ├── update.js         # Layout calculation
│   ├── translate.js      # Position transforms
│   ├── transition.js     # Animation control
│   ├── slide.js          # Slide navigation API
│   ├── classes.js        # CSS class management
│   ├── events.js         # DOM event handling
│   ├── grab-cursor.js    # Cursor styling
│   ├── touch.js          # Touch/pointer interaction
│   ├── loop.js           # Infinite loop
│   └── breakpoints.js    # Responsive breakpoints
├── modules/
│   ├── navigation/       # Prev/Next buttons
│   ├── pagination/       # Bullets, fraction, progressbar
│   ├── autoplay/         # Auto-advance slides
│   ├── keyboard/         # Keyboard navigation
│   ├── a11y/             # Accessibility
│   ├── scroll-aos/       # Scroll-triggered animations
│   └── effects/          # Fade, Coverflow, Cards
├── jquery/
│   └── jquery-plugin.js  # jQuery wrapper
└── styles/
    ├── drift-slider.scss # Core styles
    └── bundle.scss       # All-in-one bundle styles
```

## Module Architecture

Each optional module is a function that receives a context object:

```javascript
export default function MyModule({ slider, extendParams, on, off, emit }) {
  // 1. Extend default params
  extendParams({
    myModule: {
      enabled: false,
      option1: 'default',
    },
  })

  // 2. Listen to lifecycle events
  on('init', () => {
    const params = slider.params.myModule
    if (!params || !params.enabled) return
    // Initialize module...
  })

  on('destroy', () => {
    // Clean up...
  })

  // 3. Expose public API
  slider.myModule = { /* ... */ }
}
```

### Adding a New Module

1. Create `src/modules/my-module/my-module.js`
2. If needed, create `src/modules/my-module/my-module.scss`
3. Export from `src/modules/index.js`
4. Add TypeScript definitions to `types/index.d.ts`
5. Write tests in `tests/modules/my-module.test.js`
6. Document in `docs/modules.html`

## Coding Style

- **ES2015+** — Use modern JavaScript features
- **`const` / `let`** — Never use `var`
- **No semicolons** — The codebase omits semicolons
- **Single quotes** — For string literals
- **2-space indentation**
- **Meaningful variable names** — Prefer clarity over brevity

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add zoom module
fix: correct slide index in loop mode
docs: update API reference
refactor: simplify touch velocity calculation
test: add navigation module tests
chore: update build dependencies
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, focused commits
3. Ensure all tests pass (`npm test`)
4. Ensure the build succeeds (`npm run build && npm run build:css`)
5. Open a PR against `main` with a clear description
6. Address review feedback

## Reporting Bugs

Please open an issue at [GitHub Issues](https://github.com/hanfour/drift-slider/issues) with:

- A clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- A minimal reproduction if possible
