import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { DesignerLayer } from './layout-designer.types';
import { PartnerService } from '../../../services/partner.service';
import { distributeAlternating, getPositionSlots, getRowSizes } from './layout-sort-algorithms';

/**
 * Layout Designer rendezesi logika.
 * Komponens-szintu injectable — a layout-designer.component.ts providers-be kerul.
 */
@Injectable()
export class LayoutDesignerSortService {
  private readonly state = inject(LayoutDesignerStateService);
  private readonly partnerService = inject(PartnerService);

  /** Loading state (AI hivas) */
  readonly sorting = signal(false);

  /** Utolso rendezes eredmenye (feedback) */
  readonly lastResult = signal<string | null>(null);

  // =============================================
  // Rendezesi modok
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

      // Soronkenti valtogatasos elosztas
      const rowSizes = getRowSizes(images);
      const orderedNames = distributeAlternating(boys, girls, rowSizes);
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
    // 1. Pozíció slot-ok kiolvasása: aktuális pozíciók Y->X sorrendben (LTR)
    const slots = getPositionSlots(images);

    // 2. Név -> layer map
    const nameToLayer = new Map<string, DesignerLayer>();
    for (const img of images) {
      const name = img.personMatch?.name ?? '';
      if (name && !nameToLayer.has(name)) {
        nameToLayer.set(name, img);
      }
    }

    // 3. orderedNames[i] -> slots[i] pozíció hozzárendelés (csak image layerek)
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
}
