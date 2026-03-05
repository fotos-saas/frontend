import { describe, it, expect, vi } from 'vitest';
import { createBackdropHandler } from './dialog.util';

describe('dialog.util', () => {
  // ==========================================================================
  // createBackdropHandler
  // ==========================================================================
  describe('createBackdropHandler', () => {
    function createMockMouseEvent(classList: string[]): MouseEvent {
      return {
        target: {
          classList: {
            contains: (cls: string) => classList.includes(cls),
          },
        },
      } as unknown as MouseEvent;
    }

    it('should create a handler with onMouseDown and onClick', () => {
      const handler = createBackdropHandler(() => {});

      expect(handler).toHaveProperty('onMouseDown');
      expect(handler).toHaveProperty('onClick');
      expect(typeof handler.onMouseDown).toBe('function');
      expect(typeof handler.onClick).toBe('function');
    });

    it('should call closeCallback when both mousedown and click are on backdrop', () => {
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn);

      const event = createMockMouseEvent(['dialog-backdrop']);
      handler.onMouseDown(event);
      handler.onClick(event);

      expect(closeFn).toHaveBeenCalledOnce();
    });

    it('should NOT call closeCallback when mousedown is NOT on backdrop', () => {
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn);

      const mouseDownEvent = createMockMouseEvent(['dialog-content']);
      const clickEvent = createMockMouseEvent(['dialog-backdrop']);

      handler.onMouseDown(mouseDownEvent);
      handler.onClick(clickEvent);

      expect(closeFn).not.toHaveBeenCalled();
    });

    it('should NOT call closeCallback when click is NOT on backdrop', () => {
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn);

      const mouseDownEvent = createMockMouseEvent(['dialog-backdrop']);
      const clickEvent = createMockMouseEvent(['dialog-content']);

      handler.onMouseDown(mouseDownEvent);
      handler.onClick(clickEvent);

      expect(closeFn).not.toHaveBeenCalled();
    });

    it('should NOT call closeCallback when neither event is on backdrop', () => {
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn);

      const event = createMockMouseEvent(['some-other-class']);
      handler.onMouseDown(event);
      handler.onClick(event);

      expect(closeFn).not.toHaveBeenCalled();
    });

    it('should reset mouseDownOnBackdrop state after click', () => {
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn);

      const backdropEvent = createMockMouseEvent(['dialog-backdrop']);

      // Első kör: sikeres bezárás
      handler.onMouseDown(backdropEvent);
      handler.onClick(backdropEvent);
      expect(closeFn).toHaveBeenCalledOnce();

      // Második kör: click without mousedown -> nem hívódik meg újra
      handler.onClick(backdropEvent);
      expect(closeFn).toHaveBeenCalledOnce();
    });

    it('should support custom backdrop class', () => {
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn, 'custom-backdrop');

      const event = createMockMouseEvent(['custom-backdrop']);
      handler.onMouseDown(event);
      handler.onClick(event);

      expect(closeFn).toHaveBeenCalledOnce();
    });

    it('should NOT trigger for default class when custom class is specified', () => {
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn, 'custom-backdrop');

      const event = createMockMouseEvent(['dialog-backdrop']);
      handler.onMouseDown(event);
      handler.onClick(event);

      expect(closeFn).not.toHaveBeenCalled();
    });

    it('should handle text selection drag scenario correctly', () => {
      // Szöveg kijelölés: mousedown a tartalmon, mouseup (click) a backdropen
      const closeFn = vi.fn();
      const handler = createBackdropHandler(closeFn);

      const contentEvent = createMockMouseEvent(['dialog-panel']);
      const backdropEvent = createMockMouseEvent(['dialog-backdrop']);

      handler.onMouseDown(contentEvent); // Kijelölés a tartalmon indul
      handler.onClick(backdropEvent);    // Egér a backdropen ér véget

      expect(closeFn).not.toHaveBeenCalled();
    });
  });
});
