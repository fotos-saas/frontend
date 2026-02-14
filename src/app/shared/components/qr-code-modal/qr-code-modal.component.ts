import { Component, OnInit, input, output, inject, signal, ChangeDetectionStrategy, DestroyRef, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConfirmDialogComponent, ConfirmDialogResult } from '../confirm-dialog/confirm-dialog.component';
import { ICONS } from '../../constants/icons.constants';
import { QR_CODE_TYPES, QR_CODE_TYPE_LIST, QrCodeTypeKey } from '../../constants/qr-code-types';
import { DialogWrapperComponent } from '../dialog-wrapper/dialog-wrapper.component';
import { ClipboardService } from '../../../core/services/clipboard.service';
import { QrCode, IQrCodeService } from '../../interfaces/qr-code.interface';

@Component({
  selector: 'app-shared-qr-code-modal',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, ConfirmDialogComponent, DialogWrapperComponent],
  templateUrl: './qr-code-modal.component.html',
  styleUrl: './qr-code-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SharedQrCodeModalComponent implements OnInit {
  readonly ICONS = ICONS;
  readonly QR_CODE_TYPES = QR_CODE_TYPES;
  readonly typeList = QR_CODE_TYPE_LIST;

  projectId = input.required<number>();
  projectName = input<string>('');
  qrService = input.required<IQrCodeService>();
  isMarketer = input(false);

  close = output<void>();
  qrCodeChanged = output<QrCode[]>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly clipboardService = inject(ClipboardService);

  loading = signal(true);
  qrCodes = signal<QrCode[]>([]);
  error = signal<string | null>(null);
  copied = signal<number | null>(null);
  linkCopied = signal<number | null>(null);

  // Generate panel
  showGeneratePanel = signal(false);
  selectedType = signal<QrCodeTypeKey>('coordinator');
  isGenerating = signal(false);

  // Deactivate confirm
  deactivating = signal(false);
  deactivatingCodeId = signal<number | null>(null);
  showDeactivateConfirm = signal(false);

  // Image loading tracking
  imageLoadingMap = signal<Record<number, boolean>>({});

  private copyTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private linkCopyTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.copyTimeoutId) clearTimeout(this.copyTimeoutId);
      if (this.linkCopyTimeoutId) clearTimeout(this.linkCopyTimeoutId);
    });
  }

  readonly pinnedCode = computed(() =>
    this.qrCodes().find(c => c.isPinned) ?? null
  );

  readonly otherCodes = computed(() =>
    this.qrCodes().filter(c => !c.isPinned)
  );

  ngOnInit(): void {
    this.loadQrCodes();
  }

  private loadQrCodes(): void {
    this.loading.set(true);
    this.error.set(null);

    this.qrService().getProjectQrCodes(this.projectId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.qrCodes.set(response.qrCodes);
        // Init image loading states
        const map: Record<number, boolean> = {};
        response.qrCodes.forEach(c => map[c.id] = true);
        this.imageLoadingMap.set(map);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Hiba a QR kódok betöltése során');
        this.loading.set(false);
      }
    });
  }

  openGeneratePanel(): void {
    this.showGeneratePanel.set(true);
    this.selectedType.set('coordinator');
  }

  cancelGenerate(): void {
    this.showGeneratePanel.set(false);
  }

  generateNewQrCode(): void {
    if (this.isGenerating()) return;
    this.isGenerating.set(true);
    this.error.set(null);

    this.qrService().generateQrCode(this.projectId(), {
      type: this.selectedType(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        // Add new code and reload to get fresh list
        this.loadQrCodes();
        this.qrCodeChanged.emit([...this.qrCodes(), response.qrCode]);
        this.showGeneratePanel.set(false);
        this.isGenerating.set(false);
      },
      error: () => {
        this.error.set('Hiba az új QR kód generálása során');
        this.isGenerating.set(false);
      }
    });
  }

  pinCode(codeId: number): void {
    this.qrService().pinQrCode(this.projectId(), codeId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.loadQrCodes(),
      error: () => this.error.set('Hiba a rögzítés során'),
    });
  }

  getQrCodeImageUrl(code: QrCode): string {
    const url = encodeURIComponent(code.registrationUrl);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${url}`;
  }

  onImageLoad(codeId: number): void {
    this.imageLoadingMap.update(m => ({ ...m, [codeId]: false }));
  }

  onImageError(event: Event, codeId: number): void {
    this.imageLoadingMap.update(m => ({ ...m, [codeId]: false }));
    (event.target as HTMLImageElement).style.display = 'none';
  }

  isImageLoading(codeId: number): boolean {
    return this.imageLoadingMap()[codeId] ?? false;
  }

  copyCode(code: string, codeId: number): void {
    this.clipboardService.copy(code, 'QR kód').then((success) => {
      if (success) {
        this.copied.set(codeId);
        if (this.copyTimeoutId) clearTimeout(this.copyTimeoutId);
        this.copyTimeoutId = setTimeout(() => this.copied.set(null), 2000);
      }
    });
  }

  copyLink(url: string, codeId: number): void {
    this.clipboardService.copyLink(url).then((success) => {
      if (success) {
        this.linkCopied.set(codeId);
        if (this.linkCopyTimeoutId) clearTimeout(this.linkCopyTimeoutId);
        this.linkCopyTimeoutId = setTimeout(() => this.linkCopied.set(null), 2000);
      }
    });
  }

  printQrCode(code: QrCode): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const doc = printWindow.document;
    doc.open();

    const html = doc.createElement('html');
    const head = doc.createElement('head');
    const title = doc.createElement('title');
    title.textContent = `QR Kód - ${this.projectName()} - ${code.typeLabel}`;
    head.appendChild(title);

    const style = doc.createElement('style');
    style.textContent = `
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; text-align: center; padding: 40px; }
      h1 { font-size: 24px; margin-bottom: 10px; }
      .type { font-size: 16px; color: #666; margin-bottom: 20px; }
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

    const typeDiv = doc.createElement('div');
    typeDiv.className = 'type';
    typeDiv.textContent = code.typeLabel;
    body.appendChild(typeDiv);

    const img = doc.createElement('img');
    img.src = this.getQrCodeImageUrl(code);
    img.alt = 'QR Kód';
    body.appendChild(img);

    const codeDiv = doc.createElement('div');
    codeDiv.className = 'code';
    codeDiv.textContent = code.code;
    body.appendChild(codeDiv);

    const urlDiv = doc.createElement('div');
    urlDiv.className = 'url';
    urlDiv.textContent = code.registrationUrl;
    body.appendChild(urlDiv);

    html.appendChild(body);
    doc.appendChild(html);
    doc.close();

    img.onload = () => printWindow.print();
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('hu-HU', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  confirmDeactivate(codeId: number): void {
    if (this.deactivating()) return;
    this.deactivatingCodeId.set(codeId);
    this.showDeactivateConfirm.set(true);
  }

  onDeactivateConfirmResult(result: ConfirmDialogResult): void {
    if (result.action === 'confirm') {
      this.deactivateQrCode();
    } else {
      this.showDeactivateConfirm.set(false);
      this.deactivatingCodeId.set(null);
    }
  }

  private deactivateQrCode(): void {
    const codeId = this.deactivatingCodeId();
    if (!codeId) return;

    this.deactivating.set(true);
    this.error.set(null);

    this.qrService().deactivateQrCode(this.projectId(), codeId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deactivating.set(false);
        this.showDeactivateConfirm.set(false);
        this.deactivatingCodeId.set(null);
        this.loadQrCodes();
      },
      error: () => {
        this.error.set('Hiba a QR kód inaktiválása során');
        this.deactivating.set(false);
        this.showDeactivateConfirm.set(false);
      }
    });
  }

  getTypeConfig(type: QrCodeTypeKey) {
    return QR_CODE_TYPES[type];
  }
}
