import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ClipboardService } from './clipboard.service';
import { ToastService } from './toast.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  let toastServiceMock: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    toastServiceMock = {
      success: vi.fn(),
      error: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        ClipboardService,
        { provide: ToastService, useValue: toastServiceMock }
      ]
    });
    service = TestBed.inject(ClipboardService);
  });

  // ============================================================================
  // copy
  // ============================================================================
  describe('copy', () => {
    it('should copy text using Clipboard API and show success toast', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      const result = await service.copy('test text');

      expect(result).toBe(true);
      expect(writeTextMock).toHaveBeenCalledWith('test text');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Másolva!', 'test text');
    });

    it('should include label in success toast when provided', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      await service.copy('test@email.com', 'Email');

      expect(toastServiceMock.success).toHaveBeenCalledWith('Másolva!', 'Email: test@email.com');
    });

    it('should use fallback and show success when Clipboard API fails', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Failed'));
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      // Mock execCommand
      const execCommandMock = vi.fn().mockReturnValue(true);
      document.execCommand = execCommandMock;

      const result = await service.copy('fallback text');

      expect(result).toBe(true);
      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(toastServiceMock.success).toHaveBeenCalled();
    });

    it('should show error toast when both methods fail', async () => {
      const writeTextMock = vi.fn().mockRejectedValue(new Error('Failed'));
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      // Mock execCommand to fail
      document.execCommand = vi.fn().mockReturnValue(false);

      const result = await service.copy('failed text');

      expect(result).toBe(false);
      expect(toastServiceMock.error).toHaveBeenCalledWith('Hiba', 'Nem sikerült a vágólapra másolni');
    });

    it('should use fallback when Clipboard API is not available', async () => {
      // Remove Clipboard API
      Object.assign(navigator, { clipboard: undefined });

      // Mock execCommand
      document.execCommand = vi.fn().mockReturnValue(true);

      const result = await service.copy('no clipboard api');

      expect(result).toBe(true);
      expect(toastServiceMock.success).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // copyEmail
  // ============================================================================
  describe('copyEmail', () => {
    it('should copy email with "Email" label', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      await service.copyEmail('test@example.com');

      expect(writeTextMock).toHaveBeenCalledWith('test@example.com');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Másolva!', 'Email: test@example.com');
    });
  });

  // ============================================================================
  // copyPhone
  // ============================================================================
  describe('copyPhone', () => {
    it('should copy phone with "Telefon" label', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      await service.copyPhone('+36 30 123 4567');

      expect(writeTextMock).toHaveBeenCalledWith('+36 30 123 4567');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Másolva!', 'Telefon: +36 30 123 4567');
    });
  });

  // ============================================================================
  // copyLink
  // ============================================================================
  describe('copyLink', () => {
    it('should copy link with "Link" label', async () => {
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: { writeText: writeTextMock }
      });

      await service.copyLink('https://example.com/share/abc123');

      expect(writeTextMock).toHaveBeenCalledWith('https://example.com/share/abc123');
      expect(toastServiceMock.success).toHaveBeenCalledWith('Másolva!', 'Link: https://example.com/share/abc123');
    });
  });
});
