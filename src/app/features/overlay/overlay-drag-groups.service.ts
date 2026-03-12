import { Injectable, inject, NgZone, signal, computed } from '@angular/core';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { PersonItem } from './overlay-project.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlaySortService } from './overlay-sort.service';
import { LoggerService } from '../../core/services/logger.service';

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

@Injectable()
export class OverlayDragGroupsService {
  private readonly ngZone = inject(NgZone);
  private readonly polling = inject(OverlayPollingService);
  private readonly sortService = inject(OverlaySortService);
  private readonly logger = inject(LoggerService);

  readonly groups = signal<DragOrderGroup[]>([]);
  readonly ungrouped = signal<PersonItem[]>([]);
  readonly hasGroups = computed(() => this.groups().length > 0);

  private nextColorIndex = 0;

  /** Külső referencia: personSlugMap-ot és list signal-t a drag-order service adja */
  private _personSlugMap!: Map<number, string>;
  private _listSetter!: (items: PersonItem[]) => void;
  private _listGetter!: () => PersonItem[];
  private _scopeGetter!: () => string;

  configure(opts: {
    personSlugMap: Map<number, string>;
    listSetter: (items: PersonItem[]) => void;
    listGetter: () => PersonItem[];
    scopeGetter: () => string;
  }): void {
    this._personSlugMap = opts.personSlugMap;
    this._listSetter = opts.listSetter;
    this._listGetter = opts.listGetter;
    this._scopeGetter = opts.scopeGetter;
  }

  buildFlatList(): PersonItem[] {
    const result: PersonItem[] = [];
    for (const g of this.groups()) result.push(...g.items);
    result.push(...this.ungrouped());
    return result;
  }

  rebuildFlatList(): void {
    this._listSetter(this.buildFlatList());
  }

  // === Csoportkezelés ===

  createGroup(name: string): void {
    const id = 'g' + Date.now();
    const colorIndex = this.nextColorIndex;
    this.nextColorIndex = (this.nextColorIndex + 1) % GROUP_COLORS.length;
    this.groups.update(gs => [...gs, { id, name, colorIndex, collapsed: false, items: [] }]);
  }

  createGroupFromSelection(name: string, sel: Set<number>): void {
    if (sel.size === 0) return;
    const id = 'g' + Date.now();
    const colorIndex = this.nextColorIndex;
    this.nextColorIndex = (this.nextColorIndex + 1) % GROUP_COLORS.length;

    const selectedItems: PersonItem[] = [];
    const ung = this.ungrouped().filter(p => {
      if (sel.has(p.id)) { selectedItems.push(p); return false; }
      return true;
    });
    const grps = this.groups().map(g => ({
      ...g,
      items: g.items.filter(p => {
        if (sel.has(p.id)) { selectedItems.push(p); return false; }
        return true;
      }),
    }));

    this.groups.set([...grps, { id, name, colorIndex, collapsed: false, items: selectedItems }]);
    this.ungrouped.set(ung);
    this.rebuildFlatList();
  }

  removeGroup(groupId: string): void {
    const target = this.groups().find(g => g.id === groupId);
    if (!target) return;
    this.groups.update(gs => gs.filter(g => g.id !== groupId));
    this.ungrouped.update(ung => [...ung, ...target.items]);
    this.rebuildFlatList();
  }

  renameGroup(groupId: string, name: string): void {
    this.groups.update(gs => gs.map(g => g.id === groupId ? { ...g, name } : g));
  }

  toggleGroupCollapse(groupId: string): void {
    this.groups.update(gs => gs.map(g => g.id === groupId ? { ...g, collapsed: !g.collapsed } : g));
  }

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

  // === Csoport Drag & Drop ===

