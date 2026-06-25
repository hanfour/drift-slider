import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { DriftSlider, Slide, type DriftSliderHandle } from '../src/index';

afterEach(cleanup);

describe('DriftSlider children update', () => {
  it('calls update() when the children key set changes', async () => {
    let handle: DriftSliderHandle | null = null;
    function App({ keys }: { keys: string[] }) {
      const ref = useRef<DriftSliderHandle>(null);
      queueMicrotask(() => { handle = ref.current; });
      return (
        <DriftSlider ref={ref}>
          {keys.map((k) => <Slide key={k}>{k}</Slide>)}
        </DriftSlider>
      );
    }
    const { rerender } = render(<App keys={['a', 'b']} />);
    await vi.waitFor(() => expect(handle).toBeTruthy());
    const spy = vi.spyOn(handle!.instance!, 'update');
    rerender(<App keys={['a', 'b', 'c']} />); // add
    expect(spy).toHaveBeenCalledTimes(1);
    rerender(<App keys={['c', 'b', 'a']} />); // reorder (same count)
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
