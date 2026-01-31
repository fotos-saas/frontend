import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, inject, signal, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, QrCode } from '../services/partner.service';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../shared/utils/dialog.util';

/**
 * Partner QR Code Modal - QR kód megjelenítése és kezelése.
 */
@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ConfirmDialogComponent],
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
    >
      <div class="dialog-panel dialog-panel--md relative" (click)="$event.stopPropagation()">
        <!-- Close button -->
        <button
          type="button"
          class="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors z-10"
          (click)="close.emit()"
        ><lucide-icon [name]="ICONS.X" [size]="18" /></button>

        <div class="p-6">
          @if (loading()) {
            <div class="text-center py-12">
              <div class="w-10 h-10 border-3 border-gray-200 border-t-primary rounded-full animate-spin mx-auto"></div>
              <p class="mt-4 text-gray-500">Betöltés...</p>
            </div>
          } @else if (qrCode()) {
            <!-- Header -->
            <div class="text-center mb-6">
              <div class="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                <lucide-icon [name]="ICONS.QR_CODE" [size]="32" />
              </div>
              <h2 class="text-xl font-bold text-gray-900">QR Kód</h2>
              <p class="text-gray-500 text-sm mt-1">Oszd meg a regisztrációs linket</p>
            </div>

            <!-- QR kód kép -->
            <div class="flex justify-center mb-6">
              <div class="bg-white border-2 border-gray-200 rounded-xl p-4 shadow-sm relative">
                <div class="relative w-48 h-48">
                  @if (imageLoading()) {
                    <div class="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg">
                      <div class="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  }
                  <img
                    [src]="getQrCodeImageUrl(qrCode()!.code)"
                    [alt]="'QR kód: ' + qrCode()!.code"
                    class="w-48 h-48"
                    [class.opacity-0]="imageLoading()"
                    (load)="onImageLoad()"
                    (error)="onImageError($event)"
                  />
                </div>
                <div class="text-center mt-3">
                  <code class="text-xl font-bold font-mono tracking-wider text-gray-900">{{ qrCode()!.code }}</code>
                </div>
                <!-- Nyomtatás gomb a kártyán -->
                <button
                  class="absolute bottom-2 right-2 w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-500 hover:text-gray-700 transition-colors"
                  data-tooltip="Nyomtatás"
                  (click)="printQrCode()"
                ><lucide-icon [name]="ICONS.PRINTER" [size]="16" /></button>
              </div>
            </div>

            <!-- Info táblázat -->
            <div class="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-500">Kód</span>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-semibold text-gray-900">{{ qrCode()!.code }}</span>
                  <button
                    class="w-8 h-8 flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 rounded-md transition-colors text-gray-600"
                    (click)="copyCode(qrCode()!.code)"
                  ><lucide-icon [name]="copied() ? ICONS.CHECK : ICONS.COPY" [size]="16" /></button>
                </div>
              </div>
              <div class="flex items-center justify-between border-t border-gray-200 pt-3">
                <span class="text-sm text-gray-500">Használat</span>
                <span class="font-medium text-gray-900">
                  {{ qrCode()!.usageCount }}
                  @if (qrCode()!.maxUsages) { / {{ qrCode()!.maxUsages }} }
                  @else { (korlátlan) }
                </span>
              </div>
              <div class="flex items-center justify-between border-t border-gray-200 pt-3">
                <span class="text-sm text-gray-500">Lejárat</span>
                <span class="font-medium" [class.text-red-600]="!qrCode()!.isValid" [class.text-gray-900]="qrCode()!.isValid">
                  @if (qrCode()!.expiresAt) { {{ formatDate(qrCode()!.expiresAt!) }} }
                  @else { Nincs lejárat }
                </span>
              </div>
              <div class="flex items-center justify-between border-t border-gray-200 pt-3">
                <span class="text-sm text-gray-500">Státusz</span>
                @if (qrCode()!.isValid) {
                  <span class="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                    <lucide-icon [name]="ICONS.CHECK" [size]="12" /> Aktív
                  </span>
                } @else {
                  <span class="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                    <lucide-icon [name]="ICONS.X" [size]="12" /> Inaktív
                  </span>
                }
              </div>
            </div>

            <!-- Regisztrációs link -->
            <div class="mb-6">
              <label class="block text-sm text-gray-500 mb-2">Regisztrációs link</label>
              <div class="flex gap-2">
                <input
                  type="text"
                  [value]="qrCode()!.registrationUrl"
                  readonly
                  class="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600"
                />
                <button
                  class="w-10 h-10 flex items-center justify-center border border-gray-200 bg-white hover:bg-gray-50 rounded-lg transition-colors text-gray-600"
                  (click)="copyLink(qrCode()!.registrationUrl)"
                ><lucide-icon [name]="linkCopied() ? ICONS.CHECK : ICONS.COPY" [size]="18" /></button>
              </div>
            </div>

            <!-- Fő akció gombok -->
            <div class="flex gap-3 mb-3">
              <button
                class="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                (click)="close.emit()"
              >
                Bezárás
              </button>
              <button
                class="flex-1 px-4 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                (click)="generateNewQrCode()"
              >
                <lucide-icon [name]="ICONS.REFRESH" [size]="18" />
                Új kód
              </button>
            </div>

            <!-- Inaktiválás link -->
            <div class="text-center">
              <button
                class="px-3 py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors inline-flex items-center gap-1.5"
                (click)="confirmDeactivate()"
                [disabled]="deactivating()"
              >
                @if (deactivating()) {
                  <span class="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin"></span>
                } @else {
                  <lucide-icon [name]="ICONS.BAN" [size]="14" />
                }
                QR kód inaktiválása
              </button>
            </div>
          } @else {
            <!-- Nincs QR kód -->
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-400">
                <lucide-icon [name]="ICONS.QR_CODE" [size]="32" />
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Nincs aktív QR kód</h2>
              <p class="text-gray-500 mb-6">Ehhez a projekthez még nincs QR kód generálva.</p>
              <button
                class="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-xl transition-colors inline-flex items-center gap-2"
                (click)="generateNewQrCode()"
              >
                <lucide-icon [name]="ICONS.PLUS" [size]="18" />
                QR kód generálása
              </button>
            </div>
          }

          @if (error()) {
            <div class="mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {{ error() }}
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Inaktiválás megerősítő dialog -->
    @if (showDeactivateConfirm()) {
      <app-confirm-dialog
        [title]="'QR kód inaktiválása'"
        [message]="'Biztosan inaktiválni szeretnéd a QR kódot? Ezután a kóddal nem lehet regisztrálni.'"
        [confirmText]="'Inaktiválás'"
        [confirmType]="'danger'"
        [isSubmitting]="deactivating()"
        (resultEvent)="onDeactivateConfirmResult($event)"
      />
    }
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrCodeModalComponent implements OnInit, OnDestroy {
  readonly ICONS = ICONS;

  /** Backdrop kezelő - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  backdropHandler = createBackdropHandler(() => this.close.emit());

  @Input({ required: true }) projectId!: number;
  @Input() projectName = '';
  @Output() close = new EventEmitter<void>();
  @Output() qrCodeChanged = new EventEmitter<QrCode | null>();

  private partnerService = inject(PartnerService);
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
    if (this.copyTimeoutId) {
      clearTimeout(this.copyTimeoutId);
    }
    if (this.linkCopyTimeoutId) {
      clearTimeout(this.linkCopyTimeoutId);
    }
  }

  private loadQrCode(): void {
    this.loading.set(true);
    this.error.set(null);
    this.imageLoading.set(true);

    this.partnerService.getProjectQrCode(this.projectId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        if (response.hasQrCode && response.qrCode) {
          this.qrCode.set(response.qrCode);
        } else {
          this.qrCode.set(null);
        }
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

    this.partnerService.generateQrCode(this.projectId).pipe(
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
    title.textContent = `QR Kód - ${this.projectName}`;
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
    h1.textContent = this.projectName;
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

    this.partnerService.deactivateQrCode(this.projectId).pipe(
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
