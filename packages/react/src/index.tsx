import { useEffect, useImperativeHandle, useRef, forwardRef, Children, isValidElement } from 'react';
import type { CSSProperties, LiHTMLAttributes, ReactNode } from 'react';
import CoreDriftSlider, { type DriftSliderOptions } from 'drift-slider';
import type { DriftSliderModule, DriftSliderEvents } from 'drift-slider';

export const VERSION = '0.1.0';

export function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function childrenKeys(children: ReactNode): string {
  return Children.toArray(children)
    .map((c, i) => (isValidElement(c) && c.key != null ? String(c.key) : `__i${i}`))
    .join('|');
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

export interface DriftSliderHandle {
  slideTo: CoreDriftSlider['slideTo'];
  slideNext: CoreDriftSlider['slideNext'];
  slidePrev: CoreDriftSlider['slidePrev'];
  update: () => void;
  instance: CoreDriftSlider | null;
}

type EventShortcuts = {
  onInit?: DriftSliderEvents['init'];
  onSlideChange?: DriftSliderEvents['slideChange'];
  onReachBeginning?: DriftSliderEvents['reachBeginning'];
  onReachEnd?: DriftSliderEvents['reachEnd'];
  onTouchStart?: DriftSliderEvents['touchStart'];
  onTouchEnd?: DriftSliderEvents['touchEnd'];
};

const SHORTCUTS: Record<keyof EventShortcuts, keyof DriftSliderEvents> = {
  onInit: 'init',
  onSlideChange: 'slideChange',
  onReachBeginning: 'reachBeginning',
  onReachEnd: 'reachEnd',
  onTouchStart: 'touchStart',
  onTouchEnd: 'touchEnd',
};

export interface DriftSliderProps extends EventShortcuts {
  options?: DriftSliderOptions;
  modules?: DriftSliderModule[];
  on?: Partial<DriftSliderEvents>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export const DriftSlider = forwardRef<DriftSliderHandle, DriftSliderProps>(
  function DriftSlider(props, ref) {
    const { options, modules, on, className, style, children, ...shortcuts } = props;

    const mergedOn: Partial<DriftSliderEvents> = { ...options?.on, ...on };
    (Object.keys(SHORTCUTS) as (keyof EventShortcuts)[]).forEach((key) => {
      const handler = (shortcuts as EventShortcuts)[key];
      if (handler) {
        // each shortcut maps 1:1 to its event; signatures already match
        (mergedOn as Record<string, unknown>)[SHORTCUTS[key]] = handler;
      }
    });

    const mergedOptions: DriftSliderOptions = {
      ...options,
      modules: [...(options?.modules ?? []), ...(modules ?? [])],
      on: mergedOn,
    };

    const containerRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<CoreDriftSlider | null>(null);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const slider = new CoreDriftSlider(el, mergedOptions);
      sliderRef.current = slider;
      return () => {
        slider.destroy();
        sliderRef.current = null;
      };
      // re-init only when options/modules identity changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options, modules]);

    const keySig = childrenKeys(children);
    const didMount = useRef(false);
    useEffect(() => {
      if (!didMount.current) {
        didMount.current = true;
        return; // initial render already built the right DOM
      }
      sliderRef.current?.update();
    }, [keySig]);

    useImperativeHandle(ref, () => ({
      slideTo: (...args) => sliderRef.current!.slideTo(...args),
      slideNext: (...args) => sliderRef.current!.slideNext(...args),
      slidePrev: (...args) => sliderRef.current!.slidePrev(...args),
      update: () => sliderRef.current?.update(),
      get instance() {
        return sliderRef.current;
      },
    }), []);

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
