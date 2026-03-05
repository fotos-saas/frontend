import { describe, it, expect } from 'vitest';
import { DragOrderColorPipe } from './drag-order-color.pipe';
import { GROUP_COLORS } from '../../features/overlay/overlay-drag-order.service';

describe('DragOrderColorPipe', () => {
  const pipe = new DragOrderColorPipe();

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return the first color for index 0', () => {
    expect(pipe.transform(0)).toBe(GROUP_COLORS[0]);
  });

  it('should return correct color for valid index', () => {
    expect(pipe.transform(1)).toBe(GROUP_COLORS[1]);
    expect(pipe.transform(2)).toBe(GROUP_COLORS[2]);
  });

  it('should wrap around using modulo for index >= array length', () => {
    const len = GROUP_COLORS.length;
    expect(pipe.transform(len)).toBe(GROUP_COLORS[0]);
    expect(pipe.transform(len + 1)).toBe(GROUP_COLORS[1]);
    expect(pipe.transform(len * 2)).toBe(GROUP_COLORS[0]);
  });

  it('should return correct color for last valid index', () => {
    const lastIdx = GROUP_COLORS.length - 1;
    expect(pipe.transform(lastIdx)).toBe(GROUP_COLORS[lastIdx]);
  });

  it('should handle large indices via modulo', () => {
    const idx = 1000;
    const expected = GROUP_COLORS[idx % GROUP_COLORS.length];
    expect(pipe.transform(idx)).toBe(expected);
  });
});
