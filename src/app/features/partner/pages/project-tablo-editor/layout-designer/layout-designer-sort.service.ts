import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer } from './layout-designer.types';
import { expandWithCoupledLayers } from './layout-designer.utils';
import { PartnerService } from '../../../services/partner.service';

/** Olvasási irány minta */
export type GridPattern = 'ltr' | 'u-shape';

/** Rendezési módok */
export type SortMode = 'abc' | 'boys-first' | 'girls-first' | 'custom';

/** Sorok Y-threshold: ezen belüli Y-ú elemek egy sorba tartoznak */
const ROW_THRESHOLD_PX = 20;

/**
 * Layout Designer rendezési logika.
 * Komponens-szintű injectable — a layout-designer.component.ts providers-be kerül.
 */
@Injectable()
export class LayoutDesignerSortService {
  private readonly state = inject(LayoutDesignerStateService);
  private readonly partnerService = inject(PartnerService);

  /** Panel láthatóság */
  readonly panelOpen = signal(false);

  /** Loading state (AI hívás) */
  readonly sorting = signal(false);

  /** Olvasási irány */
  readonly gridPattern = signal<GridPattern>('ltr');

  /** Utolsó rendezés eredménye (feedback) */
  readonly lastResult = signal<string | null>(null);

  // =============================================
  // Rendezési módok
  // =============================================

  /** Magyar ABC sorrend — client-side, nincs AI */
  sortByAbc(): void {
    const images = this.getSelectedImages();
    if (images.length < 2) return;

    const collator = new Intl.Collator('hu', { sensitivity: 'base' });
    const sorted = [...images].sort((a, b) =>
      collator.compare(a.personMatch?.name ?? '', b.personMatch?.name ?? ''),
    );

    const names = sorted.map(l => l.personMatch?.name ?? '');
    this.applySort(images, names);
    this.lastResult.set(`ABC sorrendbe rendezve (${images.length} elem)`);
  }

  /** Fiúk elore — AI gender classification */
  async sortByGender(boysFirst: boolean): Promise<void> {
    const images = this.getSelectedImages();
    if (images.length < 2) return;

    const names = images
      .map(l => l.personMatch?.name ?? '')
      .filter(n => n.length > 0);
    if (names.length === 0) return;

    this.sorting.set(true);
    this.lastResult.set(null);

    try {
      const response = await firstValueFrom(
        this.partnerService.classifyNameGenders(names),
      );

      if (!response.success || !response.classifications) {
        this.lastResult.set('Hiba történt a nevek besorolásakor.');
        return;
      }

      const collator = new Intl.Collator('hu', { sensitivity: 'base' });
      const genderMap = new Map<string, 'boy' | 'girl'>();
      for (const c of response.classifications) {
        genderMap.set(c.name, c.gender);
      }

      const boys = images
        .filter(l => genderMap.get(l.personMatch?.name ?? '') === 'boy')
        .sort((a, b) => collator.compare(a.personMatch?.name ?? '', b.personMatch?.name ?? ''));
      const girls = images
        .filter(l => genderMap.get(l.personMatch?.name ?? '') === 'girl')
        .sort((a, b) => collator.compare(a.personMatch?.name ?? '', b.personMatch?.name ?? ''));

      const ordered = boysFirst ? [...boys, ...girls] : [...girls, ...boys];
      const orderedNames = ordered.map(l => l.personMatch?.name ?? '');
      this.applySort(images, orderedNames);

      const label = boysFirst ? 'Fiúk elöl' : 'Lányok elöl';
      this.lastResult.set(`${label}: ${boys.length} fiú, ${girls.length} lány`);
    } catch {
      this.lastResult.set('Hiba történt a nevek besorolásakor.');
    } finally {
      this.sorting.set(false);
    }
  }

  /** Egyedi sorrend — AI name matching */
  async sortByCustomOrder(customText: string): Promise<void> {
    const images = this.getSelectedImages();
    if (images.length < 2) return;

    const layerNames = images
      .map(l => l.personMatch?.name ?? '')
      .filter(n => n.length > 0);
    if (layerNames.length === 0) return;

    this.sorting.set(true);
    this.lastResult.set(null);

    try {
      const response = await firstValueFrom(
        this.partnerService.matchCustomNameOrder(layerNames, customText),
      );

      if (!response.success || !response.ordered_names) {
        this.lastResult.set('Hiba történt a nevek párosításakor.');
        return;
      }

      this.applySort(images, response.ordered_names);

      const unmatchedCount = response.unmatched?.length ?? 0;
      const msg = unmatchedCount > 0
        ? `Egyedi sorrendbe rendezve (${unmatchedCount} nem párosított)`
        : `Egyedi sorrendbe rendezve (${images.length} elem)`;
      this.lastResult.set(msg);
    } catch {
      this.lastResult.set('Hiba történt a nevek párosításakor.');
    } finally {
      this.sorting.set(false);
    }
  }

