import { Injectable, inject, NgZone, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySortService } from './overlay-sort.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

type DragOrderScope = 'all' | 'teachers' | 'students';

/**
 * Drag & Drop sorrend panel üzleti logikája.
 * Kiemelve az overlay.component.ts-ből a redundancia csökkentése érdekében.
 */
@Injectable()
export class OverlayDragOrderService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly projectService = inject(OverlayProjectService);
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly sortService = inject(OverlaySortService);

  // === Signals ===
  readonly panelOpen = signal(false);
  readonly saving = signal(false);
  readonly refreshing = signal(false);
  readonly scope = signal<DragOrderScope>('students');
  readonly list = signal<PersonItem[]>([]);
  readonly searchQuery = signal('');
  readonly selected = signal<Set<number>>(new Set());
  readonly genderLoading = signal(false);

  /** Person ID → PS slug mapping, save() használja a PS reorderhez */
  private personSlugMap = new Map<number, string>();

  /** Szűrt lista — keresés alapján (drag & drop a teljes listán működik, a keresés csak vizuálisan szűr) */
  readonly filteredList = computed(() => {
    const items = this.list();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return items;
    return items.filter(p => p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)));
  });

  // Projekt ID resolver — komponens állítja be init-kor
  private projectIdResolver: () => number | null = () => null;

  setProjectIdResolver(fn: () => number | null): void {
    this.projectIdResolver = fn;
  }

  // === Panel kezelés ===

  async openPanel(): Promise<void> {
    this.panelOpen.set(true);
    const pid = this.projectIdResolver();
    if (pid && this.projectService.persons().length === 0) {
      await this.projectService.fetchPersons(pid);
    }
    await this.refreshListFromPS();
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.searchQuery.set('');
    this.clearSelection();
  }

  clearSelection(): void { this.selected.set(new Set()); }

  setScope(scope: DragOrderScope): void {
    this.scope.set(scope);
    this.selected.set(new Set());
    this.refreshListFromPS();
  }

  /** DB-ből újratölti a személyeket, frissíti a listát PS-ből */
  async refreshFromDb(): Promise<void> {
    const pid = this.projectIdResolver();
    if (!pid) return;
    this.refreshing.set(true);
    try {
      await this.projectService.fetchPersons(pid);
      await this.refreshListFromPS();
    } finally {
      this.ngZone.run(() => this.refreshing.set(false));
    }
  }

  /**
   * PS image layerekből építi a listát. A slug tartalmazza a person ID-t (pl. kiss-janos---42).
   * Ha van DB match → enricheli a PersonItem-et. Ha nincs → placeholder negatív ID-vel.
   * Ha nincs PS (nem Electron) → DB fallback.
   */
  private async refreshListFromPS(): Promise<void> {
    const data = await this.ps.getImageLayerData();
    const s = this.scope();
    const slugList = s === 'teachers' ? data.teachers
      : s === 'students' ? data.students : data.names;

    // Ha nincs PS (üres lista) → DB fallback
    if (slugList.length === 0) {
      this.refreshListFromDb();
      await this.enrichTitlesFromPS();
      return;
    }

    // DB persons map ID alapján
    const dbPersonsById = new Map<number, PersonItem>();
    for (const p of this.projectService.persons()) {
      dbPersonsById.set(p.id, p);
    }

    // PS slug-okból PersonItem lista + slug map építése
    this.personSlugMap.clear();
    let placeholderId = -1;
    const items: PersonItem[] = [];

    for (const slug of slugList) {
      const idMatch = slug.match(/---(\d+)$/);
      const personId = idMatch ? parseInt(idMatch[1], 10) : null;
      const humanName = this.sortService.slugToHumanName(slug);

      if (personId && dbPersonsById.has(personId)) {
        // DB-ből enrichelt PersonItem
        const dbPerson = dbPersonsById.get(personId)!;
        items.push({ ...dbPerson });
        this.personSlugMap.set(dbPerson.id, slug);
      } else {
        // Nincs DB match → placeholder
        const id = placeholderId--;
        items.push({
          id,
          name: humanName,
          title: null,
          type: s === 'teachers' ? 'teacher' : 'student',
          hasPhoto: false,
          photoThumbUrl: null,
          photoUrl: null,
          archiveId: null,
          linkedGroup: null,
        });
        this.personSlugMap.set(id, slug);
      }
    }

    this.ngZone.run(() => this.list.set(items));
    await this.enrichTitlesFromPS();
  }

  /** DB-ből építi a listát — fallback ha nincs PS */
  private refreshListFromDb(): void {
    const all = this.projectService.persons();
    const s = this.scope();
    const filtered = s === 'teachers' ? all.filter(p => p.type === 'teacher')
      : s === 'students' ? all.filter(p => p.type === 'student') : all;
    this.list.set([...filtered]);
  }

  /** PS Positions layerekből kiszedi a title-ket és felülírja a lista értékeit */
  private async enrichTitlesFromPS(): Promise<void> {
    const posMap = await this.ps.getPositionsTextContent();
    if (posMap.size === 0) return;
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    // slug → title mapping
    const slugToTitle = new Map<string, string>();
    for (const [slug, title] of posMap) {
      slugToTitle.set(normalize(this.sortService.slugToHumanName(slug)), title);
    }
    const items = this.list();
    let changed = false;
    const updated = items.map(p => {
      const psTitle = slugToTitle.get(normalize(p.name));
      if (psTitle !== undefined && psTitle !== p.title) {
        changed = true;
        return { ...p, title: psTitle };
      }
      return p;
    });
    if (changed) {
      this.ngZone.run(() => this.list.set(updated));
    }
  }

  // === Kijelölés ===

  toggleSelect(personId: number, event: MouseEvent): void {
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    const sel = new Set(this.selected());
    if (sel.has(personId)) { sel.delete(personId); } else { sel.add(personId); }
    this.selected.set(sel);
  }

  isSelected(personId: number): boolean {
    return this.selected().has(personId);
  }

  // === Rendezés ===

  sortAbc(): void {
    const items = [...this.list()];
    const collator = new Intl.Collator('hu', { sensitivity: 'base' });
    const prefixRe = /^(dr\.?\s*|ifj\.?\s*|id\.?\s*|prof\.?\s*|özv\.?\s*)/i;
    const sortKey = (n: string) => n.replace(prefixRe, '').trim();
    items.sort((a, b) => collator.compare(sortKey(a.name), sortKey(b.name)));
    this.list.set(items);
  }

  async sortGender(): Promise<void> {
    const items = this.list();
    if (items.length < 2 || this.genderLoading()) return;
    this.genderLoading.set(true);
    try {
      const names = items.map(p => p.name);
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; classifications: Array<{ name: string; gender: 'boy' | 'girl' }> }>(
          `${environment.apiUrl}/partner/ai/classify-name-genders`,
          { names },
        ),
      );
      if (!res.success || !res.classifications) return;
      const genderMap = new Map(res.classifications.map(c => [c.name, c.gender]));
      const collator = new Intl.Collator('hu', { sensitivity: 'base' });
      const boys = [...items].filter(p => genderMap.get(p.name) === 'boy').sort((a, b) => collator.compare(a.name, b.name));
      const girls = [...items].filter(p => genderMap.get(p.name) === 'girl').sort((a, b) => collator.compare(a.name, b.name));
      // Felváltva
      const result: PersonItem[] = [];
      const first = boys.length >= girls.length ? boys : girls;
      const second = boys.length >= girls.length ? girls : boys;
      let fi = 0, si = 0;
      for (let i = 0; i < first.length + second.length; i++) {
        if (i % 2 === 0 && fi < first.length) result.push(first[fi++]);
        else if (si < second.length) result.push(second[si++]);
        else if (fi < first.length) result.push(first[fi++]);
      }
      this.ngZone.run(() => this.list.set(result));
    } catch { /* ignore */ } finally {
      this.ngZone.run(() => this.genderLoading.set(false));
    }
  }

  sortLeadership(): void {
    const items = [...this.list()];
    const leadershipOrder = ['igazgató', 'intézményvezető', 'iskola igazgató', 'iskolaigazgató', 'igazgatóhelyettes', 'helyettes', 'aligazgató', 'tagozatvezető', 'munkaközösség-vezető', 'osztályfőnök'];
    const getPriority = (title: string | null): number => {
      if (!title) return 999;
      const t = title.toLowerCase().trim();
      for (let i = 0; i < leadershipOrder.length; i++) {
        if (t.includes(leadershipOrder[i])) return i;
      }
      return 999;
    };
    const collator = new Intl.Collator('hu', { sensitivity: 'base' });
    items.sort((a, b) => {
      const pa = getPriority(a.title);
      const pb = getPriority(b.title);
      if (pa !== pb) return pa - pb;
      return collator.compare(a.name, b.name);
    });
    this.list.set(items);
  }

  // === Drag & Drop ===

  onDrop(event: CdkDragDrop<PersonItem[]>): void {
    const items = [...this.list()];
    const sel = this.selected();
    const draggedIndex = event.previousIndex;
    const targetIndex = event.currentIndex;

    if (sel.size > 1 && sel.has(items[draggedIndex].id)) {
      // Csoportos mozgatás
      const selectedItems = items.filter(p => sel.has(p.id));
      const remaining = items.filter(p => !sel.has(p.id));
      let insertAt: number;
      if (targetIndex >= items.length) {
        insertAt = remaining.length;
      } else {
        const targetItem = items[targetIndex];
        if (sel.has(targetItem.id)) {
          insertAt = remaining.length;
        } else {
          insertAt = remaining.indexOf(targetItem);
          if (targetIndex > draggedIndex) insertAt++;
        }
      }
      remaining.splice(insertAt, 0, ...selectedItems);
      this.list.set(remaining);
    } else {
      moveItemInArray(items, draggedIndex, targetIndex);
      this.list.set(items);
    }
  }

  // === Mentés ===

  async save(): Promise<void> {
    const pid = this.projectIdResolver();
    const items = this.list();
    if (!pid || items.length === 0) return;

    this.saving.set(true);
    try {
      const currentScope = this.scope();

      // 1. Backend position mentés — csak valódi DB személyek (pozitív ID)
      const dbItems = items.filter(p => p.id > 0);
      if (dbItems.length > 0) {
        const positions = dbItems.map((p, i) => ({ id: p.id, position: i + 1 }));
        await firstValueFrom(
          this.http.patch<any>(
            `${environment.apiUrl}/partner/projects/${pid}/persons/reorder`,
            { positions },
          ),
        );
      }

      // 2. PS layer átrendezés — personSlugMap-ből veszi a slugokat
      const orderedSlugs: string[] = [];
      for (const p of items) {
        const slug = this.personSlugMap.get(p.id);
        if (slug) orderedSlugs.push(slug);
      }
      if (orderedSlugs.length >= 2) {
        const groupLabel = currentScope === 'teachers' ? 'Teachers' : currentScope === 'students' ? 'Students' : 'All';
        await this.sortService.reorderLayersByNamesScoped(orderedSlugs, groupLabel);
      }

      // 3. Személylista újratöltés
      await this.projectService.fetchPersons(pid);

      // 4. Panel bezárás
      this.ngZone.run(() => {
        this.saving.set(false);
        this.closePanel();
      });
    } catch (err) {
      console.error('[DRAG-ORDER] save error:', err);
      this.ngZone.run(() => this.saving.set(false));
    }
  }
}
