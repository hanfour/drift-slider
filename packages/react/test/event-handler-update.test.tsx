import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { DriftSlider, Slide, type DriftSliderHandle } from '../src/index';

afterEach(cleanup);

describe('DriftSlider event handler updates', () => {
  it('calls the latest onSlideChange after a prop change (no re-init)', async () => {
    let handle: DriftSliderHandle | null = null;
    const first = vi.fn();
    const second = vi.fn();

    function App({ cb }: { cb: () => void }) {
      const ref = useRef<DriftSliderHandle>(null);
      queueMicrotask(() => { handle = ref.current; });
      return (
        <DriftSlider ref={ref} onSlideChange={cb}>
          <Slide>a</Slide>
          <Slide>b</Slide>
          <Slide>c</Slide>
        </DriftSlider>
      );
    }

    const { rerender } = render(<App cb={first} />);
    await vi.waitFor(() => expect(handle).toBeTruthy());

    // Change the handler identity; options/modules are unchanged, so the
    // slider is NOT re-initialised. The latest handler must still be used.
    rerender(<App cb={second} />);
    handle!.slideNext(0); // fires slideChange on the live instance

    expect(second).toHaveBeenCalled();
    expect(first).not.toHaveBeenCalled();
  });
});
