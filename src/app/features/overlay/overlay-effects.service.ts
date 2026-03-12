import { Injectable, inject, NgZone, DestroyRef, signal, computed } from '@angular/core';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySettingsService } from './overlay-settings.service';

interface JsxResult {
  success?: boolean;
  output?: string;
  error?: string;
}

@Injectable()
export class OverlayEffectsService {
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly settings = inject(OverlaySettingsService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  // === Grid ===
  readonly gridPanelOpen = signal(false);
  readonly gridGapPx = signal<number | null>(null);
  readonly gridAlignTop = signal(false);
  readonly gridLayerCount = signal(0);
  readonly gridUnit = signal<'px' | 'cm'>('cm');
  readonly gridCols = signal(5);
  readonly gridRows = signal(0);
  readonly gridGapH = signal(2);
  readonly gridGapV = signal(3);
  readonly gridAlign = signal<'left' | 'center' | 'right'>('center');
  readonly imagesOnly = signal(false);
  private gridDpi = 300;

  readonly gridGapDisplay = computed(() => {
    const px = this.gridGapPx();
    if (px === null) return null;
    return this.gridUnit() === 'cm' ? Math.round((px / this.gridDpi) * 2.54 * 100) / 100 : px;
  });
  readonly gridGapHDisplay = computed(() => {
    return this.gridUnit() === 'cm' ? this.gridGapH() : Math.round((this.gridGapH() / 2.54) * this.gridDpi);
  });
  readonly gridGapVDisplay = computed(() => {
    return this.gridUnit() === 'cm' ? this.gridGapV() : Math.round((this.gridGapV() / 2.54) * this.gridDpi);
  });

  // === Forgatás ===
  readonly rotatePanelOpen = signal(false);
  readonly rotateAngle = signal(2);
  readonly rotateRandom = signal(true);

  // === Border radius ===
  readonly borderRadius = signal(30);
  readonly borderRadiusUseSelected = signal(false);

  // === Eredmény ===
  readonly loading = signal(false);
  readonly result = signal<{ success: boolean; message: string } | null>(null);
  private resultTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly RESULT_TIMEOUT_MS = 3000;

  /** Külső referencia: getLayerNames a quick-actions-ből */
  private _getLayerNames!: (target: string) => Promise<string[]>;

  constructor() {
    this.destroyRef.onDestroy(() => { if (this.resultTimer) clearTimeout(this.resultTimer); });
  }

  configure(opts: { getLayerNames: (target: string) => Promise<string[]> }): void {
    this._getLayerNames = opts.getLayerNames;
  }

  setResult(success: boolean, message: string): void {
    if (this.resultTimer) clearTimeout(this.resultTimer);
    this.ngZone.run(() => this.result.set({ success, message }));
    this.resultTimer = setTimeout(
      () => this.ngZone.run(() => this.result.set(null)),
      OverlayEffectsService.RESULT_TIMEOUT_MS,
    );
  }

  // === Panel kezelés ===

  toggleGridPanel(): void { this.gridPanelOpen.update(v => !v); this.rotatePanelOpen.set(false); }
  closeGridPanel(): void { this.gridPanelOpen.set(false); }
  toggleRotatePanel(): void { this.rotatePanelOpen.update(v => !v); this.gridPanelOpen.set(false); }
  closeRotatePanel(): void { this.rotatePanelOpen.set(false); }

  toggleGridUnit(): void { this.gridUnit.update(u => u === 'px' ? 'cm' : 'px'); }

  setGridGapHFromDisplay(value: number): void {
    this.gridGapH.set(this.gridUnit() === 'cm' ? value : Math.round((value / this.gridDpi) * 2.54 * 100) / 100);
  }

  setGridGapVFromDisplay(value: number): void {
    this.gridGapV.set(this.gridUnit() === 'cm' ? value : Math.round((value / this.gridDpi) * 2.54 * 100) / 100);
  }

  setGridGapFromDisplay(value: number): void {
    this.gridGapPx.set(this.gridUnit() === 'cm' ? Math.round((value / 2.54) * this.gridDpi) : value);
  }

  setRotateAngle(value: number): void {
    this.rotateAngle.set(Math.max(0.1, Math.round(value * 10) / 10));
  }

  toggleRotateRandom(): void { this.rotateRandom.update(v => !v); }

  setBorderRadius(value: number): void { this.borderRadius.set(Math.max(1, Math.round(value))); }

  // === Akciók ===

  async alignTopOnly(): Promise<void> {
    this.loading.set(true);
    try {
      const params: Record<string, string> = { ALIGN_TOP_ONLY: 'true' };
      if (this.imagesOnly()) params['IMAGES_ONLY'] = 'true';
      const result = await this.ps.runJsx('equalize-grid', 'actions/equalize-grid-selected.jsx', params);
      this.handleJsxResult(result, data => `${data['aligned']} kep egy szintre igazitva`, 'Felso el igazitas kesz');
    } finally { this.loading.set(false); }
  }

  async measureGridGaps(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.ps.runJsx('equalize-grid', 'actions/equalize-grid-selected.jsx', {});
      try {
        if (result?.output) {
          const data: Record<string, unknown> = JSON.parse(result.output.trim());
          if (data['error']) { this.setResult(false, String(data['error'])); return; }
          if (data['mode'] === 'measure') {
            this.ngZone.run(() => {
              if (typeof data['dpi'] === 'number') this.gridDpi = data['dpi'] as number;
              this.gridGapPx.set(data['avgGapPx'] as number);
              this.gridLayerCount.set(data['count'] as number);
            });
            this.setResult(true, `${data['count']} kep, atlag gap: ${data['avgGapPx']} px`);
          }
        } else {
          this.setResult(false, 'Nincs valasz a Photoshoptol');
        }
      } catch { this.setResult(false, 'Hiba a valasz feldolgozasaban'); }
    } finally { this.loading.set(false); }
  }

