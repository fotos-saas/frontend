import { Injectable, signal, computed } from '@angular/core';
import { BatchWorkspaceItem, BatchWorkflowType, BATCH_WORKFLOW_LABELS } from '../models/batch.types';
import { PartnerProjectListItem } from '../models/partner.models';

/**
 * Batch Workspace Service — a "kosar" amibe a felhasznalo feladatokat gyujt ossze.
 * Session-szintu, NEM perzisztens (page refresh torol).
 */
@Injectable({
  providedIn: 'root',
})
export class BatchWorkspaceService {
  /** Kosar elemek */
  readonly items = signal<BatchWorkspaceItem[]>([]);

  /** Panel nyitva/zarva */
  readonly panelOpen = signal(false);

  /** Kijelolt elemek ID-i */
  readonly selectedIds = signal<string[]>([]);

  // ========== Computed ==========

  readonly itemCount = computed(() => this.items().length);

  readonly selectedItems = computed(() => {
    const ids = new Set(this.selectedIds());
    return this.items().filter(item => ids.has(item.id));
  });

  readonly hasSelection = computed(() => this.selectedIds().length > 0);

  readonly allSelected = computed(() => {
    const items = this.items();
    return items.length > 0 && this.selectedIds().length === items.length;
  });

  /** Projektenként csoportositva */
  readonly groupedByProject = computed(() => {
    const groups = new Map<number, { projectName: string; schoolName: string | null; items: BatchWorkspaceItem[] }>();
    for (const item of this.items()) {
      const existing = groups.get(item.projectId);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(item.projectId, {
          projectName: item.projectName,
          schoolName: item.schoolName,
          items: [item],
        });
      }
    }
    return groups;
  });

  // ========== Muveletek ==========

  /** Egy feladat hozzaadasa a kosarhoz */
  addTask(project: PartnerProjectListItem, workflowType: BatchWorkflowType): void {
    const item: BatchWorkspaceItem = {
      id: crypto.randomUUID(),
      projectId: project.id,
      projectName: project.name,
      schoolName: project.schoolName,
      className: project.className,
      personsCount: project.personsCount,
      sampleThumbUrl: project.sampleThumbUrl,
      workflowType,
      addedAt: new Date().toISOString(),
    };
    this.items.update(items => [...items, item]);
    this.selectedIds.update(ids => [...ids, item.id]);
  }

  /** Tobb feladat hozzaadasa egyszerre */
  addTasks(projects: PartnerProjectListItem[], workflowType: BatchWorkflowType): void {
    const newItems: BatchWorkspaceItem[] = projects.map(project => ({
      id: crypto.randomUUID(),
      projectId: project.id,
      projectName: project.name,
      schoolName: project.schoolName,
      className: project.className,
      personsCount: project.personsCount,
      sampleThumbUrl: project.sampleThumbUrl,
      workflowType,
      addedAt: new Date().toISOString(),
    }));
    this.items.update(items => [...items, ...newItems]);
    this.selectedIds.update(ids => [...ids, ...newItems.map(i => i.id)]);
  }

  /** Elem eltavolitasa */
  removeItem(itemId: string): void {
    this.items.update(items => items.filter(i => i.id !== itemId));
    this.selectedIds.update(ids => ids.filter(id => id !== itemId));
  }

  /** Osszes torles */
  clearAll(): void {
    this.items.set([]);
    this.selectedIds.set([]);
  }

  /** Kijeloles toggle */
  toggleSelect(itemId: string): void {
    this.selectedIds.update(ids =>
      ids.includes(itemId)
        ? ids.filter(id => id !== itemId)
        : [...ids, itemId],
    );
  }

  /** Osszes kijelolese */
  selectAll(): void {
    this.selectedIds.set(this.items().map(i => i.id));
  }

  /** Kijeloles torlese */
  deselectAll(): void {
    this.selectedIds.set([]);
  }

  /** Panel toggle */
  togglePanel(): void {
    this.panelOpen.update(v => !v);
  }

  /** Workflow label lekerdezes */
  getWorkflowLabel(type: BatchWorkflowType): string {
    return BATCH_WORKFLOW_LABELS[type];
  }
}
