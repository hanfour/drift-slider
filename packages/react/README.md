# drift-slider-react

Official React wrapper for [DriftSlider](https://github.com/hanfour/drift-slider).

## Install

```bash
npm i drift-slider drift-slider-react
```

## Usage

```tsx
'use client';
import { DriftSlider, Slide } from 'drift-slider-react';
import { Navigation, Pagination } from 'drift-slider/modules';
import 'drift-slider/css/bundle';

export function Carousel() {
  return (
    <DriftSlider
      options={{ loop: true, navigation: true, pagination: true }}
      modules={[Navigation, Pagination]}
      onSlideChange={(s) => console.log(s.realIndex)}
    >
      <Slide>Slide 1</Slide>
      <Slide>Slide 2</Slide>
    </DriftSlider>
  );
}
```

### Imperative control (ref)

```tsx
const ref = useRef<DriftSliderHandle>(null);
// ref.current.slideNext(); ref.current.slideTo(2); ref.current.update();
<DriftSlider ref={ref}>…</DriftSlider>
```

### Headless hook

```tsx
const [containerRef] = useDriftSlider({ loop: true });
return <div className="drift-slider" ref={containerRef}>…your scaffold…</div>;
```

## Notes

- SSR-safe: the slider initialises in `useEffect` (client only); add `'use client'` in Next.js App Router.
- Slides should carry stable `key`s; changing the key set re-runs `update()`.
- Dynamic per-slide add/remove without recompute is not supported (use `ref.update()`).
- Memoize `options` and `modules` (e.g. with `useMemo`) — the slider re-initialises when their identity changes, and an inline `{}`/`[]` literal changes every render, which would tear down and recreate the slider (and drop event handlers between renders).
