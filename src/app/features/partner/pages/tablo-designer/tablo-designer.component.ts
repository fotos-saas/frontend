import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PhotoshopService } from '../../services/photoshop.service';
import { PartnerService } from '../../services/partner.service';
import { TabloSize } from '../../models/partner.models';

type TabloTab = 'test' | 'settings';

@Component({
  selector: 'app-tablo-designer',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './tablo-designer.component.html',
  styleUrl: './tablo-designer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabloDesignerComponent implements OnInit {
  private readonly ps = inject(PhotoshopService);
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  /** Aktív tab */
  readonly activeTab = signal<TabloTab>('test');

  /** PhotoshopService signal-ek */
  readonly psPath = this.ps.path;
  readonly isConfigured = this.ps.isConfigured;
  readonly checking = this.ps.checking;

  /** Lokális állapot */
  readonly launching = signal(false);
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  /** Tablóméretek */
  readonly tabloSizes = signal<TabloSize[]>([]);
  readonly selectedSize = signal<TabloSize | null>(null);
  readonly loadingSizes = signal(false);
  readonly generating = signal(false);

  ngOnInit(): void {
    this.ps.detectPhotoshop();
    this.loadTabloSizes();
  }

  private loadTabloSizes(): void {
    this.loadingSizes.set(true);
    this.partnerService.getTabloSizes().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.tabloSizes.set(res.sizes);
        if (res.sizes.length > 0) {
          this.selectedSize.set(res.sizes[0]);
        }
        this.loadingSizes.set(false);
      },
      error: () => {
        this.loadingSizes.set(false);
      },
    });
  }

  selectSize(size: TabloSize): void {
    this.selectedSize.set(size);
  }

  async selectPsPath(): Promise<void> {
    this.error.set(null);
    this.successMessage.set(null);

    const path = await this.ps.browseForPhotoshop();
    if (!path) return;

    const ok = await this.ps.setPath(path);
    if (ok) {
      this.successMessage.set('Photoshop sikeresen beállítva!');
    } else {
      this.error.set('A kiválasztott fájl nem egy érvényes Photoshop alkalmazás.');
    }
  }

  async launchPs(): Promise<void> {
    this.error.set(null);
    this.successMessage.set(null);
    this.launching.set(true);

    try {
      const result = await this.ps.launchPhotoshop();
      if (result.success) {
        this.successMessage.set('Photoshop elindítva!');
      } else {
        this.error.set(result.error || 'Nem sikerült elindítani a Photoshop-ot.');
      }
    } finally {
      this.launching.set(false);
    }
  }

  async generatePsd(): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    this.error.set(null);
    this.successMessage.set(null);
    this.generating.set(true);

    try {
      const result = await this.ps.generateAndOpenPsd(size);
      if (result.success) {
        this.successMessage.set(`PSD generálva és megnyitva: ${size.label}`);
      } else {
        this.error.set(result.error || 'PSD generálás sikertelen.');
      }
    } finally {
      this.generating.set(false);
    }
  }

  /** Meret szamitas megjelenitkeshez */
  getSizePixels(size: TabloSize): string {
    const dims = this.ps.parseSizeValue(size.value);
    if (!dims) return '';
    const w = Math.round(dims.widthCm * 200 / 2.54);
    const h = Math.round(dims.heightCm * 200 / 2.54);
    return `${w}×${h} px`;
  }
}
