import { useEffect, useImperativeHandle, useRef, forwardRef, Children, isValidElement } from 'react';
import type { CSSProperties, LiHTMLAttributes, ReactNode } from 'react';
import CoreDriftSlider, {
  type DriftSliderOptions,
  type DriftSliderModule,
  type DriftSliderEvents,
} from 'drift-slider';

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
  slideTo: (...args: Parameters<CoreDriftSlider['slideTo']>) => CoreDriftSlider | undefined;
  slideNext: (...args: Parameters<CoreDriftSlider['slideNext']>) => CoreDriftSlider | undefined;
  slidePrev: (...args: Parameters<CoreDriftSlider['slidePrev']>) => CoreDriftSlider | undefined;
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

// Merge `options.on`, the `on` prop, and the shortcut props into one event map.
function collectHandlers(
  optionsOn: Partial<DriftSliderEvents> | undefined,
  onProp: Partial<DriftSliderEvents> | undefined,
  shortcuts: EventShortcuts,
): Partial<DriftSliderEvents> {
  const handlers: Partial<DriftSliderEvents> = { ...optionsOn, ...onProp };
  (Object.keys(SHORTCUTS) as (keyof EventShortcuts)[]).forEach((key) => {
    const handler = shortcuts[key];
    if (handler) (handlers as Record<string, unknown>)[SHORTCUTS[key]] = handler;
  });
  return handlers;
}

// Build a stable `on` map whose forwarders read the latest handler from the ref
// on each emit — so changing a handler prop takes effect without re-init. Covers
// the shortcut events plus any keys present on the handler map.
function forwardEvents(
  handlers: Partial<DriftSliderEvents>,
  handlersRef: { current: Partial<DriftSliderEvents> },
): Partial<DriftSliderEvents> {
  const on: Record<string, (...args: unknown[]) => void> = {};
  new Set<string>([...Object.values(SHORTCUTS), ...Object.keys(handlers)]).forEach((name) => {
    on[name] = (...args) => {
      const map = handlersRef.current as Record<string, ((...a: unknown[]) => void) | undefined>;
      map[name]?.(...args);
    };
  });
  return on as Partial<DriftSliderEvents>;
}

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

    // Keep the latest handlers in a ref so changing a handler prop takes effect
    // without tearing the slider down and recreating it.
    const handlers = collectHandlers(options?.on, on, shortcuts as EventShortcuts);
    const handlersRef = useRef(handlers);
    useEffect(() => {
      handlersRef.current = handlers;
    });

    const sliderOptions: DriftSliderOptions = {
      ...options,
      modules: [...(options?.modules ?? []), ...(modules ?? [])],
      on: forwardEvents(handlers, handlersRef),
    };

    // Compose the lifecycle from the shared hook; re-init only when
    // options/modules identity changes.
    const [containerRef, sliderRef] = useDriftSlider(sliderOptions, [options, modules]);

    // Recompute on children key-set changes (skip the initial mount).
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
      slideTo: (...args) => sliderRef.current?.slideTo(...args),
      slideNext: (...args) => sliderRef.current?.slideNext(...args),
      slidePrev: (...args) => sliderRef.current?.slidePrev(...args),
      update: () => sliderRef.current?.update(),
      get instance() {
        return sliderRef.current;
      },
    }), [sliderRef]);

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
