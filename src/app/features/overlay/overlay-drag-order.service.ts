import { Injectable, inject, NgZone, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayPollingService } from './overlay-polling.service';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { LoggerService } from '../../core/services/logger.service';

type DragOrderScope = 'all' | 'teachers' | 'students';

export const GROUP_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export interface DragOrderGroup {
  id: string;
  name: string;
  colorIndex: number;
  collapsed: boolean;
  items: PersonItem[];
}

interface DragOrderJson {
  version: number;
  scope: string;
  groups: Array<{ id: string; name: string; colorIndex: number; items: string[] }>;
  ungrouped: string[];
}

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
  private readonly polling = inject(OverlayPollingService);
  private readonly logger = inject(LoggerService);

  // === Signals ===
  readonly panelOpen = signal(false);
  readonly saving = signal(false);
  readonly refreshing = signal(false);
  readonly scope = signal<DragOrderScope>('students');
  readonly list = signal<PersonItem[]>([]);
  readonly searchQuery = signal('');
  readonly selected = signal<Set<number>>(new Set());
  readonly genderLoading = signal(false);

  // === Csoport signals ===
  readonly groups = signal<DragOrderGroup[]>([]);
  readonly ungrouped = signal<PersonItem[]>([]);

  /** Person ID → PS slug mapping, save() használja a PS reorderhez */
  private personSlugMap = new Map<number, string>();

  /** Cachelt PS combined data — nevek + pozíciók egyetlen hívásból */
  private psCombinedCache: {
    names: string[];
    studentNames: string[];
    teacherNames: string[];
    students: Array<{ name: string; x: number; y: number }>;
    teachers: Array<{ name: string; x: number; y: number }>;
  } | null = null;

  /** Cachelt title-k PS-ből */
  private psTitlesCache: Map<string, string> | null = null;

  /** Következő csoport szín index */
  private nextColorIndex = 0;

  /** Szűrt lista — keresés alapján (drag & drop a teljes listán működik, a keresés csak vizuálisan szűr) */
  readonly filteredList = computed(() => {
    const items = this.list();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return items;
    return items.filter(p => p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)));
  });

  /** Szűrt ungrouped — keresés alapján */
  readonly filteredUngrouped = computed(() => {
    const items = this.ungrouped();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return items;
    return items.filter(p => p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)));
  });

  /** Szűrt csoportok — keresés alapján */
  readonly filteredGroups = computed(() => {
    const grps = this.groups();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return grps;
    return grps.map(g => ({
      ...g,
      items: g.items.filter(p => p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q))),
    }));
  });

  /** Van-e csoport? */
  readonly hasGroups = computed(() => this.groups().length > 0);

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
    await this.loadFromJson();
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.searchQuery.set('');
    this.clearSelection();
    this.psCombinedCache = null;
    this.psTitlesCache = null;
  }

  clearSelection(): void { this.selected.set(new Set()); }

  setScope(scope: DragOrderScope): void {
    this.scope.set(scope);
    this.selected.set(new Set());
    this.refreshListFromPS().then(() => this.loadFromJson());
  }

  /** DB-ből újratölti a személyeket, PS cache-t törli, frissíti a listát PS-ből */
  async refreshFromDb(): Promise<void> {
    const pid = this.projectIdResolver();
    if (!pid) return;
    this.refreshing.set(true);
    this.psCombinedCache = null;
    this.psTitlesCache = null;
    try {
      await this.projectService.fetchPersons(pid);
      await this.refreshListFromPS();
      await this.loadFromJson();
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
    // Egyetlen PS hívás: nevek + pozíciók egyszerre (cache-elve)
    if (!this.psCombinedCache) {
      this.psCombinedCache = await this.ps.getImageDataCombined();
    }
    const data = this.psCombinedCache;
    const s = this.scope();
    const slugList = s === 'teachers' ? data.teacherNames
      : s === 'students' ? data.studentNames : data.names;

    // Ha nincs PS (üres lista) → DB fallback
    if (slugList.length === 0) {
      this.refreshListFromDb_internal();
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
        const dbPerson = dbPersonsById.get(personId)!;
        items.push({ ...dbPerson });
        this.personSlugMap.set(dbPerson.id, slug);
      } else {
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
  private refreshListFromDb_internal(): void {
    const all = this.projectService.persons();
    const s = this.scope();
    const filtered = s === 'teachers' ? all.filter(p => p.type === 'teacher')
      : s === 'students' ? all.filter(p => p.type === 'student') : all;
    this.list.set([...filtered]);
  }

  /** PS Positions layerekből kiszedi a title-ket és felülírja a lista értékeit */
  private async enrichTitlesFromPS(): Promise<void> {
    if (!this.psTitlesCache) {
      this.psTitlesCache = await this.ps.getPositionsTextContent();
    }
    const posMap = this.psTitlesCache;
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
    const collator = new Intl.Collator('hu', { sensitivity: 'base' });
    const prefixRe = /^(dr\.?\s*|ifj\.?\s*|id\.?\s*|prof\.?\s*|özv\.?\s*)/i;
    const sortKey = (n: string) => n.replace(prefixRe, '').trim();
    const sortFn = (a: PersonItem, b: PersonItem) => collator.compare(sortKey(a.name), sortKey(b.name));

    // Csoportokon belül + ungrouped-ben is rendezünk
    const grps = this.groups().map(g => ({ ...g, items: [...g.items].sort(sortFn) }));
    const ung = [...this.ungrouped()].sort(sortFn);
    this.groups.set(grps);
    this.ungrouped.set(ung);
    this.rebuildFlatList();
  }

  async sortGender(): Promise<void> {
    const allItems = this.getAllItems();
    if (allItems.length < 2 || this.genderLoading()) return;
    this.genderLoading.set(true);
    try {
      const names = allItems.map(p => p.name);
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; classifications: Array<{ name: string; gender: 'boy' | 'girl' }> }>(
          `${environment.apiUrl}/partner/ai/classify-name-genders`,
          { names },
        ),
      );
      if (!res.success || !res.classifications) return;
      const genderMap = new Map(res.classifications.map(c => [c.name, c.gender]));
      const collator = new Intl.Collator('hu', { sensitivity: 'base' });
      const interleave = (items: PersonItem[]): PersonItem[] => {
        const boys = [...items].filter(p => genderMap.get(p.name) === 'boy').sort((a, b) => collator.compare(a.name, b.name));
        const girls = [...items].filter(p => genderMap.get(p.name) === 'girl').sort((a, b) => collator.compare(a.name, b.name));
        const result: PersonItem[] = [];
        const first = boys.length >= girls.length ? boys : girls;
        const second = boys.length >= girls.length ? girls : boys;
        let fi = 0, si = 0;
        for (let i = 0; i < first.length + second.length; i++) {
          if (i % 2 === 0 && fi < first.length) result.push(first[fi++]);
          else if (si < second.length) result.push(second[si++]);
          else if (fi < first.length) result.push(first[fi++]);
        }
        return result;
      };

      // Csoportokon belül + ungrouped-ben is rendezünk
      const grps = this.groups().map(g => ({ ...g, items: interleave(g.items) }));
      const ung = interleave(this.ungrouped());
      this.ngZone.run(() => {
        this.groups.set(grps);
        this.ungrouped.set(ung);
        this.rebuildFlatList();
      });
    } catch { /* ignore */ } finally {
      this.ngZone.run(() => this.genderLoading.set(false));
    }
  }

  sortLeadership(): void {
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
    const sortFn = (a: PersonItem, b: PersonItem) => {
      const pa = getPriority(a.title);
      const pb = getPriority(b.title);
      if (pa !== pb) return pa - pb;
      return collator.compare(a.name, b.name);
    };

    const grps = this.groups().map(g => ({ ...g, items: [...g.items].sort(sortFn) }));
    const ung = [...this.ungrouped()].sort(sortFn);
    this.groups.set(grps);
    this.ungrouped.set(ung);
    this.rebuildFlatList();
  }

  // === Drag & Drop — régi flat lista (backward compat, ha nincs csoport) ===

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

  // === Csoportkezelés ===

  createGroup(name: string): void {
    const id = 'g' + Date.now();
    const colorIndex = this.nextColorIndex;
    this.nextColorIndex = (this.nextColorIndex + 1) % GROUP_COLORS.length;
    const newGroup: DragOrderGroup = { id, name, colorIndex, collapsed: false, items: [] };
    this.groups.update(gs => [...gs, newGroup]);
  }

  createGroupFromSelection(name: string): void {
    const sel = this.selected();
    if (sel.size === 0) return;

    const id = 'g' + Date.now();
    const colorIndex = this.nextColorIndex;
    this.nextColorIndex = (this.nextColorIndex + 1) % GROUP_COLORS.length;

    // Kijelölt személyek összegyűjtése csoportokból + ungrouped-ből
    const selectedItems: PersonItem[] = [];

    // Ungrouped-ből kiszedés
    const ung = this.ungrouped().filter(p => {
      if (sel.has(p.id)) { selectedItems.push(p); return false; }
      return true;
    });

    // Csoportokból kiszedés
    const grps = this.groups().map(g => ({
      ...g,
      items: g.items.filter(p => {
        if (sel.has(p.id)) { selectedItems.push(p); return false; }
        return true;
      }),
    }));

    const newGroup: DragOrderGroup = { id, name, colorIndex, collapsed: false, items: selectedItems };
    this.groups.set([...grps, newGroup]);
    this.ungrouped.set(ung);
    this.selected.set(new Set());
    this.rebuildFlatList();
  }

  removeGroup(groupId: string): void {
    const grps = this.groups();
    const target = grps.find(g => g.id === groupId);
    if (!target) return;
    const remaining = grps.filter(g => g.id !== groupId);
    // Csoport elemei ungrouped-be kerülnek
    this.groups.set(remaining);
    this.ungrouped.update(ung => [...ung, ...target.items]);
    this.rebuildFlatList();
  }

  renameGroup(groupId: string, name: string): void {
    this.groups.update(gs => gs.map(g => g.id === groupId ? { ...g, name } : g));
  }

  toggleGroupCollapse(groupId: string): void {
    this.groups.update(gs => gs.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  }

  // === Csoport Drag & Drop ===

  /** Elem mozgatás csoportba */
  onDropToGroup(event: CdkDragDrop<PersonItem[]>, groupId: string): void {
    const sel = this.selected();
    const draggedItem = event.item.data as PersonItem | undefined;
    const isMulti = sel.size > 1 && draggedItem && sel.has(draggedItem.id);

    if (event.previousContainer === event.container) {
      // Csoporton belüli mozgatás
      if (isMulti) {
        this.multiMoveWithinList(
          g => {
            const grp = g.find(gr => gr.id === groupId);
            return grp ? grp.items : [];
          },
          reordered => {
            this.groups.update(gs => gs.map(g => g.id === groupId ? { ...g, items: reordered } : g));
          },
          sel, event.previousIndex, event.currentIndex,
        );
      } else {
        const grps = this.groups().map(g => {
          if (g.id !== groupId) return g;
          const items = [...g.items];
          moveItemInArray(items, event.previousIndex, event.currentIndex);
          return { ...g, items };
        });
        this.groups.set(grps);
      }
    } else {
      // Másik listából ide húzás
      if (isMulti) {
        this.multiMoveBetweenContainers(sel, groupId, event.currentIndex);
      } else {
        const sourceGroupId = this.getGroupIdFromContainerId(event.previousContainer.id);
        const currGroup = this.groups().find(g => g.id === groupId);
        if (!currGroup) return;

        if (sourceGroupId) {
          const sourceGroup = this.groups().find(g => g.id === sourceGroupId);
          if (!sourceGroup) return;
          const srcItems = [...sourceGroup.items];
          const dstItems = [...currGroup.items];
          transferArrayItem(srcItems, dstItems, event.previousIndex, event.currentIndex);
          this.groups.update(gs => gs.map(g => {
            if (g.id === sourceGroupId) return { ...g, items: srcItems };
            if (g.id === groupId) return { ...g, items: dstItems };
            return g;
          }));
        } else {
          const srcItems = [...this.ungrouped()];
          const dstItems = [...currGroup.items];
          transferArrayItem(srcItems, dstItems, event.previousIndex, event.currentIndex);
          this.ungrouped.set(srcItems);
          this.groups.update(gs => gs.map(g => g.id === groupId ? { ...g, items: dstItems } : g));
        }
      }
    }
    this.rebuildFlatList();
  }

  /** Elem mozgatás az ungrouped-be */
  onDropToUngrouped(event: CdkDragDrop<PersonItem[]>): void {
    const sel = this.selected();
    const draggedItem = event.item.data as PersonItem | undefined;
    const isMulti = sel.size > 1 && draggedItem && sel.has(draggedItem.id);

    if (event.previousContainer === event.container) {
      if (isMulti) {
        this.multiMoveWithinList(
          () => this.ungrouped(),
          reordered => this.ungrouped.set(reordered),
          sel, event.previousIndex, event.currentIndex,
        );
      } else {
        const items = [...this.ungrouped()];
        moveItemInArray(items, event.previousIndex, event.currentIndex);
        this.ungrouped.set(items);
      }
    } else {
      if (isMulti) {
        this.multiMoveBetweenContainers(sel, null, event.currentIndex);
      } else {
        const sourceGroupId = this.getGroupIdFromContainerId(event.previousContainer.id);
        const currData = [...this.ungrouped()];

        if (sourceGroupId) {
          const sourceGroup = this.groups().find(g => g.id === sourceGroupId);
          if (!sourceGroup) return;
          const srcItems = [...sourceGroup.items];
          transferArrayItem(srcItems, currData, event.previousIndex, event.currentIndex);
          this.groups.update(gs => gs.map(g => g.id === sourceGroupId ? { ...g, items: srcItems } : g));
        } else {
          moveItemInArray(currData, event.previousIndex, event.currentIndex);
        }
        this.ungrouped.set(currData);
      }
    }
    this.rebuildFlatList();
  }

  /** Csoport mozgatása fel/le */
  moveGroup(groupId: string, direction: -1 | 1): void {
    const grps = [...this.groups()];
    const idx = grps.findIndex(g => g.id === groupId);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= grps.length) return;
    moveItemInArray(grps, idx, newIdx);
    this.groups.set(grps);
    this.rebuildFlatList();
  }

  // === JSON mentés/betöltés ===

  async loadFromJson(): Promise<void> {
    const psdPath = this.polling.activeDoc().path;
    if (!psdPath || !window.electronAPI) {
      // Nincs PSD / nem Electron → flat lista, minden ungrouped
      this.ungrouped.set([...this.list()]);
      this.groups.set([]);
      return;
    }

    try {
      const result = await window.electronAPI.photoshop.loadDragOrder({ psdPath });
      if (!result.success || !result.data) {
        // Nincs JSON → flat lista
        this.ungrouped.set([...this.list()]);
        this.groups.set([]);
        return;
      }

      const json = result.data as unknown as DragOrderJson;
      if (json.version !== 1 || !Array.isArray(json.groups)) {
        this.ungrouped.set([...this.list()]);
        this.groups.set([]);
        return;
      }

      // Slug → PersonItem map
      const slugToItem = new Map<string, PersonItem>();
      for (const item of this.list()) {
        const slug = this.personSlugMap.get(item.id);
        if (slug) slugToItem.set(slug, item);
      }
      const usedIds = new Set<number>();

      // Csoportok felépítése JSON-ból
      const groups: DragOrderGroup[] = [];
      let maxColorIndex = 0;
      for (const jg of json.groups) {
        const items: PersonItem[] = [];
        for (const slug of jg.items) {
          const item = slugToItem.get(slug);
          if (item && !usedIds.has(item.id)) {
            items.push(item);
            usedIds.add(item.id);
          }
        }
        groups.push({
          id: jg.id,
          name: jg.name,
          colorIndex: jg.colorIndex,
          collapsed: false,
          items,
        });
        if (jg.colorIndex >= maxColorIndex) maxColorIndex = jg.colorIndex + 1;
      }
      this.nextColorIndex = maxColorIndex % GROUP_COLORS.length;

      // Ungrouped: JSON ungrouped + listából maradó (új PS layerek)
      const ungroupedItems: PersonItem[] = [];
      if (Array.isArray(json.ungrouped)) {
        for (const slug of json.ungrouped) {
          const item = slugToItem.get(slug);
          if (item && !usedIds.has(item.id)) {
            ungroupedItems.push(item);
            usedIds.add(item.id);
          }
        }
      }
      // Maradék: új layerek amik nincsenek a JSON-ban
      for (const item of this.list()) {
        if (!usedIds.has(item.id)) {
          ungroupedItems.push(item);
        }
      }

      this.ngZone.run(() => {
        this.groups.set(groups);
        this.ungrouped.set(ungroupedItems);
        this.rebuildFlatList();
      });
    } catch (err) {
      this.logger.error('[DRAG-ORDER] loadFromJson error:', err);
      this.ungrouped.set([...this.list()]);
      this.groups.set([]);
    }
  }

  private async saveToJson(): Promise<void> {
    const psdPath = this.polling.activeDoc().path;
    if (!psdPath || !window.electronAPI) return;

    const grps = this.groups();
    const ung = this.ungrouped();

    const json: DragOrderJson = {
      version: 1,
      scope: this.scope(),
      groups: grps.map(g => ({
        id: g.id,
        name: g.name,
        colorIndex: g.colorIndex,
        items: g.items.map(p => this.personSlugMap.get(p.id) || '').filter(Boolean),
      })),
      ungrouped: ung.map(p => this.personSlugMap.get(p.id) || '').filter(Boolean),
    };

    try {
      await window.electronAPI.photoshop.saveDragOrder({ psdPath, dragOrderData: json as unknown as Record<string, unknown> });
    } catch (err) {
      this.logger.error('[DRAG-ORDER] saveToJson error:', err);
    }
  }

  // === Mentés ===

  async save(): Promise<void> {
    const pid = this.projectIdResolver();
    if (!pid) return;

    // Csoportok kibontása flat listára: csoport1 → csoport2 → ... → ungrouped
    const items = this.buildFlatList();
    if (items.length === 0) return;

    // Innentől ugyanaz, mint a régi flat lista mentés
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

      // 3. Csoport-állapot mentés JSON-ba (PSD mellé)
      await this.saveToJson();

      // 4. Személylista újratöltés
      await this.projectService.fetchPersons(pid);

      // 5. Panel bezárás
      this.ngZone.run(() => {
        this.saving.set(false);
        this.closePanel();
      });
    } catch (err) {
      this.logger.error('[DRAG-ORDER] save error:', err);
      this.ngZone.run(() => this.saving.set(false));
    }
  }

  // === Egyedi sorrend ===

  readonly customOrderOpen = signal(false);
  readonly customOrderText = signal('');
  readonly customOrderLoading = signal(false);
  readonly customOrderResult = signal<{ success: boolean; message: string } | null>(null);

  toggleCustomOrder(): void {
    const open = !this.customOrderOpen();
    this.customOrderOpen.set(open);
    if (!open) {
      this.customOrderResult.set(null);
    }
  }

  closeCustomOrder(): void {
    this.customOrderOpen.set(false);
    this.customOrderResult.set(null);
  }

  async submitCustomOrder(): Promise<void> {
    const text = this.customOrderText().trim();
    if (!text || this.customOrderLoading()) return;

    const allItems = this.buildFlatList();
    if (allItems.length < 2) {
      this.customOrderResult.set({ success: false, message: 'Legalább 2 személy kell a rendezéshez.' });
      return;
    }

    this.customOrderLoading.set(true);
    try {
      const humanNames = allItems.map(p => p.name);
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; ordered_names: string[]; unmatched: string[] }>(
          `${environment.apiUrl}/partner/ai/match-custom-order`,
          { layer_names: humanNames, custom_order: text },
        ),
      );
      if (res.success && res.ordered_names) {
        // Human name → PersonItem map (case insensitive)
        const nameToItem = new Map<string, PersonItem>();
        for (const item of allItems) {
          nameToItem.set(item.name.toLowerCase(), item);
        }

        // Matched személyek az AI sorrend alapján
        const ordered: PersonItem[] = [];
        const usedIds = new Set<number>();
        for (const name of res.ordered_names) {
          const item = nameToItem.get(name.toLowerCase());
          if (item && !usedIds.has(item.id)) {
            ordered.push(item);
            usedIds.add(item.id);
          }
        }

        // Nem matchelt személyek a végére
        for (const item of allItems) {
          if (!usedIds.has(item.id)) {
            ordered.push(item);
          }
        }

        // Csoportok törlése, minden ungrouped-be — egyedi sorrend flat
        this.ngZone.run(() => {
          this.groups.set([]);
          this.ungrouped.set(ordered);
          this.rebuildFlatList();
          const unmatchedCount = res.unmatched?.length || 0;
          const msg = unmatchedCount > 0
            ? `Rendezve (${unmatchedCount} nem párosított név a végén)`
            : 'Rendezve';
          this.customOrderResult.set({ success: true, message: msg });
        });
      } else {
        this.ngZone.run(() => {
          this.customOrderResult.set({ success: false, message: 'Hiba a nevek párosításakor.' });
        });
      }
    } catch {
      this.ngZone.run(() => {
        this.customOrderResult.set({ success: false, message: 'Hiba a nevek párosításakor.' });
      });
    } finally {
      this.ngZone.run(() => this.customOrderLoading.set(false));
    }
  }

  // === Segéd metódusok ===

  /** Csoportok + ungrouped sorrendjében flat lista */
  buildFlatList(): PersonItem[] {
    const result: PersonItem[] = [];
    for (const g of this.groups()) {
      result.push(...g.items);
    }
    result.push(...this.ungrouped());
    return result;
  }

  /** Flat list frissítése a csoportok alapján */
  private rebuildFlatList(): void {
    this.list.set(this.buildFlatList());
  }

  /** Az összes elem (csoportokból + ungrouped) */
  private getAllItems(): PersonItem[] {
    return this.buildFlatList();
  }

  /**
   * Multi-select: listán belüli átrendezés.
   * Kijelölt elemeket kiszedi, majd a cél pozícióba szúrja vissza blokkban.
   */
  private multiMoveWithinList(
    getItems: (groups: DragOrderGroup[]) => PersonItem[],
    setItems: (reordered: PersonItem[]) => void,
    sel: Set<number>,
    previousIndex: number,
    currentIndex: number,
  ): void {
    const items = [...getItems(this.groups())];
    const selectedItems = items.filter(p => sel.has(p.id));
    const remaining = items.filter(p => !sel.has(p.id));
    let insertAt: number;
    if (currentIndex >= items.length) {
      insertAt = remaining.length;
    } else {
      const targetItem = items[currentIndex];
      if (sel.has(targetItem.id)) {
        insertAt = remaining.length;
      } else {
        insertAt = remaining.indexOf(targetItem);
        if (currentIndex > previousIndex) insertAt++;
      }
    }
    remaining.splice(insertAt, 0, ...selectedItems);
    setItems(remaining);
  }

  /**
   * Multi-select: konténerek közötti mozgatás.
   * Kijelölt elemeket kiszedi minden csoportból + ungrouped-ből,
   * és a célba (groupId vagy null=ungrouped) szúrja be insertIndex pozícióba.
   */
  private multiMoveBetweenContainers(
    sel: Set<number>,
    targetGroupId: string | null,
    insertIndex: number,
  ): void {
    // Kijelölt elemek összegyűjtése eredeti sorrendben
    const allItems = this.buildFlatList();
    const selectedItems = allItems.filter(p => sel.has(p.id));

    // Kiszedés minden forrásból
    const grps = this.groups().map(g => ({
      ...g,
      items: g.items.filter(p => !sel.has(p.id)),
    }));
    const ung = this.ungrouped().filter(p => !sel.has(p.id));

    // Beszúrás a célba
    if (targetGroupId) {
      const finalGroups = grps.map(g => {
        if (g.id !== targetGroupId) return g;
        const items = [...g.items];
        const safeIndex = Math.min(insertIndex, items.length);
        items.splice(safeIndex, 0, ...selectedItems);
        return { ...g, items };
      });
      this.groups.set(finalGroups);
      this.ungrouped.set(ung);
    } else {
      const finalUng = [...ung];
      const safeIndex = Math.min(insertIndex, finalUng.length);
      finalUng.splice(safeIndex, 0, ...selectedItems);
      this.ungrouped.set(finalUng);
      this.groups.set(grps);
    }
  }

  /** Csoport ID kinyerése a CDK drop list container id-jéből */
  private getGroupIdFromContainerId(containerId: string): string | null {
    // Container id formátum: "drag-group-{groupId}" vagy "drag-group-ungrouped"
    if (!containerId.startsWith('drag-group-')) return null;
    const groupId = containerId.slice('drag-group-'.length);
    return groupId === 'ungrouped' ? null : groupId;
  }
}
