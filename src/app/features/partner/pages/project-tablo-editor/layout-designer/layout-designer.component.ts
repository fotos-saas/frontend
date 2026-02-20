import {
  Component, ChangeDetectionStrategy, input, output, inject,
  OnInit, OnDestroy, ElementRef, viewChild, signal,
} from '@angular/core';
import { SnapshotLayer } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { PhotoshopService } from '../../../services/photoshop.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { LayoutDesignerActionsService } from './layout-designer-actions.service';
import { LayoutToolbarComponent } from './components/layout-toolbar/layout-toolbar.component';
import { LayoutCanvasComponent } from './components/layout-canvas/layout-canvas.component';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DesignerDocument } from './layout-designer.types';

/**
 * Vizuális Tábló Szerkesztő — fullscreen overlay.
 * A snapshot adatai alapján arányosan megjeleníti a tábló elrendezését.
 */
@Component({
  selector: 'app-layout-designer',
  standalone: true,
  imports: [LayoutToolbarComponent, LayoutCanvasComponent, LucideAngularModule],
  providers: [LayoutDesignerStateService, LayoutDesignerActionsService],
  template: `
    <div
      class="layout-designer-overlay"
      #overlayEl
      (keydown.escape)="close()"
      tabindex="0"
    >
      @if (loading()) {
        <div class="layout-designer__loading">
          <lucide-icon [name]="ICONS.LOADER" [size]="32" class="spin" />
          <span>Pillanatkép betöltése...</span>
        </div>
      } @else if (loadError()) {
        <div class="layout-designer__error">
          <lucide-icon [name]="ICONS.X_CIRCLE" [size]="32" />
          <span>{{ loadError() }}</span>
          <button class="designer-btn" (click)="close()">Bezárás</button>
        </div>
      } @else {
        <app-layout-toolbar
          [refreshing]="refreshing()"
          (refreshClicked)="refresh()"
          (saveClicked)="save()"
          (closeClicked)="close()"
        />
        <app-layout-canvas />
      }
    </div>
  `,
  styles: [`
    :host { display: contents; }

    .layout-designer-overlay {
      position: fixed;
      inset: 0;
      z-index: 1100;
      background: #1a1a2e;
      display: flex;
      flex-direction: column;
      outline: none;
    }

    .layout-designer__loading,
    .layout-designer__error {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      color: rgba(255, 255, 255, 0.6);
      font-size: 0.95rem;
    }

    .layout-designer__error {
      color: #fca5a5;
    }

    .designer-btn {
      margin-top: 8px;
      padding: 8px 20px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: transparent;
      color: rgba(255, 255, 255, 0.7);
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.12s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #ffffff;
      }
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutDesignerComponent implements OnInit, OnDestroy {
  private readonly state = inject(LayoutDesignerStateService);
  private readonly ps = inject(PhotoshopService);
  protected readonly ICONS = ICONS;

  /** Betöltendő snapshot fájl útvonala */
  readonly snapshotPath = input.required<string>();

  /** PSD fájl útvonala (frissítéshez szükséges) */
  readonly psdPath = input.required<string>();

  /** Projekt személyei */
  readonly persons = input.required<TabloPersonItem[]>();

  /** Tábló méret konfiguráció */
  readonly boardConfig = input.required<{ widthCm: number; heightCm: number }>();

  /** Bezárás event */
  readonly closeEvent = output<void>();

  /** Mentés event — módosított SnapshotLayer[] */
  readonly saveEvent = output<SnapshotLayer[]>();

  readonly overlayEl = viewChild.required<ElementRef<HTMLElement>>('overlayEl');
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly refreshing = signal(false);

  private resizeObserver: ResizeObserver | null = null;
  private originalOverflow = '';

  ngOnInit(): void {
    // Body scroll lock
    this.originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    this.loadSnapshotData();
    this.setupResize();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = this.originalOverflow;
    this.resizeObserver?.disconnect();
  }

  close(): void {
    this.closeEvent.emit();
  }

  save(): void {
    const layers = this.state.exportChanges();
    this.saveEvent.emit(layers);
  }

  /** Frissítés Photoshopból: JSX futtatás → friss snapshot mentés → újratöltés */
  async refresh(): Promise<void> {
    this.refreshing.set(true);
    this.loadError.set(null);

    try {
      // 1. Photoshopból kiolvasás + JSON mentés
      const readResult = await this.ps.readAndSaveLayout(
        this.boardConfig(),
        this.psdPath(),
      );

      if (!readResult.success) {
        this.loadError.set(readResult.error || 'Photoshop kiolvasás sikertelen.');
        this.refreshing.set(false);
        return;
      }

      // 2. Friss snapshot betöltése
      await this.loadSnapshotData();
    } catch {
      this.loadError.set('Váratlan hiba a frissítéskor.');
    }

    this.refreshing.set(false);
  }

  private async loadSnapshotData(): Promise<void> {
    try {
      const result = await this.ps.loadSnapshot(this.snapshotPath());
      if (!result.success || !result.data) {
        this.loadError.set(result.error || 'Nem sikerült betölteni a pillanatképet.');
        this.loading.set(false);
        return;
      }

      const data = result.data as Record<string, unknown>;
      const doc = data['document'] as DesignerDocument | undefined;
      const layers = (data['layers'] as SnapshotLayer[] | undefined) ?? [];

      if (!doc) {
        this.loadError.set('Érvénytelen pillanatkép formátum (hiányzó document mező).');
        this.loading.set(false);
        return;
      }

      this.state.loadSnapshot({ document: doc, layers }, this.persons());
      this.loading.set(false);

      // Fókusz az overlay-re (ESC billentyűzethez)
      requestAnimationFrame(() => {
        this.overlayEl().nativeElement.focus();
      });
    } catch {
      this.loadError.set('Váratlan hiba a pillanatkép betöltésekor.');
      this.loading.set(false);
    }
  }

  private setupResize(): void {
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        this.state.containerWidth.set(width);
        this.state.containerHeight.set(height);
      }
    });

    // Figyelni fogjuk az overlay elemet amint rendelkezésre áll
    requestAnimationFrame(() => {
      const el = this.overlayEl()?.nativeElement;
      if (el) {
        this.resizeObserver!.observe(el);
        // Kezdeti méret beállítása
        this.state.containerWidth.set(el.clientWidth);
        this.state.containerHeight.set(el.clientHeight);
      }
    });
  }
}
