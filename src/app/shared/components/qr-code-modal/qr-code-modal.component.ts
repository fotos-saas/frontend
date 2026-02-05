import { Component, OnInit, OnDestroy, input, output, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../constants/icons.constants';
import { createBackdropHandler } from '../../utils/dialog.util';
import { QrCode, IQrCodeService } from '../../interfaces/qr-code.interface';

/**
 * Shared QR Code Modal - QR kód megjelenítése és kezelése.
 * Partner és Marketer modulok közös komponense.
 */
@Component({
  selector: 'app-shared-qr-code-modal',
  standalone: true,
  imports: [LucideAngularModule, ConfirmDialogComponent],
  templateUrl: './qr-code-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedQrCodeModalComponent implements OnInit, OnDestroy {
  readonly ICONS = ICONS;
  backdropHandler = createBackdropHandler(() => this.close.emit());

  /** Input: projekt azonosító */
  projectId = input.required<number>();

  /** Input: projekt neve (nyomtatáshoz) */
  projectName = input<string>('');

  /** Input: QR service (Partner vagy Marketer) */
  qrService = input.required<IQrCodeService>();

  /** Output: bezárás */
  close = output<void>();

  /** Output: QR kód változás */
  qrCodeChanged = output<QrCode | null>();

  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  qrCode = signal<QrCode | null>(null);
  error = signal<string | null>(null);
  copied = signal(false);
  linkCopied = signal(false);
  deactivating = signal(false);
  showDeactivateConfirm = signal(false);
  imageLoading = signal(true);

  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private linkCopyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isGenerating = false;

  ngOnInit(): void {
    this.loadQrCode();
  }

  ngOnDestroy(): void {
    if (this.copyTimeoutId) clearTimeout(this.copyTimeoutId);
    if (this.linkCopyTimeoutId) clearTimeout(this.linkCopyTimeoutId);
  }

  private loadQrCode(): void {
    this.loading.set(true);
    this.error.set(null);
    this.imageLoading.set(true);

    this.qrService().getProjectQrCode(this.projectId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.qrCode.set(response.hasQrCode && response.qrCode ? response.qrCode : null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Hiba a QR kód betöltése során');
        this.loading.set(false);
      }
    });
  }

  generateNewQrCode(): void {
    if (this.isGenerating) return;
    this.isGenerating = true;
    this.loading.set(true);
    this.error.set(null);

    this.qrService().generateQrCode(this.projectId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.qrCode.set(response.qrCode);
        this.qrCodeChanged.emit(response.qrCode);
        this.loading.set(false);
        this.isGenerating = false;
      },
      error: () => {
        this.error.set('Hiba az új QR kód generálása során');
        this.loading.set(false);
        this.isGenerating = false;
      }
    });
  }

  getQrCodeImageUrl(code: string): string {
    const url = encodeURIComponent(this.qrCode()?.registrationUrl ?? '');
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${url}`;
  }

  onImageLoad(): void {
    this.imageLoading.set(false);
  }

  onImageError(event: Event): void {
    this.imageLoading.set(false);
    (event.target as HTMLImageElement).style.display = 'none';
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => {
      this.copied.set(true);
      if (this.copyTimeoutId) clearTimeout(this.copyTimeoutId);
      this.copyTimeoutId = setTimeout(() => this.copied.set(false), 2000);
    });
  }

  copyLink(url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      this.linkCopied.set(true);
      if (this.linkCopyTimeoutId) clearTimeout(this.linkCopyTimeoutId);
      this.linkCopyTimeoutId = setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  printQrCode(): void {
    const qrCodeData = this.qrCode();
    if (!qrCodeData) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = printWindow.document;
    doc.open();

    const html = doc.createElement('html');
    const head = doc.createElement('head');
    const title = doc.createElement('title');
    title.textContent = `QR Kód - ${this.projectName()}`;
    head.appendChild(title);

    const style = doc.createElement('style');
    style.textContent = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        text-align: center;
        padding: 40px;
      }
      h1 { font-size: 24px; margin-bottom: 20px; }
      .code { font-size: 32px; font-family: monospace; margin: 20px 0; }
      img { width: 300px; height: 300px; }
      .url { font-size: 12px; color: #666; word-break: break-all; max-width: 400px; margin: 20px auto; }
    `;
    head.appendChild(style);
    html.appendChild(head);

    const body = doc.createElement('body');

    const h1 = doc.createElement('h1');
    h1.textContent = this.projectName();
    body.appendChild(h1);

    const img = doc.createElement('img');
    img.src = this.getQrCodeImageUrl(qrCodeData.code);
    img.alt = 'QR Kód';
    body.appendChild(img);

    const codeDiv = doc.createElement('div');
    codeDiv.className = 'code';
    codeDiv.textContent = qrCodeData.code;
    body.appendChild(codeDiv);

    const urlDiv = doc.createElement('div');
    urlDiv.className = 'url';
    urlDiv.textContent = qrCodeData.registrationUrl;
    body.appendChild(urlDiv);

    html.appendChild(body);
    doc.appendChild(html);
    doc.close();

    img.onload = () => printWindow.print();
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  confirmDeactivate(): void {
    if (this.deactivating()) return;
    this.showDeactivateConfirm.set(true);
  }

  onDeactivateConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deactivateQrCode();
    } else {
      this.showDeactivateConfirm.set(false);
    }
  }

  private deactivateQrCode(): void {
    this.deactivating.set(true);
    this.error.set(null);

    this.qrService().deactivateQrCode(this.projectId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.qrCode.set(null);
        this.qrCodeChanged.emit(null);
        this.deactivating.set(false);
        this.showDeactivateConfirm.set(false);
      },
      error: () => {
        this.error.set('Hiba a QR kód inaktiválása során');
        this.deactivating.set(false);
        this.showDeactivateConfirm.set(false);
      }
    });
  }
}
