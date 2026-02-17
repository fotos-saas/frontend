import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

/**
 * Linkify Pipe
 *
 * Sima szövegben lévő URL-eket kattintható linkekké alakítja.
 * DOMPurify-val szanitizálja az eredményt (XSS védelem).
 *
 * Usage: [innerHTML]="text | linkify"
 *
 * - https://example.com → <a href="https://example.com" target="_blank" rel="noopener">Link megnyitása</a>
 * - Newline-okat <br>-re cseréli
 */
@Pipe({
  name: 'linkify',
  standalone: true,
})
export class LinkifyPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';

    // URL regex — http(s) és www kezdetű URL-ek
    const urlRegex = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;

    // Először escape-eljük a HTML-t
    const escaped = value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    // URL-eket linkké alakítjuk
    const linked = escaped.replace(urlRegex, (url) => {
      const href = url.startsWith('www.') ? 'https://' + url : url;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">Link megnyitása</a>`;
    });

    // Newline-okat <br>-re cseréljük
    const withBreaks = linked.replace(/\n/g, '<br>');

    // DOMPurify szanitizálás
    const clean = DOMPurify.sanitize(withBreaks, {
      ALLOWED_TAGS: ['a', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });

    return this.sanitizer.bypassSecurityTrustHtml(clean);
  }
}
