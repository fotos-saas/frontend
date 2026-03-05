import { describe, it, expect, beforeEach } from 'vitest';
import { DragScrollService } from './drag-scroll.service';

describe('DragScrollService', () => {
  let service: DragScrollService;

  beforeEach(() => {
    service = new DragScrollService();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should not be dragging initially', () => {
    expect(service.isDragging()).toBe(false);
  });

  it('setElement should not throw', () => {
    const el = document.createElement('div');
    expect(() => service.setElement(el)).not.toThrow();
  });

  it('onMouseDown without element should not throw', () => {
    const event = new MouseEvent('mousedown');
    expect(() => service.onMouseDown(event)).not.toThrow();
  });
});
