import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer } from './layout-designer.types';
import { PartnerService } from '../../../services/partner.service';

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

  /** Loading state (AI hívás) */
  readonly sorting = signal(false);

  /** Utolsó rendezés eredménye (feedback) */
  readonly lastResult = signal<string | null>(null);

  // =============================================
  // Rendezési módok
  // =============================================

  /** Magyar ABC sorrend — AI rendezéssel (Dr. figyelembevétel, magyar ábécé) */
  async sortByAbc(): Promise<void> {
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
        this.partnerService.sortNamesAbc(names),
      );

      if (!response.success || !response.sorted_names) {
        this.lastResult.set('Hiba történt az ABC rendezésnél.');
        return;
      }

      this.applySort(images, response.sorted_names);
      this.lastResult.set(`ABC sorrendbe rendezve (${images.length} elem)`);
    } catch {
      this.lastResult.set('Hiba történt az ABC rendezésnél.');
    } finally {
      this.sorting.set(false);
    }
  }

  /** Felváltva fiú-lány rendezés — AI gender classification */
  async sortByGender(): Promise<void> {
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

      // Soronkénti váltogatásos elosztás
      const rowSizes = this.getRowSizes(images);
      const orderedNames = this.distributeAlternating(boys, girls, rowSizes);
      this.applySort(images, orderedNames);

      this.lastResult.set(`Felváltva rendezve: ${boys.length} fiú, ${girls.length} lány`);
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
   * A coupled név layerek automatikusan követik a képüket.
   */
  private applySort(images: DesignerLayer[], orderedNames: string[]): void {
    // 1. Pozíció slot-ok kiolvasása: aktuális pozíciók Y→X sorrendben (LTR)
    const slots = this.getPositionSlots(images);

    // 2. Név → layer map
    const nameToLayer = new Map<string, DesignerLayer>();
    for (const img of images) {
      const name = img.personMatch?.name ?? '';
      if (name && !nameToLayer.has(name)) {
        nameToLayer.set(name, img);
      }
    }

    // 3. orderedNames[i] → slots[i] pozíció hozzárendelés (csak image layerek)
    const allLayers = this.state.layers();
    const updates = new Map<number, { x: number; y: number }>();

    for (let i = 0; i < Math.min(orderedNames.length, slots.length); i++) {
      const layer = nameToLayer.get(orderedNames[i]);
      if (!layer) continue;
      updates.set(layer.layerId, { x: slots[i].x, y: slots[i].y });
    }

    // 4. State frissítés (updateLayers automatikusan realign-olja a neveket)
    this.state.updateLayers(
      allLayers.map(l => {
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

  /** Pozíció slot-ok kiolvasása: Y→X sor-csoportosítással rendezve (LTR) */
  private getPositionSlots(images: DesignerLayer[]): Array<{ x: number; y: number }> {
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

  /** Soronkénti elemszámok kiolvasása (sor-csoportosítás Y alapján) */
  private getRowSizes(images: DesignerLayer[]): number[] {
    const sorted = [...images].sort((a, b) =>
      (a.editedY ?? a.y) - (b.editedY ?? b.y),
    );

    const rowSizes: number[] = [];
    let currentCount = 0;
    let currentRowY = -Infinity;

    for (const layer of sorted) {
      const y = layer.editedY ?? layer.y;
      if (currentCount === 0 || Math.abs(y - currentRowY) <= ROW_THRESHOLD_PX) {
        currentCount++;
        if (currentCount === 1) currentRowY = y;
      } else {
        rowSizes.push(currentCount);
        currentCount = 1;
        currentRowY = y;
      }
    }
    if (currentCount > 0) rowSizes.push(currentCount);

    return rowSizes;
  }

  /**
   * Váltogatásos nemek szerinti elosztás soronként.
   * Elsődleges cél: fiú-lány-fiú-lány váltogatás.
   * Ha az egyik nemből elfogy, a maradékot egyenletesen szétszórja
   * a soron belül (ne csomóban legyen a sor végén).
   */
  private distributeAlternating(
    boys: DesignerLayer[],
    girls: DesignerLayer[],
    rowSizes: number[],
  ): string[] {
    const totalSlots = rowSizes.reduce((a, b) => a + b, 0);
    let bIdx = 0;
    let gIdx = 0;
    const result: string[] = [];

    for (const rowSize of rowSizes) {
      const remainingSlots = totalSlots - result.length;
      const remainingBoys = boys.length - bIdx;
      const remainingGirls = girls.length - gIdx;

      let boysInRow = Math.round((remainingBoys / Math.max(remainingSlots, 1)) * rowSize);
      boysInRow = Math.min(boysInRow, rowSize, remainingBoys);
      let girlsInRow = Math.min(rowSize - boysInRow, remainingGirls);
      if (boysInRow + girlsInRow < rowSize) {
        boysInRow = Math.min(rowSize - girlsInRow, remainingBoys);
      }

      const rowBoys: string[] = [];
      const rowGirls: string[] = [];
      for (let i = 0; i < boysInRow && bIdx < boys.length; i++) {
        rowBoys.push(boys[bIdx++].personMatch?.name ?? '');
      }
      for (let i = 0; i < girlsInRow && gIdx < girls.length; i++) {
        rowGirls.push(girls[gIdx++].personMatch?.name ?? '');
      }

      const rowResult = this.interleaveWithSpread(rowBoys, rowGirls, rowSize);
      result.push(...rowResult);
    }

    return result;
  }

  /**
   * Két csoportot váltogatva fűz össze.
   * Ha az egyik csoport kifogy, a maradékot egyenletesen szétszórja.
   */
  private interleaveWithSpread(groupA: string[], groupB: string[], slotCount: number): string[] {
    const first = groupA.length >= groupB.length ? groupA : groupB;
    const second = groupA.length >= groupB.length ? groupB : groupA;

    if (second.length === 0) {
      return [...first];
    }

    if (first.length <= second.length + 1) {
      const row: string[] = [];
      let fIdx = 0;
      let sIdx = 0;
      for (let i = 0; i < slotCount; i++) {
        if (i % 2 === 0 && fIdx < first.length) {
          row.push(first[fIdx++]);
        } else if (sIdx < second.length) {
          row.push(second[sIdx++]);
        } else if (fIdx < first.length) {
          row.push(first[fIdx++]);
        }
      }
      return row;
    }

    const row: (string | null)[] = new Array(slotCount).fill(null);
    const spacing = slotCount / (second.length + 1);

    const secondPositions: number[] = [];
    for (let i = 0; i < second.length; i++) {
      const pos = Math.round(spacing * (i + 1)) - 1;
      const finalPos = Math.min(Math.max(pos, 0), slotCount - 1);
      secondPositions.push(finalPos);
    }

    const usedPositions = new Set<number>();
    for (let i = 0; i < secondPositions.length; i++) {
      let pos = secondPositions[i];
      while (usedPositions.has(pos) && pos < slotCount - 1) pos++;
      while (usedPositions.has(pos) && pos > 0) pos--;
      usedPositions.add(pos);
      row[pos] = second[i];
    }

    let fIdx = 0;
    for (let k = 0; k < slotCount; k++) {
      if (row[k] === null && fIdx < first.length) {
        row[k] = first[fIdx++];
      }
    }

    return row as string[];
  }
}
