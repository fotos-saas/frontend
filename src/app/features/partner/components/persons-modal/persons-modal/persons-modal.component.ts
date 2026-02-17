import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService } from '../../../services/partner.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import { PsToggleComponent } from '@shared/components/form';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { TypeFilter, TabloPersonItem } from '../persons-modal.types';
import { ModalPersonCardComponent } from '../modal-person-card/modal-person-card.component';
import { PhotoLightboxComponent } from '../photo-lightbox/photo-lightbox.component';

/**
 * Persons Modal - Személyek listája modal (grid nézet thumbnail-ekkel + lightbox).
 */
@Component({
  selector: 'app-persons-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsToggleComponent, ModalPersonCardComponent, PhotoLightboxComponent, DialogWrapperComponent],
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
  readonly openUploadWizard = output<void>();

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

  // Lightbox
  lightboxPerson = signal<TabloPersonItem | null>(null);

  readonly hasActiveFilter = computed(() => !!this.searchQuery() || this.showOnlyWithoutPhoto());

  /** Mobilon rövidített projektnév: csak osztály + évfolyam (a " - " utáni rész) */
  readonly shortProjectName = computed(() => {
    const name = this.projectName();
    const idx = name.indexOf(' - ');
    return idx >= 0 ? name.substring(idx + 3) : name;
  });

  // Computed counts
  readonly allCount = computed(() => this.allPersons().length);
  readonly studentCount = computed(() => this.allPersons().filter(p => p.type === 'student').length);
  readonly teacherCount = computed(() => this.allPersons().filter(p => p.type === 'teacher').length);
  readonly withoutPhotoCount = computed(() => this.allPersons().filter(p => !p.hasPhoto).length);

  // Filtered persons — keresés mindkét típusban keres, tab nélkül szűri a típust
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

  // Persons with photos for lightbox navigation
  readonly personsWithPhotos = computed(() => this.filteredPersons().filter(p => p.photoUrl));

  // Empty state computed
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

  ngOnInit(): void {
    const initial = this.initialTypeFilter();
    if (initial) {
      this.typeFilter.set(initial);
    }
    this.loadPersons();
  }

  loadPersons(): void {
    this.loading.set(true);
    this.partnerService.getProjectPersons(this.projectId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.allPersons.set(response.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        }
      });
  }

  openLightbox(person: TabloPersonItem): void {
    if (person.photoUrl) {
      this.lightboxPerson.set(person);
    }
  }

  closeLightbox(): void {
    this.lightboxPerson.set(null);
  }

  resetOverride(person: TabloPersonItem): void {
    this.projectService.resetPersonPhoto(this.projectId(), person.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          const updated = this.allPersons().map(p =>
            p.id === person.id
              ? { ...p, hasOverride: false, hasPhoto: res.data.hasPhoto, photoThumbUrl: res.data.photoThumbUrl, photoUrl: res.data.photoUrl }
              : p
          );
          this.allPersons.set(updated);
        }
      });
  }
}
