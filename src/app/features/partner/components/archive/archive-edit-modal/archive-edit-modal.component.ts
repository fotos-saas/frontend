import { Component, input, output, inject, signal, computed, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ARCHIVE_SERVICE, ArchiveConfig, ArchiveField, CreateArchivePayload, UpdateArchivePayload } from '../../../models/archive.models';
import { SchoolItem } from '../../../models/partner.models';
import { PsSearchableSelectComponent, PsCheckboxComponent, PsInputComponent, SelectOption } from '@shared/components/form';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

@Component({
  selector: 'app-archive-edit-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsSearchableSelectComponent, PsCheckboxComponent, PsInputComponent, DialogWrapperComponent],
  templateUrl: './archive-edit-modal.component.html',
  styleUrl: './archive-edit-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchiveEditModalComponent {
  private readonly archiveService = inject(ARCHIVE_SERVICE);
  private readonly destroyRef = inject(DestroyRef);

  readonly config = input.required<ArchiveConfig>();
  readonly archiveItem = input<{ id: number; canonicalName: string; schoolId: number; photoThumbUrl?: string | null } | null>(null);
  readonly mode = input<'create' | 'edit'>('create');
  readonly schools = input<SchoolItem[]>([]);
  readonly prefillName = input('');
  readonly prefillSchoolId = input<number | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly ICONS = ICONS;

  schoolOptions = computed<SelectOption[]>(() =>
    this.schools().map(s => ({ id: s.id, label: s.name, sublabel: s.city ?? undefined }))
  );

  canonicalName = '';
  extraFieldValues: Record<string, string> = {};
  schoolId: number | null = null;
  notes = '';
  aliases = signal<string[]>([]);
  currentPhotoUrl = signal<string | null>(null);
  selectedFile: File | null = null;
  photoPreviewUrl = signal<string | null>(null);
  photoYear = new Date().getFullYear();
  setPhotoActive = true;
  uploading = signal(false);

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    // Extra mezők inicializálása
    for (const field of this.config().extraFields) {
      this.extraFieldValues[field.name] = '';
    }

    const item = this.archiveItem();
    if (item && this.mode() === 'edit') {
      this.canonicalName = item.canonicalName;
      this.schoolId = item.schoolId;
      this.currentPhotoUrl.set(item.photoThumbUrl ?? null);
      this.loadDetail(item.id);
    } else if (this.prefillName()) {
      this.canonicalName = this.prefillName();
      if (this.prefillSchoolId()) {
        this.schoolId = this.prefillSchoolId();
      }
    }
  }

  private loadDetail(id: number): void {
    this.loading.set(true);
    this.archiveService.getArchive(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.data) {
            // Extra mezők kitöltése a detail adatokból (dinamikus hozzáférés)
            const data = res.data as unknown as Record<string, unknown>;
            for (const field of this.config().extraFields) {
              this.extraFieldValues[field.name] = (data[field.name] as string) ?? '';
            }
            this.notes = res.data.notes ?? '';
            this.aliases.set((res.data.aliases ?? []).map(a => a.aliasName));
            if (res.data.photoUrl) {
              this.currentPhotoUrl.set(res.data.photoUrl);
            }
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.photoPreviewUrl.set(URL.createObjectURL(this.selectedFile));
      this.errorMessage.set(null);
    }
  }

  removeSelectedPhoto(): void {
    this.selectedFile = null;
    this.photoPreviewUrl.set(null);
  }

  onSchoolChange(value: string): void {
    this.schoolId = value ? parseInt(value, 10) : null;
  }

  save(): void {
    if (!this.canonicalName.trim() || !this.schoolId || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload: Record<string, unknown> = {
      canonical_name: this.canonicalName.trim(),
      school_id: this.schoolId,
      aliases: this.aliases().length > 0 ? this.aliases() : undefined,
      notes: this.notes.trim() || null,
    };

    // Extra mezők hozzáadása
    for (const field of this.config().extraFields) {
      payload[field.name] = this.extraFieldValues[field.name]?.trim() || null;
    }

    const request$ = this.mode() === 'create'
      ? this.archiveService.createArchive(payload as unknown as CreateArchivePayload)
      : this.archiveService.updateArchive(this.archiveItem()!.id, payload as unknown as UpdateArchivePayload);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.success) {
          const archiveId = response.data?.id ?? this.archiveItem()?.id;
          if (this.selectedFile && archiveId) {
            this.uploadPhotoAfterSave(archiveId);
          } else {
            this.saving.set(false);
            this.saved.emit();
          }
        } else {
          this.saving.set(false);
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      },
    });
  }

  private uploadPhotoAfterSave(archiveId: number): void {
    this.uploading.set(true);
    this.archiveService.uploadPhoto(
      archiveId,
      this.selectedFile!,
      this.photoYear,
      this.setPhotoActive,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.uploading.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.uploading.set(false);
          this.errorMessage.set(err.error?.message || 'Mentés sikeres, de a fotó feltöltése nem sikerült.');
        },
      });
  }
}
