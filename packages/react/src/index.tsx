import { useEffect, useRef } from 'react';
import type { LiHTMLAttributes, ReactNode } from 'react';
import DriftSlider, { type DriftSliderOptions } from 'drift-slider';

export const VERSION = '0.1.0';

export function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export interface SlideProps extends LiHTMLAttributes<HTMLLIElement> {
  children?: ReactNode;
}

export function Slide({ className, children, ...rest }: SlideProps) {
  return (
    <li className={cx('drift-slide', className)} {...rest}>
      {children}
    </li>
  );
}

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
