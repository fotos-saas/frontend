import { Injectable, inject, NgZone, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { ActiveDocInfo } from '../../core/services/electron.types';

/**
 * Rendezési logika: ABC, fiú-lány, rácsba rendezés, egyedi sorrend.
 */
@Injectable()
export class OverlaySortService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly settings = inject(OverlaySettingsService);

  readonly sorting = signal(false);

  /** ABC rendezés — lokális magyar collator + JSX pozíció csere */
  async sortAbc(): Promise<void> {
    if (this.sorting()) return;
    const names = await this.ps.getSortableNames();
    if (names.length < 2) return;

    this.sorting.set(true);
    try {
      const collator = new Intl.Collator('hu', { sensitivity: 'base' });
      const prefixRe = /^(dr\.?\s*|ifj\.?\s*|id\.?\s*|prof\.?\s*|özv\.?\s*)/i;
      const sortKey = (n: string) => n.replace(prefixRe, '').trim();
      const sorted = [...names].sort((a, b) => collator.compare(sortKey(a), sortKey(b)));
      await this.reorderLayersByNames(sorted);
    } catch { /* ignore */ }
    this.ngZone.run(() => this.sorting.set(false));
  }

  /** Felváltva fiú-lány rendezés — API gender classification + JSX */
  async sortGender(): Promise<void> {
    if (this.sorting()) return;
    const slugNames = await this.ps.getSortableNames();
    if (slugNames.length < 2) return;

    const humanToSlug = new Map<string, string>();
    const humanNames = slugNames.map(slug => {
      const human = this.slugToHumanName(slug);
      humanToSlug.set(human, slug);
      return human;
    });

    this.sorting.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; classifications: Array<{ name: string; gender: 'boy' | 'girl' }> }>(
          `${environment.apiUrl}/partner/ai/classify-name-genders`,
          { names: humanNames },
        ),
      );
      if (res.success && res.classifications) {
        const collator = new Intl.Collator('hu', { sensitivity: 'base' });
        const genderMap = new Map(res.classifications.map(c => [c.name, c.gender]));
        const boys = humanNames.filter(n => genderMap.get(n) === 'boy').sort(collator.compare);
        const girls = humanNames.filter(n => genderMap.get(n) === 'girl').sort(collator.compare);
        const orderedHuman = this.interleave(boys, girls);
        const orderedSlugs = orderedHuman.map(h => humanToSlug.get(h) || h);
        await this.reorderLayersByNames(orderedSlugs);
      }
    } catch { /* ignore */ }
    this.ngZone.run(() => this.sorting.set(false));
  }

  /** Rácsba rendezés — arrange-grid JSX közvetlen futtatás */
  async sortGrid(activeDoc: ActiveDocInfo): Promise<void> {
    if (this.sorting()) return;
    this.sorting.set(true);
    if (window.electronAPI) {
      try {
        const [margin, gapH, gapV, studentSize, teacherSize, gridAlign] = await Promise.all([
          window.electronAPI.photoshop.getMargin(),
          window.electronAPI.photoshop.getGapH(),
          window.electronAPI.photoshop.getGapV(),
          window.electronAPI.photoshop.getStudentSize(),
          window.electronAPI.photoshop.getTeacherSize(),
          window.electronAPI.photoshop.getGridAlign(),
        ]);
        await this.ps.runJsx('arrange-grid', 'actions/arrange-grid.jsx', {
          boardWidthCm: 120,
          boardHeightCm: 80,
          marginCm: margin || 2,
          gapHCm: gapH || 2,
          gapVCm: gapV || 3,
          studentSizeCm: studentSize || 6,
          teacherSizeCm: teacherSize || 6,
          gridAlign: gridAlign || 'center',
        });
      } catch { /* ignore */ }
    }
    this.ngZone.run(() => this.sorting.set(false));
  }

  /** Egyedi sorrend — AI matching + reorder */
  async submitCustomOrder(
    text: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!text.trim() || this.sorting()) {
      return { success: false, message: '' };
    }

    const slugNames = await this.ps.getSortableNames();
    if (slugNames.length < 2) {
      return { success: false, message: 'Legalább 2 kijelölt kép layer kell a rendezéshez.' };
    }

    const slugToHuman = new Map<string, string>();
    const humanNames = slugNames.map(slug => {
      const human = this.slugToHumanName(slug);
      slugToHuman.set(human.toLowerCase(), slug);
      return human;
    });

    this.sorting.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; ordered_names: string[]; unmatched: string[] }>(
          `${environment.apiUrl}/partner/ai/match-custom-order`,
          { layer_names: humanNames, custom_order: text },
        ),
      );
      if (res.success && res.ordered_names) {
        const orderedSlugs = res.ordered_names.map(human => {
          return slugToHuman.get(human.toLowerCase()) || slugNames.find(s => this.slugToHumanName(s).toLowerCase() === human.toLowerCase()) || human;
        });
        await this.reorderLayersByNames(orderedSlugs);
        const orderList = res.ordered_names.map((n, i) => `${i + 1}. ${n}`).join(' → ');
        this.ngZone.run(() => this.sorting.set(false));
        return { success: true, message: `Rendezve: ${orderList}` };
      }
      this.ngZone.run(() => this.sorting.set(false));
      return { success: false, message: 'Hiba a nevek párosításakor.' };
    } catch {
      this.ngZone.run(() => this.sorting.set(false));
      return { success: false, message: 'Hiba a nevek párosításakor.' };
    }
  }

  /** Egyedi sorrend scope-olva — QA panelből, előre megkapja a slug neveket */
  async submitCustomOrderScoped(
    text: string,
    scopedSlugs: string[],
    group: string,
  ): Promise<{ success: boolean; message: string }> {
    if (!text.trim() || this.sorting()) {
      return { success: false, message: '' };
    }

    const slugToHuman = new Map<string, string>();
    const humanNames = scopedSlugs.map(slug => {
      const human = this.slugToHumanName(slug);
      slugToHuman.set(human.toLowerCase(), slug);
      return human;
    });

    this.sorting.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; ordered_names: string[]; unmatched: string[] }>(
          `${environment.apiUrl}/partner/ai/match-custom-order`,
          { layer_names: humanNames, custom_order: text },
        ),
      );
      if (res.success && res.ordered_names) {
        const orderedSlugs = res.ordered_names.map(human => {
          return slugToHuman.get(human.toLowerCase()) || scopedSlugs.find(s => this.slugToHumanName(s).toLowerCase() === human.toLowerCase()) || human;
        });
        const groupLabel = group === 'teachers' ? 'Teachers' : group === 'students' ? 'Students' : 'All';
        await this.reorderLayersByNamesScoped(orderedSlugs, groupLabel);
        const orderList = res.ordered_names.map((n, i) => `${i + 1}. ${n}`).join(' → ');
        this.ngZone.run(() => this.sorting.set(false));
        return { success: true, message: `Rendezve: ${orderList}` };
      }
      this.ngZone.run(() => this.sorting.set(false));
      return { success: false, message: 'Hiba a nevek párosításakor.' };
    } catch {
      this.ngZone.run(() => this.sorting.set(false));
      return { success: false, message: 'Hiba a nevek párosításakor.' };
    }
  }

  /** Nevek igazítása — delegálás a PS service-nek */
  arrangeNames(textAlign: string): void {
    this.ps.runJsx('arrange-names', 'actions/arrange-names-selected.jsx', {
      TEXT_ALIGN: textAlign,
      BREAK_AFTER: String(this.settings.nameBreakAfter()),
      NAME_GAP_CM: String(this.settings.nameGapCm()),
    });
  }

  // ============ Helpers ============

  /** Slug layer névből human-readable nevet csinál */
  slugToHumanName(slug: string): string {
    const withoutId = slug.replace(/---\d+$/, '');
    return withoutId
      .split('-')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /** JSX-et futtat ami a megadott névsorrendbe rendezi a layereket */
  private async reorderLayersByNames(orderedNames: string[]): Promise<any> {
    return this.ps.runJsx('reorder-layers', 'actions/reorder-layers.jsx', {
      ORDERED_NAMES: JSON.stringify(orderedNames),
      GROUP: 'All',
    });
  }

  /** JSX-et futtat ami a megadott névsorrendbe rendezi a layereket (scope-olt GROUP-pal) */
  async reorderLayersByNamesScoped(orderedNames: string[], group: string): Promise<any> {
    return this.ps.runJsx('reorder-layers', 'actions/reorder-layers.jsx', {
      ORDERED_NAMES: JSON.stringify(orderedNames),
      GROUP: group,
    });
  }

  /** Két tömb váltogatásos összefűzése */
  private interleave(a: string[], b: string[]): string[] {
    const first = a.length >= b.length ? a : b;
    const second = a.length >= b.length ? b : a;
    const result: string[] = [];
    let fi = 0;
    let si = 0;
    for (let i = 0; i < first.length + second.length; i++) {
      if (i % 2 === 0 && fi < first.length) {
        result.push(first[fi++]);
      } else if (si < second.length) {
        result.push(second[si++]);
      } else if (fi < first.length) {
        result.push(first[fi++]);
      }
    }
    return result;
  }
}