  async executeEqualizeGrid(): Promise<void> {
    const gap = this.gridGapPx();
    if (gap === null) { this.setResult(false, 'Elobb merd meg a terkoezt'); return; }
    const params: Record<string, string> = {
      GAP_H_PX: String(gap), ALIGN_TOP: this.gridAlignTop() ? 'true' : 'false',
    };
    if (this.imagesOnly()) params['IMAGES_ONLY'] = 'true';
    const result = await this.ps.runJsx('equalize-grid', 'actions/equalize-grid-selected.jsx', params);
    const label = this.imagesOnly() ? 'kep elosztva (csak kepek)' : 'kep elosztva';
    this.handleJsxResult(result, data => `${data['moved']} ${label}`, 'Elosztas kesz');
  }

  async executeGridArrange(): Promise<void> {
    const cols = this.gridCols();
    if (cols < 1) { this.setResult(false, 'Az oszlopszam legalabb 1 legyen'); return; }
    await this.fetchDocDpi();
    const dpi = this.gridDpi || 300;
    const cmToPx = (cm: number) => Math.round((cm / 2.54) * dpi);
    const rows = this.gridRows();
    const params: Record<string, string> = {
      GRID_COLS: String(cols), GRID_ROWS: rows > 0 ? String(rows) : '',
      GRID_GAP_H_PX: String(cmToPx(this.gridGapH())), GRID_GAP_V_PX: String(cmToPx(this.gridGapV())),
      GRID_ALIGN: this.gridAlign(),
    };
    if (this.imagesOnly()) params['IMAGES_ONLY'] = 'true';
    const result = await this.ps.runJsx('equalize-grid', 'actions/equalize-grid-selected.jsx', params);
    this.handleJsxResult(result,
      data => `${data['placed']} kep racsba rendezve (${data['cols']}x${data['rows']})`,
      'Racsba rendezes kesz',
    );
  }

  async executeCenterSelected(): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.ps.runJsx('center-selected', 'actions/center-selected.jsx', {});
      this.handleJsxResult(result,
        data => {
          if (data['dx'] === 0) return String(data['message']) || 'Mar kozepen van';
          return `${data['count']} kep kozepre igazitva (${data['dx']}px)`;
        },
        'Kozepre igazitas kesz',
      );
    } finally { this.loading.set(false); }
  }

  async applyRotateSelected(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const angle = this.rotateAngle();
      if (angle <= 0) { this.setResult(false, 'A szog legalabb 0.1 legyen'); return; }
      const result = await this.ps.runJsx('rotate-selected', 'actions/rotate-selected.jsx', { angle, random: this.rotateRandom() });
      this.handleJsxResult(result,
        data => {
          const mode = this.rotateRandom() ? `random +/-${angle}` : `${angle}`;
          return `${data['rotated']} layer forgatva (${mode}, ${data['skipped']} kihagyva)`;
        },
        'Forgatas kesz',
      );
    } finally { this.loading.set(false); }
  }

  async applyBorderRadiusSelected(): Promise<void> {
    if (this.loading()) return;
    this.loading.set(true);
    try {
      const radius = this.borderRadius();
      if (radius <= 0) { this.setResult(false, 'A sugar legalabb 1px legyen'); return; }
      const result = await this.ps.runJsx('border-radius', 'actions/apply-border-radius.jsx', { radius, useSelectedLayers: true });
      this.handleJsxResult(result,
        data => `${data['masked']} layer lekerekitve (${data['skipped']} kihagyva)`,
        'Lekerekites kesz',
      );
    } finally { this.loading.set(false); }
  }

  async executeBorderRadius(): Promise<void> {
    const radius = this.borderRadius();
    if (radius <= 0) { this.setResult(false, 'A sugar legalabb 1px legyen'); return; }
    const useSelected = this.borderRadiusUseSelected();
    const jsonData: Record<string, unknown> = { radius, useSelectedLayers: useSelected };
    if (!useSelected) {
      const layerNames = await this._getLayerNames('all');
      if (layerNames.length === 0) { this.setResult(false, 'Nincsenek image layerek'); return; }
      jsonData['layerNames'] = layerNames;
    }
    const result = await this.ps.runJsx('border-radius', 'actions/apply-border-radius.jsx', jsonData);
    this.handleJsxResult(result,
      data => `${data['masked']} layer lekerekitve (${data['skipped']} kihagyva)`,
      'Lekerekites kesz',
    );
  }

  private async fetchDocDpi(): Promise<void> {
    try {
      const result = await this.ps.runJsx('equalize-grid', 'actions/equalize-grid-selected.jsx', {});
      if (result?.output) {
        const data: Record<string, unknown> = JSON.parse(result.output.trim());
        if (typeof data['dpi'] === 'number') this.gridDpi = data['dpi'] as number;
      }
    } catch { /* DPI marad az elozo ertek */ }
  }

  private handleJsxResult(
    result: JsxResult | null,
    formatSuccess: (data: Record<string, unknown>) => string,
    fallbackMessage: string,
  ): void {
    try {
      if (result?.output) {
        const data: Record<string, unknown> = JSON.parse(result.output.trim());
        if (data['error']) { this.setResult(false, String(data['error'])); return; }
        this.setResult(true, formatSuccess(data));
      } else {
        this.setResult(true, fallbackMessage);
      }
    } catch { this.setResult(true, fallbackMessage); }
  }
}
