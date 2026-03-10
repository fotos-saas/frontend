import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, input, output, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerService } from '../../../services/partner.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import { ElectronService } from '../../../../../core/services/electron.service';
import { PsdStatusService } from '../../../services/psd-status.service';
import { PsInputComponent, PsToggleComponent } from '@shared/components/form';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TIMEOUTS } from '../../../../../shared/constants/timeouts.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { TypeFilter, TabloPersonItem } from '../persons-modal.types';
import { ModalPersonCardComponent } from '../modal-person-card/modal-person-card.component';
import { PhotoLightboxComponent } from '../photo-lightbox/photo-lightbox.component';
import { ConfirmDialogComponent } from '../../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { BatchPortraitDialogComponent } from '../batch-portrait-dialog/batch-portrait-dialog.component';
import { BatchPortraitActionsService } from '../batch-portrait-dialog/batch-portrait-actions.service';
import { BatchCropDialogComponent } from '../batch-crop-dialog/batch-crop-dialog.component';
import {
  LayoutPhotoUploadDialogComponent,
  PhotoUploadPerson,
  PhotoUploadResult,
} from '../../../pages/project-tablo-editor/layout-designer/components/layout-photo-upload-dialog/layout-photo-upload-dialog.component';
import { TeacherLinkDialogComponent } from '../../teacher-link-dialog/teacher-link-dialog.component';
import { TeacherPhotoChooserDialogComponent } from '../../teacher-photo-chooser-dialog/teacher-photo-chooser-dialog.component';
import { getPersonCategory, getCategoryOrder } from '../person-category.util';
import { PersonsModalActionsService } from '../persons-modal-actions.service';
import { TEXT_TRANSFORMS, TextTransformType, TextTransformOption } from '../text-transform.util';

/**
 * Persons Modal - Személyek listája (grid + szerkesztő lista nézet + lightbox).
 */
