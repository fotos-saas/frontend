import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { PartnerProjectService } from '../../services/partner-project.service';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherListItem, LinkedGroupPhoto, PhotoChooserMode } from '../../models/teacher.models';
import { TabloPersonItem } from './persons-modal.types';
import { TextTransformType, applyTextTransform } from './text-transform.util';

/** Szerkesztési sor state */
export interface EditRow {
  name: string;
  title: string;
  note: string;
  dirty: boolean;
  saving: boolean;
}

/**
 * Persons Modal Actions Service
 * Kiemelt logika: szerkesztés, batch törlés, teacher link, photo chooser.
 */
@Injectable()
export class PersonsModalActionsService {
  private readonly projectService = inject(PartnerProjectService);
  private readonly teacherService = inject(PartnerTeacherService);
  private readonly destroyRef = inject(DestroyRef);

  // --- Szerkesztés mód ---
  readonly editMode = signal(false);
  readonly editData = signal<Map<number, EditRow>>(new Map());

  // --- Inline edit (grid nézetben) ---
  readonly inlineEditPersonId = signal<number | null>(null);
  readonly inlineEditData = signal<{ name: string; title: string; note: string } | null>(null);
  readonly inlineEditSaving = signal(false);

  // --- Batch törlés ---
  readonly batchDeleteConfirm = signal(false);
  readonly batchDeleting = signal(false);

  // --- Batch portrait / crop dialógus ---
  readonly batchPortraitPersons = signal<TabloPersonItem[] | null>(null);
  readonly batchCropPersons = signal<TabloPersonItem[] | null>(null);

  // --- Személy törlés ---
  readonly deleteConfirmPerson = signal<TabloPersonItem | null>(null);

  // --- Teacher link & photo chooser ---
  readonly showTeacherLinkDialog = signal(false);
  readonly showPhotoChooserDialog = signal(false);
  readonly linkDialogTeacher = signal<TeacherListItem | null>(null);
  readonly linkDialogAllTeachers = signal<TeacherListItem[]>([]);
  readonly photoChooserPhotos = signal<LinkedGroupPhoto[]>([]);
  readonly photoChooserMode = signal<PhotoChooserMode | null>(null);

  // --- Edit logika ---

  initEditMode(persons: TabloPersonItem[]): void {
    const map = new Map<number, EditRow>();
    for (const p of persons) {
      map.set(p.id, { name: p.name, title: p.title || '', note: p.note || '', dirty: false, saving: false });
    }
    this.editData.set(map);
    this.editMode.set(true);
  }

  exitEditMode(): void {
    this.editMode.set(false);
    this.editData.set(new Map());
  }

  toggleEditMode(persons: TabloPersonItem[]): void {
    if (this.editMode()) {
      this.exitEditMode();
    } else {
      this.initEditMode(persons);
    }
  }

  onEditFieldChange(personId: number, field: 'name' | 'title' | 'note', value: string, allPersons: TabloPersonItem[]): void {
    const data = new Map(this.editData());
    const row = data.get(personId);
    if (!row) return;
    const person = allPersons.find(p => p.id === personId);
    const updated = { ...row, [field]: value };
    data.set(personId, { ...updated, dirty: this.isDirty(updated, person) });
    this.editData.set(data);
  }

  getEditRow(personId: number): EditRow | undefined {
    return this.editData().get(personId);
  }

  hasDirtyEdits(): boolean {
    for (const row of this.editData().values()) {
      if (row.dirty) return true;
    }
    return false;
  }

