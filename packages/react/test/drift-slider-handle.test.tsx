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
});
