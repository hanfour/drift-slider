import { describe, it, expect } from 'vitest';
import { CORE_EVENTS, eventName, buildDetail } from '../src/events';

describe('event mapping', () => {
  it('covers the core events and lowercases with a drift: prefix', () => {
    expect(CORE_EVENTS).toEqual([
      'init', 'slideChange', 'reachBeginning', 'reachEnd', 'touchStart', 'touchEnd', 'destroy',
    ]);
    expect(eventName('slideChange')).toBe('drift:slidechange');
    expect(eventName('reachBeginning')).toBe('drift:reachbeginning');
  });

  it('builds a serializable detail from instance state', () => {
    const slider = { realIndex: 2, previousIndex: 1, progress: 0.4, isBeginning: false, isEnd: false };
    expect(buildDetail(slider)).toEqual({
      activeIndex: 2, previousIndex: 1, progress: 0.4, isBeginning: false, isEnd: false,
    });
  });
});
