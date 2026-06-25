import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { DriftSlider, Slide } from '../src/index';

afterEach(cleanup);

describe('DriftSlider', () => {
  it('renders the slider scaffold with slides', () => {
    const { container } = render(
      <DriftSlider className="x">
        <Slide>A</Slide>
        <Slide>B</Slide>
      </DriftSlider>,
    );
    expect(container.querySelector('.drift-slider.x')).toBeTruthy();
    expect(container.querySelector('.drift-track')).toBeTruthy();
    expect(container.querySelectorAll('.drift-list > .drift-slide').length).toBe(2);
  });

  it('calls onInit on mount', async () => {
    const onInit = vi.fn();
    render(
      <DriftSlider options={{ on: { init: onInit } }}>
        <Slide>A</Slide>
      </DriftSlider>,
    );
    await vi.waitFor(() => expect(onInit).toHaveBeenCalled());
  });
});