@Component({
  selector: 'app-persons-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, MatTooltipModule, PsInputComponent, PsToggleComponent, ModalPersonCardComponent, PhotoLightboxComponent, DialogWrapperComponent, LayoutPhotoUploadDialogComponent, ConfirmDialogComponent, BatchPortraitDialogComponent, BatchCropDialogComponent, TeacherLinkDialogComponent, TeacherPhotoChooserDialogComponent],
  providers: [BatchPortraitActionsService, PersonsModalActionsService],
  templateUrl: './persons-modal.component.html',
  styleUrl: './persons-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonsModalComponent implements OnInit {
  readonly ICONS = ICONS;

  readonly projectId = input.required<number>();
  readonly projectName = input<string>('');
  readonly schoolName = input<string | null>(null);
  readonly className = input<string | null>(null);
  readonly initialTypeFilter = input<TypeFilter | undefined>(undefined);

  readonly close = output<void>();
  readonly openUploadWizard = output<TypeFilter>();
  readonly addPersonsRequested = output<'student' | 'teacher'>();
  readonly expandedViewRequested = output<{ projectId: number }>();

  private readonly partnerService = inject(PartnerService);
  private readonly projectService = inject(PartnerProjectService);
  private readonly electronService = inject(ElectronService);
  private readonly psdStatusService = inject(PsdStatusService);
  private readonly destroyRef = inject(DestroyRef);
  readonly batchActions = inject(BatchPortraitActionsService);
  readonly actions = inject(PersonsModalActionsService);

  loading = signal(true);
  allPersons = signal<TabloPersonItem[]>([]);

  // Filters
  typeFilter = signal<TypeFilter>('student');
  showOnlyWithoutPhoto = signal(false);
  searchQuery = signal('');
  filtersOpen = signal(false);

  // Lightbox
  lightboxPerson = signal<TabloPersonItem | null>(null);

  // Fotó feltöltés dialógus
  photoUploadPerson = signal<PhotoUploadPerson | null>(null);

  // Crop beállítás
  cropEnabled = signal(false);

  // Szövegtranszformáció
  readonly transformOptions = TEXT_TRANSFORMS;
  readonly selectedTransform = signal<TextTransformType>('normalize_position');
  readonly transformCustomValue = signal('');
  readonly transformTarget = signal<'name' | 'title'>('title');
  readonly selectedTransformOption = computed(() =>
    TEXT_TRANSFORMS.find(t => t.type === this.selectedTransform()) ?? null
  );

  // Extra nevek (tanítottak még)
  extraNames = signal<{ students: string; teachers: string }>({ students: '', teachers: '' });
  extraNamesDirty = signal(false);
  extraNamesSaving = signal(false);
  extraNamesCopied = signal(false);

  readonly extraNamesInline = computed(() => {
    const text = this.currentExtraText();
    return !text || !text.includes('\n');
  });

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

  readonly activeGroupCount = computed(() =>
    this.allPersons().filter(p => p.type === this.typeFilter()).length
  );
  readonly activeGroupWithoutPhotoCount = computed(() =>
    this.allPersons().filter(p => p.type === this.typeFilter() && !p.hasPhoto).length
  );

  readonly inlineEditPerson = computed(() => {
    const id = this.actions.inlineEditPersonId();
    return id ? this.allPersons().find(p => p.id === id) ?? null : null;
  });

  readonly hasDirtyEdits = computed(() => this.actions.hasDirtyEdits());

  readonly filteredPersons = computed(() => {
    let result = this.allPersons();
    const query = this.searchQuery().trim().toLowerCase();
    const isTeacherTab = this.typeFilter() === 'teacher';
    if (!query) {
      result = result.filter(p => p.type === this.typeFilter());
    } else {
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }
    if (this.showOnlyWithoutPhoto()) {
      result = result.filter(p => !p.hasPhoto);
    }
    if (isTeacherTab) {
      result = [...result].sort((a, b) =>
        getCategoryOrder(getPersonCategory(a.title)) - getCategoryOrder(getPersonCategory(b.title))
      );
    }
    return result;
  });

  readonly personsWithPhotos = computed(() => this.filteredPersons().filter(p => p.photoUrl || p.photoThumbUrl));

  /** PSD óta változott fotóval rendelkező személy ID-k */
  readonly changedPersonIds = computed(() =>
    this.psdStatusService.getChangedPersonIds(this.projectId())
  );

  readonly emptyState = computed(() => {
    if (this.searchQuery()) return { title: 'Nincs találat', text: 'Próbálj más keresési kifejezéssel!' };
    if (this.showOnlyWithoutPhoto()) return { title: 'Mindenkinél megvan a kép', text: 'Minden személynek van feltöltött képe.' };
    return { title: 'Nincsenek személyek', text: 'Ehhez a projekthez nincs regisztrálva személy.' };
  });

  readonly currentExtraText = computed(() => {
    const en = this.extraNames();
    return this.typeFilter() === 'teacher' ? en.teachers : en.students;
  });

  get isElectron(): boolean { return this.electronService.isElectron; }

  ngOnInit(): void {
    const initial = this.initialTypeFilter();
    if (initial) this.typeFilter.set(initial);
    this.loadPersons();
    if (this.isElectron) {
      this.partnerService.getCropSettings().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => { if (res.success) this.cropEnabled.set(res.data.enabled); },
      });
      // PSD fotóváltozás friss lekérése (projektContext-tel, ha nincs cache)
      this.psdStatusService.refreshPhotoChanges(this.projectId(), {
        name: this.projectName(),
        schoolName: this.schoolName(),
        className: this.className(),
      });
    }
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

  // --- Fotó feltöltés / lightbox ---

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

  updatePersonInList(personId: number, patch: Partial<TabloPersonItem>): void {
    this.allPersons.set(this.allPersons().map(p => p.id === personId ? { ...p, ...patch } : p));
  }

  // --- Extra nevek ---

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

  setExtraNamesFormat(inline: boolean): void {
    const field = this.typeFilter() === 'teacher' ? 'teachers' : 'students';
    const text = this.extraNames()[field];
    if (inline) {
      this.onExtraNamesChange(field, text.split('\n').map(n => n.trim()).filter(Boolean).join(', '));
    } else {
      this.onExtraNamesChange(field, text.split(',').map(n => n.trim()).filter(Boolean).join('\n'));
    }
  }

  copyExtraNames(): void {
    const text = this.currentExtraText();
    if (!text) return;
    navigator.clipboard.writeText(text);
    this.extraNamesCopied.set(true);
    setTimeout(() => this.extraNamesCopied.set(false), TIMEOUTS.ID_COPY_FEEDBACK);
  }

  // --- Szövegtranszformáció ---

  applyTransform(): void {
    const opt = this.selectedTransformOption();
    if (!opt) return;
    this.actions.applyTransform(
      this.transformTarget(),
      this.selectedTransform(),
      this.transformCustomValue(),
      this.filteredPersons(),
    );
  }

  // --- Kijelölés / kártya kattintás ---

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'a' && !this.actions.editMode()) {
      event.preventDefault();
      this.selectAll();
    }
  }

  selectAll(): void {
    const persons = this.filteredPersons();
    if (persons.length === 0) return;
    const allSelected = persons.every(p => this.batchActions.selectedPersonIds().has(p.id));
    if (allSelected) {
      this.batchActions.resetSelection();
    } else {
      this.batchActions.selectedPersonIds.set(new Set(persons.map(p => p.id)));
    }
  }

  onCardClick(person: TabloPersonItem, event: MouseEvent): void {
    if (event.metaKey || event.ctrlKey) {
      this.batchActions.togglePersonSelection(person.id);
    } else if (this.batchActions.selectedCount() > 0) {
      this.batchActions.resetSelection();
    } else {
      this.openLightbox(person);
    }
  }

  // --- Bővített tanári nézet ---

  openExpandedView(): void {
    this.expandedViewRequested.emit({ projectId: this.projectId() });
    this.close.emit();
  }
}
