import { ICONS } from '../constants/icons.constants';

/**
 * MIME type alapján fájltípus ikon meghatározása.
 */
export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return ICONS.IMAGE;
  if (mimeType === 'application/pdf') return ICONS.FILE_TEXT;
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return ICONS.ARCHIVE;
  if (mimeType.includes('word') || mimeType.includes('document')) return ICONS.FILE_TEXT;
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return ICONS.FILE_SPREADSHEET;
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return ICONS.FILE_TEXT;
  return ICONS.FILE;
}

/**
 * Fájlméret formázása olvasható formátumba.
 */
export function formatAttachmentSize(bytes: number): string {
  if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(1) + ' MB';
  }
  return Math.round(bytes / 1024) + ' KB';
}