  saveRow(
    projectId: number,
    personId: number,
    onUpdate: (personId: number, patch: Partial<TabloPersonItem>) => void,
  ): void {
    const row = this.editData().get(personId);
    if (!row?.dirty || row.saving || !row.name.trim()) return;

    this.setEditRow(personId, { ...row, saving: true });
    this.projectService.updatePerson(projectId, personId, {
      name: row.name.trim(), title: row.title.trim() || null, note: row.note.trim() || null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        onUpdate(personId, { name: res.data.name, title: res.data.title, note: res.data.note });
        this.setEditRow(personId, { name: res.data.name, title: res.data.title || '', note: res.data.note || '', dirty: false, saving: false });
      },
      error: () => {
        const r = this.editData().get(personId);
        if (r) this.setEditRow(personId, { ...r, saving: false });
      },
    });
  }

  saveAllDirty(
    projectId: number,
    onUpdate: (personId: number, patch: Partial<TabloPersonItem>) => void,
  ): void {
    for (const [id, row] of this.editData()) {
      if (row.dirty && !row.saving) this.saveRow(projectId, id, onUpdate);
    }
  }

  private isDirty(row: EditRow, person: TabloPersonItem | undefined): boolean {
    if (!person) return false;
    return row.name !== person.name || row.title !== (person.title || '') || row.note !== (person.note || '');
  }

  private setEditRow(personId: number, row: EditRow): void {
    const data = new Map(this.editData());
    data.set(personId, row);
    this.editData.set(data);
  }

  // --- Inline edit ---

  onInlineEdit(person: TabloPersonItem): void {
    this.inlineEditPersonId.set(person.id);
    this.inlineEditData.set({ name: person.name, title: person.title || '', note: person.note || '' });
    this.inlineEditSaving.set(false);
  }

  closeInlineEdit(): void {
    this.inlineEditPersonId.set(null);
    this.inlineEditData.set(null);
    this.inlineEditSaving.set(false);
  }

  saveInlineEdit(
    projectId: number,
    onUpdate: (personId: number, patch: Partial<TabloPersonItem>) => void,
  ): void {
    const personId = this.inlineEditPersonId();
    const data = this.inlineEditData();
    if (!personId || !data || !data.name.trim() || this.inlineEditSaving()) return;

    this.inlineEditSaving.set(true);
    this.projectService.updatePerson(projectId, personId, {
      name: data.name.trim(), title: data.title.trim() || null, note: data.note.trim() || null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        onUpdate(personId, { name: res.data.name, title: res.data.title, note: res.data.note });
        this.closeInlineEdit();
      },
      error: () => this.inlineEditSaving.set(false),
    });
  }

  // --- Személy törlés ---

  deletePerson(person: TabloPersonItem): void {
    this.deleteConfirmPerson.set(person);
  }

  confirmDeletePerson(
    projectId: number,
    allPersons: ReturnType<typeof signal<TabloPersonItem[]>>,
  ): void {
    const person = this.deleteConfirmPerson();
    if (!person) return;
    this.projectService.deletePerson(projectId, person.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          allPersons.set(allPersons().filter(p => p.id !== person.id));
          const data = new Map(this.editData()); data.delete(person.id); this.editData.set(data);
          this.deleteConfirmPerson.set(null);
        },
        error: () => this.deleteConfirmPerson.set(null),
      });
  }

  cancelDeletePerson(): void { this.deleteConfirmPerson.set(null); }

  // --- Batch törlés ---

  batchDeletePersons(selectedCount: number): void {
    if (selectedCount === 0) return;
    this.batchDeleteConfirm.set(true);
  }

  confirmBatchDelete(
    projectId: number,
    selectedIds: Set<number>,
    allPersons: ReturnType<typeof signal<TabloPersonItem[]>>,
    resetSelection: () => void,
  ): void {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    this.batchDeleting.set(true);
    this.projectService.deletePersonsBatch(projectId, ids)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const deletedSet = new Set(ids);
          allPersons.set(allPersons().filter(p => !deletedSet.has(p.id)));
          resetSelection();
          this.batchDeleteConfirm.set(false);
          this.batchDeleting.set(false);
        },
        error: () => {
          this.batchDeleteConfirm.set(false);
          this.batchDeleting.set(false);
        },
      });
  }

  cancelBatchDelete(): void { this.batchDeleteConfirm.set(false); }

  // --- Batch portrait / crop ---

  startBatchPortrait(selectedIds: Set<number>, persons: TabloPersonItem[]): void {
    const filtered = persons.filter(p => selectedIds.has(p.id));
    if (filtered.length === 0) return;
    this.batchPortraitPersons.set(filtered);
  }

  onBatchPortraitCompleted(resetSelection: () => void, reload: () => void): void {
    this.batchPortraitPersons.set(null);
    resetSelection();
    reload();
  }

  startBatchCrop(selectedIds: Set<number>, persons: TabloPersonItem[]): void {
    const filtered = persons.filter(p => selectedIds.has(p.id));
    if (filtered.length === 0) return;
    this.batchCropPersons.set(filtered);
  }

  onBatchCropCompleted(resetSelection: () => void, reload: () => void): void {
    this.batchCropPersons.set(null);
    resetSelection();
    reload();
  }

  // --- Teacher link & photo chooser ---

  openLinkDialog(person: TabloPersonItem, projectId: number): void {
    const doOpen = (archiveId: number) => {
      forkJoin({
        teacher: this.teacherService.getTeacher(archiveId),
        allTeachers: this.teacherService.getAllTeachers(),
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: ({ teacher: res, allTeachers }) => {
          const t = res.data;
          const teacherListItem: TeacherListItem = {
            id: t.id,
            canonicalName: t.canonicalName,
            titlePrefix: t.titlePrefix,
            position: t.position ?? null,
            fullDisplayName: t.fullDisplayName,
            schoolId: t.schoolId,
            schoolName: t.schoolName ?? null,
            isActive: true,
            photoThumbUrl: t.photoThumbUrl ?? null,
            photoMiniThumbUrl: t.photoThumbUrl ?? null,
            photoUrl: t.photoUrl ?? null,
            aliasesCount: t.aliases?.length ?? 0,
            photosCount: t.photos?.length ?? 0,
            linkedGroup: t.linkedGroup ?? null,
            groupSize: 0,
            projectsCount: t.projects?.length ?? 0,
          };
          const enriched = allTeachers.some(at => at.id === teacherListItem.id)
            ? allTeachers
            : [teacherListItem, ...allTeachers];
          this.linkDialogTeacher.set(teacherListItem);
          this.linkDialogAllTeachers.set(enriched);
          this.showTeacherLinkDialog.set(true);
        },
      });
    };

    if (person.archiveId) {
      doOpen(person.archiveId);
    } else {
      this.projectService.ensurePersonArchive(projectId, person.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            person.archiveId = res.data.archiveId;
            doOpen(res.data.archiveId);
          },
        });
    }
  }

  onTeacherLinked(reload: () => void): void {
    this.showTeacherLinkDialog.set(false);
    reload();
  }

  openPhotoChooser(person: TabloPersonItem): void {
    if (person.linkedGroup) {
      this.teacherService.getLinkedGroupPhotos(person.linkedGroup).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          this.photoChooserPhotos.set(res.data || []);
          this.photoChooserMode.set({ kind: 'linkedGroup', linkedGroup: person.linkedGroup! });
          this.showPhotoChooserDialog.set(true);
        },
      });
    } else if (person.archiveId && (person.photosCount ?? 0) > 1) {
      this.teacherService.getTeacherPhotos(person.archiveId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          this.photoChooserPhotos.set(res.data || []);
          this.photoChooserMode.set({ kind: 'individual', archiveId: person.archiveId!, teacherName: person.name });
          this.showPhotoChooserDialog.set(true);
        },
      });
    }
  }

  onOpenPhotoChooserFromLink(groupId: string): void {
    this.showTeacherLinkDialog.set(false);
    this.teacherService.getLinkedGroupPhotos(groupId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.photoChooserPhotos.set(res.data || []);
        this.photoChooserMode.set({ kind: 'linkedGroup', linkedGroup: groupId });
        this.showPhotoChooserDialog.set(true);
      },
    });
  }

  onPhotoChosen(reload: () => void): void {
    this.showPhotoChooserDialog.set(false);
    reload();
  }

  // --- Szövegtranszformáció (batch) ---

  /**
   * Transzformáció alkalmazása a szűrt személyekre (editData-ban).
   * @param field 'name' | 'title' — melyik mezőre hat
   * @param type a transzformáció típusa
   * @param customValue egyéni érték (trim_start/trim_end-hez)
   * @param filteredPersons az aktuálisan szűrt (látható) személyek
   */
  applyTransform(
    field: 'name' | 'title',
    type: TextTransformType,
    customValue: string,
    filteredPersons: TabloPersonItem[],
  ): void {
    const data = new Map(this.editData());
    const filteredIds = new Set(filteredPersons.map(p => p.id));
    let changed = 0;

    for (const person of filteredPersons) {
      if (!filteredIds.has(person.id)) continue;
      const row = data.get(person.id);
      if (!row) continue;

      const original = row[field];
      const transformed = applyTextTransform(original, type, customValue);
      if (transformed !== original) {
        data.set(person.id, {
          ...row,
          [field]: transformed,
          dirty: transformed !== (field === 'name' ? person.name : (person.title || ''))
            || (field === 'name' ? row.title !== (person.title || '') : row.name !== person.name)
            || row.note !== (person.note || ''),
        });
        changed++;
      }
    }

    this.editData.set(data);
    this.lastTransformCount.set(changed);
  }

  readonly lastTransformCount = signal(0);
}