  // =============================================
  // Core algoritmus: "Position Slot Reorder"
  // =============================================

  /**
   * Rendezés végrehajtása: az images layerek pozícióit
   * a kívánt névsorrendnek megfelelően cseréli meg.
   */
  private applySort(images: DesignerLayer[], orderedNames: string[]): void {
    // 1. Pozíció slot-ok kiolvasása: aktuális pozíciók Y→X sorrendben
    const slots = this.getPositionSlots(images);

    // 2. U-shape: utolsó sor slot-jainak megfordítása
    if (this.gridPattern() === 'u-shape' && slots.length > 0) {
      this.reverseLastRow(slots);
    }

    // 3. Név → layer map
    const nameToLayer = new Map<string, DesignerLayer>();
    for (const img of images) {
      const name = img.personMatch?.name ?? '';
      if (name && !nameToLayer.has(name)) {
        nameToLayer.set(name, img);
      }
    }

    // 4. orderedNames[i] → slots[i] pozíció hozzárendelés
    const updates = new Map<number, { x: number; y: number }>();
    const expandedIds = expandWithCoupledLayers(
      this.state.selectedLayerIds(), this.state.layers(),
    );

    for (let i = 0; i < Math.min(orderedNames.length, slots.length); i++) {
      const layer = nameToLayer.get(orderedNames[i]);
      if (!layer) continue;

      const slot = slots[i];
      const deltaX = slot.x - (layer.editedX ?? layer.x);
      const deltaY = slot.y - (layer.editedY ?? layer.y);

      updates.set(layer.layerId, { x: slot.x, y: slot.y });

      // Coupled réteg (név) delta-val követi
      for (const id of expandedIds) {
        if (updates.has(id)) continue;
        const coupled = this.state.layers().find(l => l.layerId === id);
        if (coupled && coupled.personMatch?.id === layer.personMatch?.id
            && !this.state.selectedLayerIds().has(id)) {
          updates.set(id, {
            x: (coupled.editedX ?? coupled.x) + deltaX,
            y: (coupled.editedY ?? coupled.y) + deltaY,
          });
        }
      }
    }

    // 5. State frissítés
    this.state.updateLayers(
      this.state.layers().map(l => {
        const u = updates.get(l.layerId);
        if (!u) return l;
        return { ...l, editedX: u.x, editedY: u.y };
      }),
    );
  }

  /** Kijelölt image layerek kiszűrése */
  private getSelectedImages(): DesignerLayer[] {
    return this.state.selectedLayers().filter(l =>
      (l.category === 'student-image' || l.category === 'teacher-image')
      && l.personMatch,
    );
  }

  /** Pozíció slot-ok kiolvasása: Y→X sor-csoportosítással rendezve */
  private getPositionSlots(images: DesignerLayer[]): Array<{ x: number; y: number }> {
    // Sorokba csoportosítás
    const sorted = [...images].sort((a, b) =>
      (a.editedY ?? a.y) - (b.editedY ?? b.y),
    );

    const rows: DesignerLayer[][] = [];
    let currentRow: DesignerLayer[] = [];
    let currentRowY = -Infinity;

    for (const layer of sorted) {
      const y = layer.editedY ?? layer.y;
      if (currentRow.length === 0 || Math.abs(y - currentRowY) <= ROW_THRESHOLD_PX) {
        currentRow.push(layer);
        if (currentRow.length === 1) currentRowY = y;
      } else {
        rows.push(currentRow);
        currentRow = [layer];
        currentRowY = y;
      }
    }
    if (currentRow.length > 0) rows.push(currentRow);

    // Sorokon belül X szerinti rendezés
    const slots: Array<{ x: number; y: number }> = [];
    for (const row of rows) {
      row.sort((a, b) => (a.editedX ?? a.x) - (b.editedX ?? b.x));
      for (const l of row) {
        slots.push({ x: l.editedX ?? l.x, y: l.editedY ?? l.y });
      }
    }

    return slots;
  }

  /** U-shape: utolsó sor slot-jainak megfordítása */
  private reverseLastRow(slots: Array<{ x: number; y: number }>): void {
    if (slots.length < 2) return;

    // Utolsó sor megtalálása: a slot-ok végéről visszafelé amíg hasonló Y
    const lastY = slots[slots.length - 1].y;
    let lastRowStart = slots.length - 1;
    while (lastRowStart > 0 && Math.abs(slots[lastRowStart - 1].y - lastY) <= ROW_THRESHOLD_PX) {
      lastRowStart--;
    }

    // X koordináták megfordítása az utolsó sorban
    const lastRowSlots = slots.slice(lastRowStart);
    const reversedXValues = lastRowSlots.map(s => s.x).reverse();
    for (let i = 0; i < lastRowSlots.length; i++) {
      slots[lastRowStart + i] = { x: reversedXValues[i], y: lastRowSlots[i].y };
    }
  }
}
