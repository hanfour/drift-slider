import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { Slide } from '../src/index';

afterEach(cleanup);

describe('Slide', () => {
  it('renders an li.drift-slide and merges className', () => {
    const { container } = render(<Slide className="x">hi</Slide>);
    const li = container.querySelector('li')!;
    expect(li.classList.contains('drift-slide')).toBe(true);
    expect(li.classList.contains('x')).toBe(true);
    expect(li.textContent).toBe('hi');
  });
});
