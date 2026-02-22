import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerService } from '../../../services/partner.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import { PsToggleComponent } from '@shared/components/form';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { TypeFilter, TabloPersonItem } from '../persons-modal.types';
import { ModalPersonCardComponent } from '../modal-person-card/modal-person-card.component';
import { PhotoLightboxComponent } from '../photo-lightbox/photo-lightbox.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  LayoutPhotoUploadDialogComponent,
  PhotoUploadPerson,
  PhotoUploadResult,
} from '../../../pages/project-tablo-editor/layout-designer/components/layout-photo-upload-dialog/layout-photo-upload-dialog.component';

/** Szerkesztési sor state */
interface EditRow {
  name: string;
  title: string;
  note: string;
  dirty: boolean;
  saving: boolean;
}

/**
 * Persons Modal - Személyek listája (grid + szerkesztő lista nézet + lightbox).
 */
@Component({
  selector: 'app-persons-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, PsToggleComponent, ModalPersonCardComponent, PhotoLightboxComponent, DialogWrapperComponent, LayoutPhotoUploadDialogComponent, ConfirmDialogComponent],
  templateUrl: './persons-modal.component.html',
  styleUrl: './persons-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonsModalComponent implements OnInit {
  readonly ICONS = ICONS;

  readonly projectId = input.required<number>();
  readonly projectName = input<string>('');
  readonly initialTypeFilter = input<TypeFilter | undefined>(undefined);

  readonly close = output<void>();
  readonly openUploadWizard = output<TypeFilter>();

  private partnerService = inject(PartnerService);
  private projectService = inject(PartnerProjectService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  allPersons = signal<TabloPersonItem[]>([]);

  // Filters
  typeFilter = signal<TypeFilter>('student');
  showOnlyWithoutPhoto = signal(false);
  searchQuery = signal('');
  filtersOpen = signal(false);

  // Szerkesztés mód
  editMode = signal(false);
  editData = signal<Map<number, EditRow>>(new Map());

  // Lightbox
  lightboxPerson = signal<TabloPersonItem | null>(null);

  // Fotó feltöltés dialógus
  photoUploadPerson = signal<PhotoUploadPerson | null>(null);

  // Törlés megerősítés
  deleteConfirmPerson = signal<TabloPersonItem | null>(null);

  // Extra nevek (tanítottak még)
  extraNames = signal<{ students: string; teachers: string }>({ students: '', teachers: '' });
  extraNamesDirty = signal(false);
  extraNamesSaving = signal(false);
  extraNamesInline = signal(true); // true = sorban (vesszővel), false = egymás alatt

  readonly hasInitialFilter = computed(() => !!this.initialTypeFilter());
  readonly hasActiveFilter = computed(() => !!this.searchQuery() || this.showOnlyWithoutPhoto());

  readonly shortProjectName = computed(() => {
    const name = this.projectName(), i = name.lastIndexOf(' - ');
    return i >= 0 ? name.substring(0, i) : name;
  });

  readonly allCount = computed(() => this.allPersons().length);
  readonly studentCount = computed(() => this.allPersons().filter(p => p.type === 'student').length);
  readonly teacherCount = computed(() => this.allPersons().filter(p => p.type === 'teacher').length);
  readonly withoutPhotoCount = computed(() => this.allPersons().filter(p => !p.hasPhoto).length);

  readonly filteredPersons = computed(() => {
    let result = this.allPersons();
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      result = result.filter(p => p.type === this.typeFilter());
    } else {
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }
    if (this.showOnlyWithoutPhoto()) {
      result = result.filter(p => !p.hasPhoto);
    }
    return result;
  });

  readonly personsWithPhotos = computed(() => this.filteredPersons().filter(p => p.photoUrl || p.photoThumbUrl));

  readonly emptyState = computed(() => {
    if (this.searchQuery()) return { title: 'Nincs találat', text: 'Próbálj más keresési kifejezéssel!' };
    if (this.showOnlyWithoutPhoto()) return { title: 'Mindenkinél megvan a kép', text: 'Minden személynek van feltöltött képe.' };
    return { title: 'Nincsenek személyek', text: 'Ehhez a projekthez nincs regisztrálva személy.' };
  });

  readonly currentExtraText = computed(() => {
    const en = this.extraNames();
    return this.typeFilter() === 'teacher' ? en.teachers : en.students;
  });

  readonly hasDirtyEdits = computed(() => {
    const data = this.editData();
    for (const row of data.values()) {
      if (row.dirty) return true;
    }
    return false;
  });

  ngOnInit(): void {
    const initial = this.initialTypeFilter();
    if (initial) this.typeFilter.set(initial);
    this.loadPersons();
  }

  loadPersons(silent = false): void {
    if (!silent) this.loading.set(true);
    this.partnerService.getProjectPersons(this.projectId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (r) => {
        this.allPersons.set(r.data);
        if (r.extraNames) { this.extraNames.set(r.extraNames); this.extraNamesDirty.set(false); }
        if (!silent) this.loading.set(false);
      },
      error: () => { if (!silent) this.loading.set(false); },
    });
  }

  toggleEditMode(): void {
    if (this.editMode()) { this.editMode.set(false); this.editData.set(new Map()); return; }
    const map = new Map<number, EditRow>();
    for (const p of this.filteredPersons()) map.set(p.id, { name: p.name, title: p.title || '', note: p.note || '', dirty: false, saving: false });
    this.editData.set(map);
    this.editMode.set(true);
  }

  private isDirty(row: EditRow, person: TabloPersonItem | undefined): boolean {
    if (!person) return false;
    return row.name !== person.name || row.title !== (person.title || '') || row.note !== (person.note || '');
  }

  onEditFieldChange(personId: number, field: 'name' | 'title' | 'note', value: string): void {
    const data = new Map(this.editData());
    const row = data.get(personId);
    if (!row) return;
    const person = this.allPersons().find(p => p.id === personId);
    const updated = { ...row, [field]: value };
    data.set(personId, { ...updated, dirty: this.isDirty(updated, person) });
    this.editData.set(data);
  }

  getEditRow(personId: number): EditRow | undefined {
    return this.editData().get(personId);
  }

  saveRow(personId: number): void {
    const row = this.editData().get(personId);
    if (!row?.dirty || row.saving || !row.name.trim()) return;

    this.setEditRow(personId, { ...row, saving: true });
    this.projectService.updatePerson(this.projectId(), personId, {
      name: row.name.trim(), title: row.title.trim() || null, note: row.note.trim() || null,
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.updatePersonInList(personId, { name: res.data.name, title: res.data.title, note: res.data.note });
        this.setEditRow(personId, { name: res.data.name, title: res.data.title || '', note: res.data.note || '', dirty: false, saving: false });
      },
      error: () => {
        const r = this.editData().get(personId);
        if (r) this.setEditRow(personId, { ...r, saving: false });
      },
    });
  }

  private setEditRow(personId: number, row: EditRow): void {
    const data = new Map(this.editData());
    data.set(personId, row);
    this.editData.set(data);
  }

  saveAllDirty(): void {
    for (const [id, row] of this.editData()) { if (row.dirty && !row.saving) this.saveRow(id); }
  }

  openPhotoUploadDialog(person: TabloPersonItem): void {
    this.photoUploadPerson.set({ id: person.id, name: person.name, type: person.type as 'student' | 'teacher', archiveId: person.archiveId ?? null });
  }

  closePhotoUploadDialog(): void { this.photoUploadPerson.set(null); this.loadPersons(true); }

  onPhotoUploaded(result: PhotoUploadResult): void {
    this.updatePersonInList(result.personId, { hasPhoto: true, photoThumbUrl: result.thumbUrl, photoUrl: result.photoUrl, hasOverride: result.isOverride });
    this.photoUploadPerson.set(null);
  }

  openLightbox(person: TabloPersonItem): void {
    if (person.photoUrl || person.photoThumbUrl) this.lightboxPerson.set(person);
  }

  closeLightbox(): void { this.lightboxPerson.set(null); }

  onPhotoChanged(event: { personId: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean }): void {
    this.updatePersonInList(event.personId, event);
    const current = this.lightboxPerson();
    if (current?.id === event.personId) {
      this.lightboxPerson.set(this.allPersons().find(p => p.id === event.personId) || null);
    }
  }

  private updatePersonInList(personId: number, patch: Partial<TabloPersonItem>): void {
    this.allPersons.set(this.allPersons().map(p => p.id === personId ? { ...p, ...patch } : p));
  }

  // --- Személy törlés ---
  deletePerson(person: TabloPersonItem): void {
    this.deleteConfirmPerson.set(person);
  }

  confirmDeletePerson(): void {
    const person = this.deleteConfirmPerson();
    if (!person) return;
    this.projectService.deletePerson(this.projectId(), person.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.allPersons.set(this.allPersons().filter(p => p.id !== person.id));
          const data = new Map(this.editData()); data.delete(person.id); this.editData.set(data);
          this.deleteConfirmPerson.set(null);
        },
        error: () => this.deleteConfirmPerson.set(null),
      });
  }

  cancelDeletePerson(): void { this.deleteConfirmPerson.set(null); }

  // --- Extra nevek (tanítottak még) ---
  onExtraNamesChange(field: 'students' | 'teachers', value: string): void {
    this.extraNames.set({ ...this.extraNames(), [field]: value });
    this.extraNamesDirty.set(true);
  }

  saveExtraNames(): void {
    if (!this.extraNamesDirty() || this.extraNamesSaving()) return;
    this.extraNamesSaving.set(true);
    this.projectService.updateExtraNames(this.projectId(), this.extraNames())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => { this.extraNames.set(res.data.extraNames); this.extraNamesDirty.set(false); this.extraNamesSaving.set(false); },
        error: () => this.extraNamesSaving.set(false),
      });
  }

  sortExtraNamesAbc(): void {
    const field = this.typeFilter() === 'teacher' ? 'teachers' : 'students';
    const text = this.extraNames()[field];
    const sep = text.includes('\n') ? '\n' : ', ';
    const names = text.split(sep).map(n => n.trim()).filter(Boolean);
    const sorted = names.sort((a, b) => a.localeCompare(b, 'hu'));
    this.onExtraNamesChange(field, sorted.join(sep));
  }

  toggleExtraNamesFormat(): void {
    const field = this.typeFilter() === 'teacher' ? 'teachers' : 'students';
    const text = this.extraNames()[field];
    const isInline = !text.includes('\n');
    if (isInline) {
      this.onExtraNamesChange(field, text.split(',').map(n => n.trim()).filter(Boolean).join('\n'));
    } else {
      this.onExtraNamesChange(field, text.split('\n').map(n => n.trim()).filter(Boolean).join(', '));
    }
    this.extraNamesInline.set(!isInline);
  }

  copyExtraNames(): void {
    const text = this.currentExtraText();
    if (text) navigator.clipboard.writeText(text);
  }
}
