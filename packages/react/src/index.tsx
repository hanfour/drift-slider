import { useEffect, useRef, forwardRef } from 'react';
import type { CSSProperties, LiHTMLAttributes, ReactNode } from 'react';
import CoreDriftSlider, { type DriftSliderOptions } from 'drift-slider';
import type { DriftSliderModule, DriftSliderEvents } from 'drift-slider';

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
  const sliderRef = useRef<CoreDriftSlider | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const slider = new CoreDriftSlider(el, options);
    sliderRef.current = slider;
    return () => {
      slider.destroy();
      sliderRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return [containerRef, sliderRef] as const;
}

export interface DriftSliderProps {
  options?: DriftSliderOptions;
  modules?: DriftSliderModule[];
  on?: Partial<DriftSliderEvents>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export const DriftSlider = forwardRef<unknown, DriftSliderProps>(
  function DriftSlider({ options, className, style, children }, _ref) {
    const [containerRef] = useDriftSlider(options, [options]);
    return (
      <div className={cx('drift-slider', className)} style={style} ref={containerRef}>
        <div className="drift-track">
          <ul className="drift-list">{children}</ul>
        </div>
      </div>
    );
  },
);

export default DriftSlider;
