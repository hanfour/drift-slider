import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { DriftSlider, Slide, type DriftSliderHandle } from '../src/index';

afterEach(cleanup);

describe('DriftSlider ref + events', () => {
  it('exposes slideNext via ref and fires onSlideChange', async () => {
    const onSlideChange = vi.fn();
    let handle: DriftSliderHandle | null = null;
    function App() {
      const ref = useRef<DriftSliderHandle>(null);
      // capture after mount
      queueMicrotask(() => { handle = ref.current; });
      return (
        <DriftSlider ref={ref} onSlideChange={onSlideChange}>
          <Slide>A</Slide>
          <Slide>B</Slide>
          <Slide>C</Slide>
        </DriftSlider>
      );
    }
    render(<App />);
    await vi.waitFor(() => expect(handle).toBeTruthy());
    handle!.slideNext(0);
    expect(handle!.instance).toBeTruthy();
    expect(handle!.instance!.activeIndex).toBe(1);
    expect(onSlideChange).toHaveBeenCalled();
  });

  it('handle methods do not throw when the slider is not mounted', async () => {
    let handle: DriftSliderHandle | null = null;
    function App() {
      const ref = useRef<DriftSliderHandle>(null);
      queueMicrotask(() => { handle = ref.current; });
      return (
        <DriftSlider ref={ref}>
          <Slide>a</Slide>
        </DriftSlider>
      );
    }
    const { unmount } = render(<App />);
    await vi.waitFor(() => expect(handle).toBeTruthy());
    unmount(); // destroys the slider; sliderRef.current is now null

    expect(handle!.instance).toBeNull();
    // slideTo/slideNext/slidePrev/update must all guard the null instance
    expect(() => handle!.slideNext(0)).not.toThrow();
    expect(() => handle!.slidePrev(0)).not.toThrow();
    expect(() => handle!.slideTo(0)).not.toThrow();
    expect(() => handle!.update()).not.toThrow();
    expect(handle!.slideNext(0)).toBeUndefined();
  });
});
