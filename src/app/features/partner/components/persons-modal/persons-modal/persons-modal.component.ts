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
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, PsToggleComponent, ModalPersonCardComponent, PhotoLightboxComponent, DialogWrapperComponent, LayoutPhotoUploadDialogComponent],
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

  readonly hasInitialFilter = computed(() => !!this.initialTypeFilter());
  readonly hasActiveFilter = computed(() => !!this.searchQuery() || this.showOnlyWithoutPhoto());

  readonly shortProjectName = computed(() => {
    const name = this.projectName();
    const lastIdx = name.lastIndexOf(' - ');
    return lastIdx >= 0 ? name.substring(0, lastIdx) : name;
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

  readonly emptyStateTitle = computed(() => {
    if (this.searchQuery()) return 'Nincs találat';
    if (this.showOnlyWithoutPhoto()) return 'Mindenkinél megvan a kép';
    return 'Nincsenek személyek';
  });

  readonly emptyStateText = computed(() => {
    if (this.searchQuery()) return 'Próbálj más keresési kifejezéssel!';
    if (this.showOnlyWithoutPhoto()) return 'Minden személynek van feltöltött képe.';
    return 'Ehhez a projekthez nincs regisztrálva személy.';
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
    if (initial) {
      this.typeFilter.set(initial);
    }
    this.loadPersons();
  }

  loadPersons(silent = false): void {
    if (!silent) this.loading.set(true);
    this.partnerService.getProjectPersons(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.allPersons.set(response.data);
          if (!silent) this.loading.set(false);
        },
        error: () => {
          if (!silent) this.loading.set(false);
        }
      });
  }

  toggleEditMode(): void {
    if (this.editMode()) {
      this.editMode.set(false);
      this.editData.set(new Map());
    } else {
      this.initEditData();
      this.editMode.set(true);
    }
  }

  private initEditData(): void {
    const map = new Map<number, EditRow>();
    for (const p of this.filteredPersons()) {
      map.set(p.id, { name: p.name, title: p.title || '', note: p.note || '', dirty: false, saving: false });
    }
    this.editData.set(map);
  }

  private isDirty(row: EditRow, person: TabloPersonItem | undefined): boolean {
    if (!person) return false;
    return row.name !== person.name || row.title !== (person.title || '') || row.note !== (person.note || '');
  }

  onEditNameChange(personId: number, value: string): void {
    const data = new Map(this.editData());
    const row = data.get(personId);
    if (!row) return;
    const person = this.allPersons().find(p => p.id === personId);
    const updated = { ...row, name: value };
    data.set(personId, { ...updated, dirty: this.isDirty(updated, person) });
    this.editData.set(data);
  }

  onEditTitleChange(personId: number, value: string): void {
    const data = new Map(this.editData());
    const row = data.get(personId);
    if (!row) return;
    const person = this.allPersons().find(p => p.id === personId);
    const updated = { ...row, title: value };
    data.set(personId, { ...updated, dirty: this.isDirty(updated, person) });
    this.editData.set(data);
  }

  onEditNoteChange(personId: number, value: string): void {
    const data = new Map(this.editData());
    const row = data.get(personId);
    if (!row) return;
    const person = this.allPersons().find(p => p.id === personId);
    const updated = { ...row, note: value };
    data.set(personId, { ...updated, dirty: this.isDirty(updated, person) });
    this.editData.set(data);
  }

  getEditRow(personId: number): EditRow | undefined {
    return this.editData().get(personId);
  }

  saveRow(personId: number): void {
    const row = this.editData().get(personId);
    if (!row || !row.dirty || row.saving) return;
    const name = row.name.trim();
    if (!name) return;

    const data = new Map(this.editData());
    data.set(personId, { ...row, saving: true });
    this.editData.set(data);

    this.projectService.updatePerson(this.projectId(), personId, {
      name,
      title: row.title.trim() || null,
      note: row.note.trim() || null,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const updated = this.allPersons().map(p =>
            p.id === personId ? { ...p, name: res.data.name, title: res.data.title, note: res.data.note } : p
          );
          this.allPersons.set(updated);
          const newData = new Map(this.editData());
          newData.set(personId, {
            name: res.data.name, title: res.data.title || '', note: res.data.note || '',
            dirty: false, saving: false,
          });
          this.editData.set(newData);
        },
        error: () => {
          const newData = new Map(this.editData());
          const r = newData.get(personId);
          if (r) newData.set(personId, { ...r, saving: false });
          this.editData.set(newData);
        }
      });
  }

  saveAllDirty(): void {
    const data = this.editData();
    for (const [personId, row] of data) {
      if (row.dirty && !row.saving) {
        this.saveRow(personId);
      }
    }
  }

  // --- Fotó feltöltés dialógus ---
  openPhotoUploadDialog(person: TabloPersonItem): void {
    this.photoUploadPerson.set({
      id: person.id,
      name: person.name,
      type: person.type as 'student' | 'teacher',
      archiveId: person.archiveId ?? null,
    });
  }

  closePhotoUploadDialog(): void {
    this.photoUploadPerson.set(null);
    this.loadPersons(true);
  }

  onPhotoUploaded(result: PhotoUploadResult): void {
    const updated = this.allPersons().map(p =>
      p.id === result.personId
        ? { ...p, hasPhoto: true, photoThumbUrl: result.thumbUrl, photoUrl: result.photoUrl, hasOverride: result.isOverride }
        : p
    );
    this.allPersons.set(updated);
    this.photoUploadPerson.set(null);
  }

  openLightbox(person: TabloPersonItem): void {
    if (person.photoUrl || person.photoThumbUrl) {
      this.lightboxPerson.set(person);
    }
  }

  closeLightbox(): void {
    this.lightboxPerson.set(null);
  }

  onPhotoChanged(event: { personId: number; hasPhoto: boolean; photoThumbUrl: string | null; photoUrl: string | null; hasOverride: boolean }): void {
    const updated = this.allPersons().map(p =>
      p.id === event.personId
        ? { ...p, hasPhoto: event.hasPhoto, photoThumbUrl: event.photoThumbUrl, photoUrl: event.photoUrl, hasOverride: event.hasOverride }
        : p
    );
    this.allPersons.set(updated);
    const current = this.lightboxPerson();
    if (current && current.id === event.personId) {
      this.lightboxPerson.set(updated.find(p => p.id === event.personId) || null);
    }
  }
}
