export const CORE_EVENTS = [
  'init', 'slideChange', 'reachBeginning', 'reachEnd', 'touchStart', 'touchEnd', 'destroy',
] as const;

export function eventName(core: string): string {
  return `drift:${core.toLowerCase()}`;
}

interface SliderState {
  realIndex: number;
  previousIndex: number;
  progress: number;
  isBeginning: boolean;
  isEnd: boolean;
}

export function buildDetail(s: SliderState) {
  return {
    activeIndex: s.realIndex,
    previousIndex: s.previousIndex,
    progress: s.progress,
    isBeginning: s.isBeginning,
    isEnd: s.isEnd,
  };
}
