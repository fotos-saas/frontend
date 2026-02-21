import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer } from './layout-designer.types';
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

      // Soronkénti szimmetrikus elosztás
      const rowSizes = this.getRowSizes(images);
      const orderedNames = this.distributeSymmetric(boys, girls, rowSizes);
      this.applySort(images, orderedNames);

      this.lastResult.set(`Szimmetrikusan rendezve: ${boys.length} fiú, ${girls.length} lány`);
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

    // 4. Person ID → coupled név layer map (kép melletti név keresése)
    const allLayers = this.state.layers();
    const personIdToNameLayer = new Map<number, DesignerLayer>();
    for (const l of allLayers) {
      if ((l.category === 'student-name' || l.category === 'teacher-name') && l.personMatch) {
        personIdToNameLayer.set(l.personMatch.id, l);
      }
    }

    // 5. orderedNames[i] → slots[i] pozíció hozzárendelés
    const updates = new Map<number, { x: number; y: number }>();

    for (let i = 0; i < Math.min(orderedNames.length, slots.length); i++) {
      const layer = nameToLayer.get(orderedNames[i]);
      if (!layer) continue;

      const slot = slots[i];
      const deltaX = slot.x - (layer.editedX ?? layer.x);
      const deltaY = slot.y - (layer.editedY ?? layer.y);

      // Kép pozíció frissítése
      updates.set(layer.layerId, { x: slot.x, y: slot.y });

      // Coupled név layer: ugyanazzal a delta-val követi
      if (layer.personMatch) {
        const nameLayer = personIdToNameLayer.get(layer.personMatch.id);
        if (nameLayer) {
          updates.set(nameLayer.layerId, {
            x: (nameLayer.editedX ?? nameLayer.x) + deltaX,
            y: (nameLayer.editedY ?? nameLayer.y) + deltaY,
          });
        }
      }
    }

    // 6. State frissítés
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
   * Szimmetrikus nemek szerinti elosztás soronként.
   * A kisebbségi nemet (kevesebb darab) a sorok szélein helyezi el szimmetrikusan,
   * a többségi nem pedig a belső helyekre kerül. Mindkét nem ABC sorrendben.
   *
   * Pl. 14 hely = [14], 5 lány, 9 fiú → L F F L F F F F L F F L F L
   * (széleken + egyenletesen elosztva a belső tükörpontokon)
   */
  private distributeSymmetric(
    boys: DesignerLayer[],
    girls: DesignerLayer[],
    rowSizes: number[],
  ): string[] {
    // Kisebbségi nem = amit szimmetrikusan szórunk, többségi = aki a maradék helyre kerül
    const minority = boys.length <= girls.length ? boys : girls;
    const majority = boys.length <= girls.length ? girls : boys;

    let mIdx = 0; // minority index
    let jIdx = 0; // majority index
    const result: string[] = [];

    for (let ri = 0; ri < rowSizes.length; ri++) {
      const rowSize = rowSizes[ri];
      // Mennyi minority jut erre a sorra arányosan
      let remainingSlots = 0;
      for (let rj = ri; rj < rowSizes.length; rj++) remainingSlots += rowSizes[rj];
      const remainingMinority = minority.length - mIdx;

      // Arányos elosztás: erre a sorra jutó minority szám
      let minInRow = Math.round((remainingMinority / remainingSlots) * rowSize);
      minInRow = Math.min(minInRow, rowSize, minority.length - mIdx);
      const majInRow = Math.min(rowSize - minInRow, majority.length - jIdx);

      // Ha nem elég majority, töltsük minority-vel
      const actualMin = Math.min(minInRow + Math.max(0, rowSize - minInRow - (majority.length - jIdx)), minority.length - mIdx);
      const actualMaj = rowSize - actualMin;

      // Szimmetrikus pozíciók: minority a szélekről befelé
      const rowSlots: (string | null)[] = new Array(rowSize).fill(null);
      const minPositions = this.getSymmetricPositions(rowSize, actualMin);

      // Minority a szimmetrikus pozíciókra
      for (const pos of minPositions) {
        if (mIdx < minority.length) {
          rowSlots[pos] = minority[mIdx].personMatch?.name ?? '';
          mIdx++;
        }
      }

      // Majority a maradék (null) helyekre
      for (let k = 0; k < rowSize; k++) {
        if (rowSlots[k] === null && jIdx < majority.length) {
          rowSlots[k] = majority[jIdx].personMatch?.name ?? '';
          jIdx++;
        }
      }

      // Null maradékok feltöltése (ha van még minority/majority)
      for (let k = 0; k < rowSize; k++) {
        if (rowSlots[k] === null) {
          if (mIdx < minority.length) {
            rowSlots[k] = minority[mIdx++].personMatch?.name ?? '';
          } else if (jIdx < majority.length) {
            rowSlots[k] = majority[jIdx++].personMatch?.name ?? '';
          }
        }
      }

      result.push(...(rowSlots as string[]));
    }

    return result;
  }

  /**
   * Szimmetrikus pozíciók generálása egy soron belül.
   * N slot-ból count darab helyet ad vissza, a szélekről befelé haladva tükrözve.
   * Pl. N=8, count=3 → [0, 7, 4] (bal szél, jobb szél, közép)
   * Pl. N=8, count=4 → [0, 7, 1, 6]
   */
  private getSymmetricPositions(slotCount: number, count: number): number[] {
    if (count === 0) return [];
    if (count >= slotCount) return Array.from({ length: slotCount }, (_, i) => i);

    const positions: number[] = [];
    let left = 0;
    let right = slotCount - 1;

    while (positions.length < count) {
      if (positions.length < count) positions.push(left++);
      if (positions.length < count) positions.push(right--);
    }

    return positions;
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
