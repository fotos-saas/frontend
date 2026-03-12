import { Injectable, inject, NgZone, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlaySortService } from './overlay-sort.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlayDragGroupsService, DragOrderGroup, GROUP_COLORS } from './overlay-drag-groups.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { LoggerService } from '../../core/services/logger.service';

export { GROUP_COLORS, DragOrderGroup } from './overlay-drag-groups.service';

type DragOrderScope = 'all' | 'teachers' | 'students';

@Injectable()
export class OverlayDragOrderService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly projectService = inject(OverlayProjectService);
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly sortService = inject(OverlaySortService);
  private readonly polling = inject(OverlayPollingService);
  private readonly logger = inject(LoggerService);
  private readonly groupsService = inject(OverlayDragGroupsService);

  readonly panelOpen = signal(false);
  readonly saving = signal(false);
  readonly refreshing = signal(false);
  readonly scope = signal<DragOrderScope>('students');
  readonly list = signal<PersonItem[]>([]);
  readonly searchQuery = signal('');
  readonly selected = signal<Set<number>>(new Set());
  readonly genderLoading = signal(false);

  // Csoport signal delegálás
  readonly groups = this.groupsService.groups;
  readonly ungrouped = this.groupsService.ungrouped;
  readonly hasGroups = this.groupsService.hasGroups;

  private personSlugMap = new Map<number, string>();

  private psCombinedCache: {
    names: string[]; studentNames: string[]; teacherNames: string[];
    students: Array<{ name: string; x: number; y: number }>;
    teachers: Array<{ name: string; x: number; y: number }>;
  } | null = null;
  private psTitlesCache: Map<string, string> | null = null;

  readonly filteredList = computed(() => {
    const items = this.list();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return items;
    return items.filter(p => p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)));
  });

  readonly filteredUngrouped = computed(() => {
    const items = this.ungrouped();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return items;
    return items.filter(p => p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q)));
  });

  readonly filteredGroups = computed(() => {
    const grps = this.groups();
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return grps;
    return grps.map(g => ({
      ...g,
      items: g.items.filter(p => p.name.toLowerCase().includes(q) || (p.title && p.title.toLowerCase().includes(q))),
    }));
  });

  // Egyedi sorrend
  readonly customOrderOpen = signal(false);
  readonly customOrderText = signal('');
  readonly customOrderLoading = signal(false);
  readonly customOrderResult = signal<{ success: boolean; message: string } | null>(null);

  private projectIdResolver: () => number | null = () => null;

  setProjectIdResolver(fn: () => number | null): void { this.projectIdResolver = fn; }

  constructor() {
    this.groupsService.configure({
      personSlugMap: this.personSlugMap,
      listSetter: items => this.list.set(items),
      listGetter: () => this.list(),
      scopeGetter: () => this.scope(),
    });
  }

  // === Panel kezelés ===

  async openPanel(): Promise<void> {
    this.panelOpen.set(true);
    const pid = this.projectIdResolver();
    if (pid && this.projectService.persons().length === 0) {
      await this.projectService.fetchPersons(pid);
    }
    await this.refreshListFromPS();
    await this.groupsService.loadFromJson(this.list());
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
    this.refreshListFromPS().then(() => this.groupsService.loadFromJson(this.list()));
  }

  async refreshFromDb(): Promise<void> {
    const pid = this.projectIdResolver();
    if (!pid) return;
    this.refreshing.set(true);
    this.psCombinedCache = null;
    this.psTitlesCache = null;
    try {
      await this.projectService.fetchPersons(pid);
      await this.refreshListFromPS();
      await this.groupsService.loadFromJson(this.list());
    } finally {
      this.ngZone.run(() => this.refreshing.set(false));
    }
  }

  // === Kijelölés ===

  toggleSelect(personId: number, event: MouseEvent): void {
    if (!event.metaKey && !event.ctrlKey) return;
    event.preventDefault();
    const sel = new Set(this.selected());
    if (sel.has(personId)) sel.delete(personId); else sel.add(personId);
    this.selected.set(sel);
  }

  isSelected(personId: number): boolean { return this.selected().has(personId); }

  // === Rendezés ===

  sortAbc(): void {
    const collator = new Intl.Collator('hu', { sensitivity: 'base' });
    const prefixRe = /^(dr\.?\s*|ifj\.?\s*|id\.?\s*|prof\.?\s*|özv\.?\s*)/i;
    const sortKey = (n: string) => n.replace(prefixRe, '').trim();
    this.groupsService.sortItems((a, b) => collator.compare(sortKey(a.name), sortKey(b.name)));
  }

  async sortGender(): Promise<void> {
    const allItems = this.groupsService.buildFlatList();
    if (allItems.length < 2 || this.genderLoading()) return;
    this.genderLoading.set(true);
    try {
      const names = allItems.map(p => p.name);
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; classifications: Array<{ name: string; gender: 'boy' | 'girl' }> }>(
          `${environment.apiUrl}/partner/ai/classify-name-genders`, { names },
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

      const grps = this.groups().map(g => ({ ...g, items: interleave(g.items) }));
      const ung = interleave(this.ungrouped());
      this.ngZone.run(() => {
        this.groupsService.groups.set(grps);
        this.groupsService.ungrouped.set(ung);
        this.groupsService.rebuildFlatList();
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
    this.groupsService.sortItems((a, b) => {
      const pa = getPriority(a.title);
      const pb = getPriority(b.title);
      if (pa !== pb) return pa - pb;
      return collator.compare(a.name, b.name);
    });
  }

  // === Flat lista Drag & Drop ===

  onDrop(event: CdkDragDrop<PersonItem[]>): void {
    const items = [...this.list()];
    const sel = this.selected();
    const draggedIndex = event.previousIndex;
    const targetIndex = event.currentIndex;

    if (sel.size > 1 && sel.has(items[draggedIndex].id)) {
      const selectedItems = items.filter(p => sel.has(p.id));
      const remaining = items.filter(p => !sel.has(p.id));
      let insertAt: number;
      if (targetIndex >= items.length) { insertAt = remaining.length; }
      else {
        const targetItem = items[targetIndex];
        if (sel.has(targetItem.id)) { insertAt = remaining.length; }
        else { insertAt = remaining.indexOf(targetItem); if (targetIndex > draggedIndex) insertAt++; }
      }
      remaining.splice(insertAt, 0, ...selectedItems);
      this.list.set(remaining);
    } else {
      moveItemInArray(items, draggedIndex, targetIndex);
      this.list.set(items);
    }
  }

  // === Csoport delegálás ===

  createGroup(name: string): void { this.groupsService.createGroup(name); }
  createGroupFromSelection(name: string): void { this.groupsService.createGroupFromSelection(name, this.selected()); this.selected.set(new Set()); }
  removeGroup(id: string): void { this.groupsService.removeGroup(id); }
  renameGroup(groupId: string, name: string): void { this.groupsService.renameGroup(groupId, name); }
  toggleGroupCollapse(id: string): void { this.groupsService.toggleGroupCollapse(id); }
  onDropToGroup(event: CdkDragDrop<PersonItem[]>, groupId: string): void { this.groupsService.onDropToGroup(event, groupId, this.selected()); }
  onDropToUngrouped(event: CdkDragDrop<PersonItem[]>): void { this.groupsService.onDropToUngrouped(event, this.selected()); }
  moveGroup(id: string, direction: -1 | 1): void { this.groupsService.moveGroup(id, direction); }

  // === Mentés ===

  async save(): Promise<void> {
    const pid = this.projectIdResolver();
    if (!pid) return;
    const items = this.groupsService.buildFlatList();
    if (items.length === 0) return;

    this.saving.set(true);
    try {
      const dbItems = items.filter(p => p.id > 0);
      if (dbItems.length > 0) {
        await firstValueFrom(
          this.http.patch<any>(
            `${environment.apiUrl}/partner/projects/${pid}/persons/reorder`,
            { positions: dbItems.map((p, i) => ({ id: p.id, position: i + 1 })) },
          ),
        );
      }

      const orderedSlugs: string[] = [];
      for (const p of items) {
        const slug = this.personSlugMap.get(p.id);
        if (slug) orderedSlugs.push(slug);
      }
      if (orderedSlugs.length >= 2) {
        const groupLabel = this.scope() === 'teachers' ? 'Teachers' : this.scope() === 'students' ? 'Students' : 'All';
        await this.sortService.reorderLayersByNamesScoped(orderedSlugs, groupLabel);
      }

      await this.groupsService.saveToJson();
      await this.projectService.fetchPersons(pid);
      this.ngZone.run(() => { this.saving.set(false); this.closePanel(); });
    } catch (err) {
      this.logger.error('[DRAG-ORDER] save error:', err);
      this.ngZone.run(() => this.saving.set(false));
    }
  }

  // === Egyedi sorrend ===

  toggleCustomOrder(): void {
    const open = !this.customOrderOpen();
    this.customOrderOpen.set(open);
    if (!open) this.customOrderResult.set(null);
  }

  closeCustomOrder(): void { this.customOrderOpen.set(false); this.customOrderResult.set(null); }

  async submitCustomOrder(): Promise<void> {
    const text = this.customOrderText().trim();
    if (!text || this.customOrderLoading()) return;
    const allItems = this.groupsService.buildFlatList();
    if (allItems.length < 2) {
      this.customOrderResult.set({ success: false, message: 'Legalább 2 személy kell a rendezéshez.' });
      return;
    }

    this.customOrderLoading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ success: boolean; ordered_names: string[]; unmatched: string[] }>(
          `${environment.apiUrl}/partner/ai/match-custom-order`,
          { layer_names: allItems.map(p => p.name), custom_order: text },
        ),
      );
      if (res.success && res.ordered_names) {
        const nameToItem = new Map<string, PersonItem>();
        for (const item of allItems) nameToItem.set(item.name.toLowerCase(), item);
        const ordered: PersonItem[] = [];
        const usedIds = new Set<number>();
        for (const name of res.ordered_names) {
          const item = nameToItem.get(name.toLowerCase());
          if (item && !usedIds.has(item.id)) { ordered.push(item); usedIds.add(item.id); }
        }
        for (const item of allItems) { if (!usedIds.has(item.id)) ordered.push(item); }

        this.ngZone.run(() => {
          this.groupsService.applyReorderedItems(ordered);
          const unmatchedCount = res.unmatched?.length || 0;
          this.customOrderResult.set({
            success: true,
            message: unmatchedCount > 0 ? `Rendezve (${unmatchedCount} nem párosított név a végén)` : 'Rendezve',
          });
        });
      } else {
        this.ngZone.run(() => this.customOrderResult.set({ success: false, message: 'Hiba a nevek párosításakor.' }));
      }
    } catch {
      this.ngZone.run(() => this.customOrderResult.set({ success: false, message: 'Hiba a nevek párosításakor.' }));
    } finally {
      this.ngZone.run(() => this.customOrderLoading.set(false));
    }
  }

  // === PS lista építés ===

  private async refreshListFromPS(): Promise<void> {
    if (!this.psCombinedCache) this.psCombinedCache = await this.ps.getImageDataCombined();
    const data = this.psCombinedCache;
    const s = this.scope();
    const slugList = s === 'teachers' ? data.teacherNames : s === 'students' ? data.studentNames : data.names;

    if (slugList.length === 0) {
      this.refreshListFromDb_internal();
      await this.enrichTitlesFromPS();
      return;
    }

    const dbPersonsById = new Map<number, PersonItem>();
    for (const p of this.projectService.persons()) dbPersonsById.set(p.id, p);

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
          id, name: humanName, title: null,
          type: s === 'teachers' ? 'teacher' : 'student',
          hasPhoto: false, photoThumbUrl: null, photoUrl: null, archiveId: null, linkedGroup: null,
        });
        this.personSlugMap.set(id, slug);
      }
    }

    this.ngZone.run(() => this.list.set(items));
    await this.enrichTitlesFromPS();
  }

  private refreshListFromDb_internal(): void {
    const all = this.projectService.persons();
    const s = this.scope();
    const filtered = s === 'teachers' ? all.filter(p => p.type === 'teacher')
      : s === 'students' ? all.filter(p => p.type === 'student') : all;
    this.list.set([...filtered]);
  }

  private async enrichTitlesFromPS(): Promise<void> {
    if (!this.psTitlesCache) this.psTitlesCache = await this.ps.getPositionsTextContent();
    const posMap = this.psTitlesCache;
    if (posMap.size === 0) return;
    const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const slugToTitle = new Map<string, string>();
    for (const [slug, title] of posMap) slugToTitle.set(normalize(this.sortService.slugToHumanName(slug)), title);
    const items = this.list();
    let changed = false;
    const updated = items.map(p => {
      const psTitle = slugToTitle.get(normalize(p.name));
      if (psTitle !== undefined && psTitle !== p.title) { changed = true; return { ...p, title: psTitle }; }
      return p;
    });
    if (changed) this.ngZone.run(() => this.list.set(updated));
  }
}
