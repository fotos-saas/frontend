import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

/** Engedélyezett URL protokollok (XSS védelem) */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:'];

/**
 * SafeHtml Pipe
 *
 * Safely renders HTML content for innerHTML binding with XSS protection.
 * Uses DOMPurify to sanitize content before rendering.
 *
 * Usage: [innerHTML]="content | safeHtml"
 *
 * Allowed tags: p, br, strong, em, b, i, u, ul, ol, li, span, a, h1-h6
 * Allowed attributes: class, href, target (style attribute removed for security)
 *
 * SECURITY:
 * - href attribútumok validálása: csak http, https, mailto protokoll engedélyezett
 * - javascript: és data: protokollok blokkolva (XSS védelem)
 *
 * IMPORTANT: All content is sanitized client-side for XSS protection.
 */
@Pipe({
  name: 'safeHtml',
  standalone: true
})
export class SafeHtmlPipe implements PipeTransform {
  private static hooksRegistered = false;

  constructor(private sanitizer: DomSanitizer) {
    if (!SafeHtmlPipe.hooksRegistered) {
      SafeHtmlPipe.hooksRegistered = true;
      // DOMPurify hook: href attribútumok validálása
      DOMPurify.addHook('afterSanitizeAttributes', (node) => {
      if (node.tagName === 'A' && node.hasAttribute('href')) {
        const href = node.getAttribute('href') || '';
        if (!this.isValidHref(href)) {
          // Veszélyes URL - eltávolítjuk a href-et
          node.removeAttribute('href');
          node.setAttribute('data-blocked-href', 'true');
        }
      }
      });
    }
  }

  /**
   * Transform HTML string to SafeHtml with XSS protection
   *
   * @param value Raw HTML string from backend
   * @returns Sanitized and trusted HTML for Angular
   */
  transform(value: string | null | undefined): SafeHtml {
    if (!value) {
      return '';
    }

    // Configure DOMPurify with allowed tags and attributes
    const cleanHtml = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'b', 'i', 'u',
        'ul', 'ol', 'li', 'span', 'a', 'div',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
      ],
      ALLOWED_ATTR: ['class', 'href', 'target'] // style removed for security
    });

    // After sanitization, bypass Angular's security for the clean HTML
    return this.sanitizer.bypassSecurityTrustHtml(cleanHtml);
  }

  /**
   * Ellenőrzi, hogy a href biztonságos-e
   * Csak http, https, mailto protokoll engedélyezett
   * Relatív URL-ek is engedélyezettek
   */
  private isValidHref(href: string): boolean {
    // Üres href engedélyezett
    if (!href) return true;

    // Relatív URL-ek engedélyezettek (/ vagy # kezdetű)
    if (href.startsWith('/') || href.startsWith('#')) {
      return true;
    }

    // Protokoll ellenőrzése
    try {
      const url = new URL(href, window.location.origin);
      return ALLOWED_PROTOCOLS.includes(url.protocol);
    } catch {
      // Ha nem valid URL és nem relatív, akkor blokkoljuk
      // Kivéve ha nincs benne : (pl. egyszerű anchor)
      return !href.includes(':');
    }
  }
}