  onDropToGroup(event: CdkDragDrop<PersonItem[]>, groupId: string, sel: Set<number>): void {
    const draggedItem = event.item.data as PersonItem | undefined;
    const isMulti = sel.size > 1 && draggedItem && sel.has(draggedItem.id);

    if (event.previousContainer === event.container) {
      if (isMulti) {
        this.multiMoveWithinList(
          g => { const grp = g.find(gr => gr.id === groupId); return grp ? grp.items : []; },
          reordered => { this.groups.update(gs => gs.map(g => g.id === groupId ? { ...g, items: reordered } : g)); },
          sel, event.previousIndex, event.currentIndex,
        );
      } else {
        this.groups.set(this.groups().map(g => {
          if (g.id !== groupId) return g;
          const items = [...g.items];
          moveItemInArray(items, event.previousIndex, event.currentIndex);
          return { ...g, items };
        }));
      }
    } else {
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

  onDropToUngrouped(event: CdkDragDrop<PersonItem[]>, sel: Set<number>): void {
    const draggedItem = event.item.data as PersonItem | undefined;
    const isMulti = sel.size > 1 && draggedItem && sel.has(draggedItem.id);

    if (event.previousContainer === event.container) {
      if (isMulti) {
        this.multiMoveWithinList(
          () => this.ungrouped(), reordered => this.ungrouped.set(reordered),
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

  // === JSON mentés/betöltés ===

  async loadFromJson(list: PersonItem[]): Promise<void> {
    const psdPath = this.polling.activeDoc().path;
    if (!psdPath || !window.electronAPI) {
      this.ungrouped.set([...list]);
      this.groups.set([]);
      return;
    }

    try {
      const result = await window.electronAPI.photoshop.loadDragOrder({ psdPath });
      if (!result.success || !result.data) {
        this.ungrouped.set([...list]);
        this.groups.set([]);
        return;
      }

      const json = result.data as unknown as DragOrderJson;
      if (json.version !== 1 || !Array.isArray(json.groups)) {
        this.ungrouped.set([...list]);
        this.groups.set([]);
        return;
      }

      const slugToItem = new Map<string, PersonItem>();
      for (const item of list) {
        const slug = this._personSlugMap.get(item.id);
        if (slug) slugToItem.set(slug, item);
      }
      const usedIds = new Set<number>();

      const groups: DragOrderGroup[] = [];
      let maxColorIndex = 0;
      for (const jg of json.groups) {
        const items: PersonItem[] = [];
        for (const slug of jg.items) {
          const item = slugToItem.get(slug);
          if (item && !usedIds.has(item.id)) { items.push(item); usedIds.add(item.id); }
        }
        groups.push({ id: jg.id, name: jg.name, colorIndex: jg.colorIndex, collapsed: false, items });
        if (jg.colorIndex >= maxColorIndex) maxColorIndex = jg.colorIndex + 1;
      }
      this.nextColorIndex = maxColorIndex % GROUP_COLORS.length;

      const ungroupedItems: PersonItem[] = [];
      if (Array.isArray(json.ungrouped)) {
        for (const slug of json.ungrouped) {
          const item = slugToItem.get(slug);
          if (item && !usedIds.has(item.id)) { ungroupedItems.push(item); usedIds.add(item.id); }
        }
      }
      for (const item of list) {
        if (!usedIds.has(item.id)) ungroupedItems.push(item);
      }

      this.ngZone.run(() => {
        this.groups.set(groups);
        this.ungrouped.set(ungroupedItems);
        this.rebuildFlatList();
      });
    } catch (err) {
      this.logger.error('[DRAG-ORDER] loadFromJson error:', err);
      this.ungrouped.set([...list]);
      this.groups.set([]);
    }
  }

  async saveToJson(): Promise<void> {
    const psdPath = this.polling.activeDoc().path;
    if (!psdPath || !window.electronAPI) return;

    const json: DragOrderJson = {
      version: 1,
      scope: this._scopeGetter(),
      groups: this.groups().map(g => ({
        id: g.id, name: g.name, colorIndex: g.colorIndex,
        items: g.items.map(p => this._personSlugMap.get(p.id) || '').filter(Boolean),
      })),
      ungrouped: this.ungrouped().map(p => this._personSlugMap.get(p.id) || '').filter(Boolean),
    };

    try {
      await window.electronAPI.photoshop.saveDragOrder({ psdPath, dragOrderData: json as unknown as Record<string, unknown> });
    } catch (err) {
      this.logger.error('[DRAG-ORDER] saveToJson error:', err);
    }
  }

  // === Rendezés segédek ===

  sortItems(sortFn: (a: PersonItem, b: PersonItem) => number): void {
    this.groups.set(this.groups().map(g => ({ ...g, items: [...g.items].sort(sortFn) })));
    this.ungrouped.set([...this.ungrouped()].sort(sortFn));
    this.rebuildFlatList();
  }

  applyReorderedItems(items: PersonItem[]): void {
    this.ngZone.run(() => {
      this.groups.set([]);
      this.ungrouped.set(items);
      this.rebuildFlatList();
    });
  }

  // === Private ===

  private multiMoveWithinList(
    getItems: (groups: DragOrderGroup[]) => PersonItem[],
    setItems: (reordered: PersonItem[]) => void,
    sel: Set<number>, previousIndex: number, currentIndex: number,
  ): void {
    const items = [...getItems(this.groups())];
    const selectedItems = items.filter(p => sel.has(p.id));
    const remaining = items.filter(p => !sel.has(p.id));
    let insertAt: number;
    if (currentIndex >= items.length) {
      insertAt = remaining.length;
    } else {
      const targetItem = items[currentIndex];
      if (sel.has(targetItem.id)) { insertAt = remaining.length; }
      else { insertAt = remaining.indexOf(targetItem); if (currentIndex > previousIndex) insertAt++; }
    }
    remaining.splice(insertAt, 0, ...selectedItems);
    setItems(remaining);
  }

  private multiMoveBetweenContainers(sel: Set<number>, targetGroupId: string | null, insertIndex: number): void {
    const allItems = this.buildFlatList();
    const selectedItems = allItems.filter(p => sel.has(p.id));

    const grps = this.groups().map(g => ({ ...g, items: g.items.filter(p => !sel.has(p.id)) }));
    const ung = this.ungrouped().filter(p => !sel.has(p.id));

    if (targetGroupId) {
      this.groups.set(grps.map(g => {
        if (g.id !== targetGroupId) return g;
        const items = [...g.items];
        items.splice(Math.min(insertIndex, items.length), 0, ...selectedItems);
        return { ...g, items };
      }));
      this.ungrouped.set(ung);
    } else {
      const finalUng = [...ung];
      finalUng.splice(Math.min(insertIndex, finalUng.length), 0, ...selectedItems);
      this.ungrouped.set(finalUng);
      this.groups.set(grps);
    }
  }

  private getGroupIdFromContainerId(containerId: string): string | null {
    if (!containerId.startsWith('drag-group-')) return null;
    const groupId = containerId.slice('drag-group-'.length);
    return groupId === 'ungrouped' ? null : groupId;
  }
}
