import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PhotoshopService } from '../../services/photoshop.service';
import { PartnerService } from '../../services/partner.service';
import { TabloSize } from '../../models/partner.models';


@Component({
  selector: 'app-tablo-designer',
  standalone: true,
  imports: [LucideAngularModule, FormsModule],
  templateUrl: './tablo-designer.component.html',
  styleUrl: './tablo-designer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabloDesignerComponent implements OnInit {
  private readonly ps = inject(PhotoshopService);
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  /** PhotoshopService signal-ek */
  readonly psPath = this.ps.path;
  readonly workDir = this.ps.workDir;
  readonly isConfigured = this.ps.isConfigured;
  readonly checking = this.ps.checking;

  /** Lokális állapot */
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  /** Tablóméretek */
  readonly tabloSizes = signal<TabloSize[]>([]);
  readonly loadingSizes = signal(false);

  /** Tabló margó */
  readonly marginCm = this.ps.marginCm;
  readonly pendingMarginCm = signal<number>(2);

  /** Küszöbérték beállítások */
  readonly thresholdEnabled = signal(false);
  readonly thresholdValue = signal<number>(18);
  readonly sizeBelowThreshold = signal<string>('');
  readonly sizeAboveThreshold = signal<string>('');
  readonly savingAll = signal(false);

  ngOnInit(): void {
    this.ps.detectPhotoshop().then(() => {
      this.pendingMarginCm.set(this.marginCm());
    });
    this.loadTabloSizes();
  }

  private loadTabloSizes(): void {
    this.loadingSizes.set(true);
    this.partnerService.getTabloSizes().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.tabloSizes.set(res.sizes);
        // Küszöbérték betöltése
        if (res.threshold) {
          this.thresholdEnabled.set(true);
          this.thresholdValue.set(res.threshold.threshold);
          this.sizeBelowThreshold.set(res.threshold.below);
          this.sizeAboveThreshold.set(res.threshold.above);
        }
        this.loadingSizes.set(false);
      },
      error: () => {
        this.loadingSizes.set(false);
      },
    });
  }

  async selectWorkDir(): Promise<void> {
    this.error.set(null);
    this.successMessage.set(null);

    const dirPath = await this.ps.browseForWorkDir();
    if (!dirPath) return;

    const ok = await this.ps.setWorkDir(dirPath);
    if (ok) {
      this.successMessage.set('Munka mappa sikeresen beállítva!');
    } else {
      this.error.set('A kiválasztott mappa nem érvényes.');
    }
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

  /** Küszöbérték toggle */
  toggleThreshold(enabled: boolean): void {
    this.thresholdEnabled.set(enabled);
  }

  /** Összes beállítás mentése (margó + küszöbérték) */
  async saveAllSettings(): Promise<void> {
    this.error.set(null);
    this.successMessage.set(null);
    this.savingAll.set(true);

    try {
      // 1. Margó mentése (Electron IPC — skip ha nem elérhető)
      const clampedMargin = Math.min(10, Math.max(0, Number(this.pendingMarginCm())));
      if (typeof window.electronAPI?.photoshop?.setMargin === 'function') {
        const marginOk = await this.ps.setMargin(clampedMargin);
        if (!marginOk) {
          this.error.set('Nem sikerült menteni a margó értéket.');
          this.savingAll.set(false);
          return;
        }
      }

      // 2. Küszöbérték mentése
      const data: {
        sizes: TabloSize[];
        threshold?: number | null;
        size_below_threshold?: string | null;
        size_above_threshold?: string | null;
      } = {
        sizes: this.tabloSizes(),
      };

      if (this.thresholdEnabled()) {
        data.threshold = this.thresholdValue();
        data.size_below_threshold = this.sizeBelowThreshold();
        data.size_above_threshold = this.sizeAboveThreshold();
      } else {
        data.threshold = null;
        data.size_below_threshold = null;
        data.size_above_threshold = null;
      }

      this.partnerService.updateTabloSizes(data).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: (res) => {
          if (res.success) {
            this.successMessage.set('Beállítások mentve!');
          }
          this.savingAll.set(false);
        },
        error: () => {
          this.error.set('Nem sikerült menteni a beállításokat.');
          this.savingAll.set(false);
        },
      });
    } catch {
      this.error.set('Nem sikerült menteni a beállításokat.');
      this.savingAll.set(false);
    }
  }

  /** Méret label keresése value alapján */
  getSizeLabelByValue(value: string): string {
    const size = this.tabloSizes().find(s => s.value === value);
    return size?.label ?? value;
  }

}
