import { useEffect, useRef } from 'react';
import DriftSlider, { type DriftSliderOptions } from 'drift-slider';

export const VERSION = '0.1.0';

export function useDriftSlider(
  options?: DriftSliderOptions,
  deps: unknown[] = [],
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<DriftSlider | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slider = new DriftSlider(el, options);
    sliderRef.current = slider;
    return () => {
      slider.destroy();
      sliderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [containerRef, sliderRef] as const;
}
