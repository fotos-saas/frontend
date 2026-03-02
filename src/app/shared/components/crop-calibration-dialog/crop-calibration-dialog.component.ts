import { Component, ChangeDetectionStrategy, inject, signal, computed, output, input, effect, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { createBackdropHandler } from '@shared/utils/dialog.util';
import { computeCropRect, parseAspectRatio, type CropRect } from '@shared/utils/crop-math.util';
import { ElectronCropService } from '@core/services/electron-crop.service';
import { LoggerService } from '@core/services/logger.service';
import type { CropFaceLandmarks } from '@core/services/electron.types';
import type { CropSettings } from '@features/partner/models/crop.models';

@Component({
  selector: 'app-crop-calibration-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './crop-calibration-dialog.component.html',
  styleUrl: './crop-calibration-dialog.component.scss',
})
export class CropCalibrationDialogComponent {
  private readonly cropService = inject(ElectronCropService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  /** Aktuális beállítások (szülőtől) */
  readonly initialSettings = input.required<CropSettings>();

  /** Dialógus bezárás */
  readonly close = output<void>();

  /** Beállítások alkalmazása */
  readonly apply = output<CropSettings>();

  readonly ICONS = ICONS;
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  // State
  readonly detecting = signal(false);
  readonly imageUrl = signal<string | null>(null);
  readonly imagePath = signal<string | null>(null);
  readonly imageWidth = signal(0);
  readonly imageHeight = signal(0);
  readonly face = signal<CropFaceLandmarks | null>(null);
  readonly error = signal<string | null>(null);

  // Lokális beállítások (szerkeszthető)
  readonly headPaddingTop = signal(0.25);
  readonly chinPaddingBottom = signal(0.40);
  readonly shoulderWidth = signal(0.85);
  readonly facePositionY = signal(0.38);
  readonly aspectRatio = signal<string>('4:5');

  /** Computed: van-e betöltött kép + arc */
  readonly hasDetection = computed(() => this.face() !== null && this.imageUrl() !== null);

  /** Computed: aspect ratio padding-bottom % (Safari 14 compat, aspect-ratio helyett) */
  readonly aspectRatioPadding = computed(() => {
    const ar = parseAspectRatio(this.aspectRatio());
    return ar > 0 ? `${(1 / ar) * 100}%` : '125%';
  });

  /** Computed: crop téglalap pixelben (az eredeti képre vetítve) */
  readonly cropRect = computed<CropRect | null>(() => {
    const f = this.face();
    const imgW = this.imageWidth();
    const imgH = this.imageHeight();
    if (!f || imgW === 0 || imgH === 0) return null;

    return computeCropRect(f, imgW, imgH, {
      head_padding_top: this.headPaddingTop(),
      chin_padding_bottom: this.chinPaddingBottom(),
      shoulder_width: this.shoulderWidth(),
      face_position_y: this.facePositionY(),
      aspect_ratio: this.aspectRatio(),
    });
  });

  /** Computed: crop keret % az eredeti képhez (CSS-hez) */
  readonly cropCss = computed(() => {
    const rect = this.cropRect();
    const imgW = this.imageWidth();
    const imgH = this.imageHeight();
    if (!rect || imgW === 0 || imgH === 0) return null;

    return {
      left: `${(rect.left / imgW) * 100}%`,
      top: `${(rect.top / imgH) * 100}%`,
      width: `${(rect.width / imgW) * 100}%`,
      height: `${(rect.height / imgH) * 100}%`,
    };
  });

  /** Computed: preview object-position + object-fit */
  readonly previewStyle = computed(() => {
    const rect = this.cropRect();
    const imgW = this.imageWidth();
    const imgH = this.imageHeight();
    if (!rect || imgW === 0 || imgH === 0) return null;

    const posX = (rect.left + rect.width / 2) / imgW * 100;
    const posY = (rect.top + rect.height / 2) / imgH * 100;
    const scaleX = imgW / rect.width;

    return {
      objectPosition: `${posX}% ${posY}%`,
      transform: `scale(${scaleX.toFixed(2)})`,
    };
  });

  private readonly settingsInitialized = signal(false);

  constructor() {
    // Iniciális értékek beállítása az input-ból
    effect(() => {
      const settings = this.initialSettings();
      if (settings && !this.settingsInitialized()) {
        this.headPaddingTop.set(settings.head_padding_top);
        this.chinPaddingBottom.set(settings.chin_padding_bottom);
        this.shoulderWidth.set(settings.shoulder_width);
        this.facePositionY.set(settings.face_position_y);
        this.aspectRatio.set(settings.aspect_ratio);
        this.settingsInitialized.set(true);
      }
    });

    // Object URL cleanup destroy-kor
    this.destroyRef.onDestroy(() => this.revokeCurrentUrl());
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Előző URL felszabadítása
    this.revokeCurrentUrl();

    // Local URL preview
    const url = URL.createObjectURL(file);
    this.imageUrl.set(url);
    this.error.set(null);
    this.face.set(null);

    // Kép méret megállapítás
    const img = new Image();
    img.onload = () => {
      this.imageWidth.set(img.naturalWidth);
      this.imageHeight.set(img.naturalHeight);
    };
    img.src = url;

    // Temp könyvtárba írjuk a fájlt az Electron-os detektáláshoz
    const tempDir = await this.cropService.getTempDir();
    if (!tempDir) {
      this.error.set('Temp könyvtár nem elérhető');
      return;
    }

    this.logger.info('Kalibráció: fájl kiválasztva, detektálás...');
    this.detecting.set(true);

    // A fájl path csak Electron-ban érhető el
    const filePath = (file as unknown as { path?: string }).path;
    if (!filePath) {
      this.error.set('Fájl útvonal nem elérhető (csak Electron alkalmazásban)');
      this.detecting.set(false);
      return;
    }

    this.imagePath.set(filePath);
    const result = await this.cropService.detectFaces(filePath);
    this.detecting.set(false);

    if (!result.success || !result.faces?.length) {
      this.error.set(result.error || 'Nem található arc a képen');
      return;
    }

    this.face.set(result.faces[0]);
  }

  onApply(): void {
    const settings: CropSettings = {
      ...this.initialSettings(),
      preset: 'custom',
      head_padding_top: this.headPaddingTop(),
      chin_padding_bottom: this.chinPaddingBottom(),
      shoulder_width: this.shoulderWidth(),
      face_position_y: this.facePositionY(),
      aspect_ratio: this.aspectRatio() as CropSettings['aspect_ratio'],
    };
    this.apply.emit(settings);
  }

  private revokeCurrentUrl(): void {
    const currentUrl = this.imageUrl();
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }
  }
}
