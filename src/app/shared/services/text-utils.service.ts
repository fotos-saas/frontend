import { Injectable } from '@angular/core';
import DOMPurify from 'dompurify';

/**
 * TextUtilsService
 *
 * Szövegmanipulációs segédeszközök:
 * - HTML tagek eltávolítása
 * - HTML entitások dekódolása
 * - Szöveg csonkolása (truncate)
 * - HTML → plain text előnézet konverzió
 *
 * Használat:
 *   textUtils.htmlToPlainPreview(htmlContent, 150)
 */
@Injectable({
  providedIn: 'root'
})
export class TextUtilsService {

  /**
   * HTML tagek eltávolítása a szövegből.
   * DOMPurify sanitize előszűréssel a biztonságos eredményért.
   */
  stripHtmlTags(html: string): string {
    if (!html) return '';

    return DOMPurify.sanitize(html, { ALLOWED_TAGS: [] });
  }

  /**
   * HTML entitások dekódolása (pl. &nbsp; → szóköz, &amp; → &).
   * textarea trükk a böngésző beépített dekódolójának használatához.
   */
  decodeHtmlEntities(text: string): string {
    if (!text) return '';

    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    return textarea.value;
  }

  /**
   * Non-breaking space és egyéb speciális szóközök normalizálása.
   */
  normalizeWhitespace(text: string): string {
    if (!text) return '';

    return text
      .replace(/\u00A0/g, ' ')  // non-breaking space → space
      .replace(/\s+/g, ' ')      // több szóköz → egy szóköz
      .trim();
  }

  /**
   * Szöveg csonkolása adott hosszra.
   *
   * @param text - A csonkolandó szöveg
   * @param maxLength - Maximum hossz (default: 150)
   * @param suffix - Hozzáfűzendő végződés (default: '...')
   */
  truncate(text: string, maxLength = 150, suffix = '...'): string {
    if (!text) return '';

    const trimmed = text.trim();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }

    // Suffix hosszát levonjuk a maxLength-ből
    const cutLength = maxLength - suffix.length;
    return trimmed.substring(0, cutLength) + suffix;
  }

  /**
   * HTML tartalom plain text előnézetté konvertálása.
   * Kombinálja: stripHtmlTags + decodeHtmlEntities + normalizeWhitespace + truncate
   *
   * @param html - HTML tartalom
   * @param maxLength - Maximum hossz (default: 150)
   * @returns Plain text előnézet
   */
  htmlToPlainPreview(html: string, maxLength = 150): string {
    if (!html) return '';

    // 1. HTML tagek eltávolítása
    let text = this.stripHtmlTags(html);

    // 2. HTML entitások dekódolása (ha maradtak)
    text = this.decodeHtmlEntities(text);

    // 3. Whitespace normalizálás
    text = this.normalizeWhitespace(text);

    // 4. Truncate
    return this.truncate(text, maxLength);
  }

  /**
   * Szöveg első N szavának kivágása.
   * Hasznos meta description generáláshoz.
   */
  getFirstWords(text: string, wordCount = 20): string {
    if (!text) return '';

    const words = text.trim().split(/\s+/);
    if (words.length <= wordCount) {
      return text.trim();
    }

    return words.slice(0, wordCount).join(' ') + '...';
  }

  /**
   * Ellenőrzi, hogy a szöveg üres-e (whitespace-eket is figyelembe véve).
   */
  isEmpty(text: string | null | undefined): boolean {
    return !text || text.trim().length === 0;
  }

  /**
   * Szöveg plain text hosszának meghatározása HTML-ből.
   * Hasznos form validációhoz.
   */
  getPlainTextLength(html: string): number {
    if (!html) return 0;

    const text = this.stripHtmlTags(html);
    return this.normalizeWhitespace(text).length;
  }
}
