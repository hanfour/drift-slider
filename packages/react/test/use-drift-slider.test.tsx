import { describe, it, expect, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach } from 'vitest';
import { useDriftSlider } from '../src/index';

afterEach(cleanup);

function Harness({ onReady }: { onReady: (s: unknown) => void }) {
  const [containerRef, sliderRef] = useDriftSlider({});
  // expose the slider once mounted
  const ref = useRef(false);
  if (!ref.current) { ref.current = true; queueMicrotask(() => onReady(sliderRef.current)); }
  return (
    <div className="drift-slider" ref={containerRef}>
      <div className="drift-track"><ul className="drift-list">
        <li className="drift-slide">A</li>
        <li className="drift-slide">B</li>
      </ul></div>
    </div>
  );
}

describe('useDriftSlider', () => {
  it('creates a slider instance on mount and destroys it on unmount', async () => {
    const onReady = vi.fn();
    const { unmount } = render(<Harness onReady={onReady} />);
    await vi.waitFor(() => expect(onReady).toHaveBeenCalled());
    const slider = onReady.mock.calls[0][0] as { destroyed: boolean };
    expect(slider).toBeTruthy();
    expect(slider.destroyed).toBe(false);
    unmount();
    expect(slider.destroyed).toBe(true);
  });
});
