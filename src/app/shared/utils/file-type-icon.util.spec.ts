import { describe, it, expect } from 'vitest';
import { getFileTypeIcon, formatAttachmentSize } from './file-type-icon.util';
import { ICONS } from '../constants/icons.constants';

describe('file-type-icon.util', () => {

  // ============================================================================
  // getFileTypeIcon
  // ============================================================================
  describe('getFileTypeIcon', () => {
    it('image típus → IMAGE ikon', () => {
      expect(getFileTypeIcon('image/jpeg')).toBe(ICONS.IMAGE);
      expect(getFileTypeIcon('image/png')).toBe(ICONS.IMAGE);
      expect(getFileTypeIcon('image/gif')).toBe(ICONS.IMAGE);
    });

    it('PDF → FILE_TEXT ikon', () => {
      expect(getFileTypeIcon('application/pdf')).toBe(ICONS.FILE_TEXT);
    });

    it('ZIP/RAR → ARCHIVE ikon', () => {
      expect(getFileTypeIcon('application/zip')).toBe(ICONS.ARCHIVE);
      expect(getFileTypeIcon('application/x-rar-compressed')).toBe(ICONS.ARCHIVE);
      expect(getFileTypeIcon('application/x-compressed')).toBe(ICONS.ARCHIVE);
    });

    it('Word dokumentum → FILE_TEXT ikon', () => {
      expect(getFileTypeIcon('application/msword')).toBe(ICONS.FILE_TEXT);
      expect(getFileTypeIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(ICONS.FILE_TEXT);
    });

    it('Excel → FILE_SPREADSHEET ikon (vnd.ms-excel)', () => {
      expect(getFileTypeIcon('application/vnd.ms-excel')).toBe(ICONS.FILE_SPREADSHEET);
    });

    it('Excel openxml → FILE_TEXT (document szó miatt word branch matchel előbb)', () => {
      // Megjegyzés: a "spreadsheetml.sheet" MIME type tartalmazza a "document" szót is
      // ezért a word/document ellenőrzés előbb elkapja
      expect(getFileTypeIcon('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')).toBe(ICONS.FILE_TEXT);
    });

    it('PowerPoint → FILE_TEXT ikon', () => {
      expect(getFileTypeIcon('application/vnd.ms-powerpoint')).toBe(ICONS.FILE_TEXT);
      expect(getFileTypeIcon('application/vnd.openxmlformats-officedocument.presentationml.presentation')).toBe(ICONS.FILE_TEXT);
    });

    it('ismeretlen típus → FILE ikon', () => {
      expect(getFileTypeIcon('application/octet-stream')).toBe(ICONS.FILE);
      expect(getFileTypeIcon('text/plain')).toBe(ICONS.FILE);
    });
  });

  // ============================================================================
  // formatAttachmentSize
  // ============================================================================
  describe('formatAttachmentSize', () => {
    it('MB felett MB-ben formáz', () => {
      expect(formatAttachmentSize(1048576)).toBe('1.0 MB');
      expect(formatAttachmentSize(2 * 1048576)).toBe('2.0 MB');
    });

    it('MB alatt KB-ban formáz', () => {
      expect(formatAttachmentSize(1024)).toBe('1 KB');
      expect(formatAttachmentSize(512000)).toBe('500 KB');
    });

    it('tizedes MB értéket is formáz', () => {
      expect(formatAttachmentSize(1.5 * 1048576)).toBe('1.5 MB');
    });

    it('kis fájlméretet kezel', () => {
      expect(formatAttachmentSize(100)).toBe('0 KB');
    });

    it('pontosan 1 MB', () => {
      expect(formatAttachmentSize(1048576)).toBe('1.0 MB');
    });
  });
});
