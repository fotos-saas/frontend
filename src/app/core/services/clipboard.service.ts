import { Injectable } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Clipboard Service
 *
 * Vágólapra másolás toast visszajelzéssel.
 * Modern Clipboard API-val, execCommand fallback-kel.
 */
@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  constructor(private toastService: ToastService) {}

  /**
   * Szöveg másolása vágólapra
   * @param text A másolandó szöveg
   * @param label Opcionális címke (pl. "Email cím")
   */
  async copy(text: string, label?: string): Promise<boolean> {
    let success = false;

    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch {
        // Fallback-re megyünk
        success = this.fallbackCopy(text);
      }
    } else {
      // Nincs Clipboard API - fallback
      success = this.fallbackCopy(text);
    }

    if (success) {
      this.toastService.success(
        'Másolva!',
        label ? `${label}: ${text}` : text
      );
    } else {
      this.toastService.error(
        'Hiba',
        'Nem sikerült a vágólapra másolni'
      );
    }

    return success;
  }

  /**
   * Fallback másolás execCommand-dal (régebbi böngészők, HTTP kontextus)
   */
  private fallbackCopy(text: string): boolean {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      textarea.style.top = '-9999px';
      textarea.setAttribute('readonly', '');
      document.body.appendChild(textarea);
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const result = document.execCommand('copy');
      document.body.removeChild(textarea);
      return result;
    } catch {
      return false;
    }
  }

  /**
   * Email cím másolása
   */
  async copyEmail(email: string): Promise<boolean> {
    return this.copy(email, 'Email');
  }

  /**
   * Telefonszám másolása
   */
  async copyPhone(phone: string): Promise<boolean> {
    return this.copy(phone, 'Telefon');
  }

  /**
   * Link másolása
   */
  async copyLink(url: string): Promise<boolean> {
    return this.copy(url, 'Link');
  }
}
