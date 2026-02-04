import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../shared/constants/icons.constants';
import {
  UploadedPhoto,
  TabloPersonItem,
  MatchResult,
  PhotoAssignment
} from '../../services/partner.service';
import { SamplesLightboxComponent, SampleLightboxItem } from '../../../../shared/components/samples-lightbox';
import {
  PersonWithPhoto,
  ReviewStatsBarComponent,
  ReviewFilterTabsComponent,
  ReviewSearchBoxComponent,
  ReviewPersonCardComponent,
  ReviewUnassignedPanelComponent,
  TypeFilter
} from './step-review/index';

/**
 * Step Review - Parkolópálya drag & drop párosítás.
 * Refaktorált verzió alkomponensekkel.
 */
@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [
    CommonModule,
    DragDropModule,
    LucideAngularModule,
    SamplesLightboxComponent,
    ReviewStatsBarComponent,
    ReviewFilterTabsComponent,
    ReviewSearchBoxComponent,
    ReviewPersonCardComponent,
    ReviewUnassignedPanelComponent
  ],
  template: `
    <div class="step-review">
      <!-- Stats Bar -->
      <app-review-stats-bar
        [assignedCount]="assignedCount()"
        [missingCount]="missingCount()"
        [unassignedCount]="unassignedPhotos().length"
      />

      <!-- Type Filter Tabs -->
      <app-review-filter-tabs
        [(selected)]="typeFilter"
        [studentStats]="studentStats()"
        [teacherStats]="teacherStats()"
      />

      <!-- Search -->
      <app-review-search-box [(query)]="searchQuery" />

      <!-- HIÁNYZÓ SZEMÉLYEK (akiknek NINCS képük) -->
      @if (missingPersonsList().length > 0) {
        <div class="section section--missing">
          <h4 class="section-title section-title--warning">
            <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
            Hiányzik ({{ missingPersonsList().length }})
            <span class="section-hint">Húzd ide a megfelelő képet</span>
          </h4>
          <div class="persons-grid">
            @for (person of missingPersonsList(); track person.id; let i = $index) {
              <app-review-person-card
                [person]="person"
                [animationDelay]="i * 0.02 + 's'"
                [connectedDropLists]="allDropListIds()"
                (photoClick)="openLightbox($event)"
                (removeClick)="removeAssignment(person)"
                (drop)="onDropOnPersonCard($event, person)"
              />
            }
          </div>
        </div>
      }

      <!-- PÁROSÍTOTT SZEMÉLYEK (akiknek VAN képük) -->
      @if (pairedPersons().length > 0) {
        <div class="section section--paired">
          <h4 class="section-title section-title--success">
            <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="16" />
            Párosítva ({{ pairedPersons().length }})
            <span class="section-hint">Húzz új képet a cseréhez</span>
          </h4>
          <div class="persons-grid persons-grid--paired">
            @for (person of pairedPersons(); track person.id; let i = $index) {
              <app-review-person-card
                [person]="person"
                [animationDelay]="i * 0.02 + 's'"
                [connectedDropLists]="allDropListIds()"
                (photoClick)="openLightbox($event)"
                (removeClick)="removeAssignment(person)"
                (drop)="onDropOnPersonCard($event, person)"
              />
            }
          </div>
        </div>
      }

      <!-- Empty State -->
      @if (filteredPersonsWithPhotos().length === 0 && searchQuery()) {
        <div class="empty-state">
          <lucide-icon [name]="ICONS.SEARCH" [size]="32" />
          <p>Nincs találat: "{{ searchQuery() }}"</p>
        </div>
      }

      <!-- Unassigned Photos Panel -->
      @if (unassignedPhotos().length > 0) {
        <app-review-unassigned-panel
          [photos]="unassignedPhotos()"
          [connectedDropLists]="allDropListIds()"
          (photoClick)="openLightbox($event)"
          (deleteAll)="deleteAllUnassigned.emit()"
          (drop)="onDropOnUnassigned($event)"
        />
      }

      <!-- All Assigned Message -->
      @if (unassignedPhotos().length === 0 && assignedCount() > 0) {
        <div class="all-assigned-message">
          <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="20" />
          <span>Minden kép párosítva!</span>
        </div>
      }
    </div>

    <!-- Lightbox -->
    @if (lightboxOpen()) {
      <app-samples-lightbox
        [samples]="lightboxItems()"
        [currentIndex]="lightboxIndex()"
        (close)="closeLightbox()"
        (navigate)="onLightboxNavigate($event)"
      />
    }
  `,
  styles: [`
    .step-review {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0 0 12px 0;
      padding: 8px 12px;
      border-radius: 8px;
    }

    .section-title--success {
      background: #d1fae5;
      color: #065f46;
    }

    .section-title--warning {
      background: #fef3c7;
      color: #92400e;
    }

    .section-hint {
      font-size: 0.75rem;
      font-weight: 400;
      opacity: 0.8;
      margin-left: auto;
    }

    .persons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, 150px);
      gap: 12px;
      justify-content: center;
    }

    .persons-grid--paired {
      grid-template-columns: repeat(auto-fill, 120px);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #64748b;
    }

    .empty-state p {
      margin: 12px 0 0;
      font-size: 0.875rem;
    }

    .all-assigned-message {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px;
      background: #d1fae5;
      border-radius: 8px;
      color: #065f46;
      font-size: 0.875rem;
      font-weight: 500;
    }

    @media (max-width: 480px) {
      .persons-grid {
        grid-template-columns: repeat(auto-fill, 120px);
        gap: 8px;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepReviewComponent {
  readonly ICONS = ICONS;

  // === INPUTS ===
  readonly projectId = input.required<number>();
  readonly persons = input<TabloPersonItem[]>([]);
  readonly matchResult = input<MatchResult | null>(null);
  readonly uploadedPhotos = input<UploadedPhoto[]>([]);
  readonly assignments = input<PhotoAssignment[]>([]);
  readonly unassignedPhotos = input<UploadedPhoto[]>([]);
  readonly saving = input(false);

  // === OUTPUTS ===
  readonly assignmentsChange = output<PhotoAssignment[]>();
  readonly finalize = output<void>();
  readonly deleteAllUnassigned = output<void>();

  // === STATE ===
  searchQuery = signal('');
  typeFilter = signal<TypeFilter>('student');

  // Lightbox
  lightboxOpen = signal(false);
  lightboxIndex = signal(0);

  // === COMPUTED ===

  readonly personsWithPhotos = computed<PersonWithPhoto[]>(() => {
    return this.persons().map(person => {
      const assignment = this.assignments().find(a => a.personId === person.id);
      const assignedPhoto = assignment
        ? this.uploadedPhotos().find(p => p.mediaId === assignment.mediaId) ?? null
        : null;

      const match = this.matchResult()?.matches.find(m =>
        m.name === person.name && m.mediaId === assignment?.mediaId
      );

      return {
        ...person,
        assignedPhoto,
        matchConfidence: match?.confidence ?? null,
        hasExistingPhoto: person.hasPhoto
      };
    });
  });

  readonly pairedPersons = computed(() => {
    return this.applyFilters(this.personsWithPhotos())
      .filter(p => p.assignedPhoto || p.hasExistingPhoto);
  });

  readonly missingPersonsList = computed(() => {
    return this.applyFilters(this.personsWithPhotos())
      .filter(p => !p.assignedPhoto && !p.hasExistingPhoto);
  });

  readonly allDropListIds = computed(() => {
    const pairedIds = this.pairedPersons().map(p => `person-${p.id}`);
    const missingIds = this.missingPersonsList().map(p => `person-${p.id}`);
    return [...pairedIds, ...missingIds, 'unassigned-list'];
  });

  readonly lightboxItems = computed<SampleLightboxItem[]>(() => {
    return this.uploadedPhotos().map(photo => ({
      id: photo.mediaId,
      url: photo.fullUrl,
      thumbUrl: photo.thumbUrl,
      fileName: photo.filename,
      createdAt: new Date().toISOString()
    }));
  });

  readonly filteredPersonsWithPhotos = computed(() => {
    return this.applyFilters(this.personsWithPhotos());
  });

  readonly studentStats = computed(() => {
    const students = this.personsWithPhotos().filter(p => p.type === 'student');
    return {
      total: students.length,
      assigned: students.filter(s => s.assignedPhoto || s.hasExistingPhoto).length
    };
  });

  readonly teacherStats = computed(() => {
    const teachers = this.personsWithPhotos().filter(p => p.type === 'teacher');
    return {
      total: teachers.length,
      assigned: teachers.filter(t => t.assignedPhoto || t.hasExistingPhoto).length
    };
  });

  readonly assignedCount = computed(() => {
    return this.applyFilters(this.personsWithPhotos())
      .filter(p => p.assignedPhoto || p.hasExistingPhoto).length;
  });

  readonly missingCount = computed(() => {
    return this.applyFilters(this.personsWithPhotos())
      .filter(p => !p.assignedPhoto && !p.hasExistingPhoto).length;
  });

  // === METHODS ===

  private applyFilters(persons: PersonWithPhoto[]): PersonWithPhoto[] {
    let result = persons;

    // Type filter
    const typeF = this.typeFilter();
    if (typeF !== 'all') {
      result = result.filter(p => p.type === typeF);
    }

    // Search filter
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    return result;
  }

  onDropOnPersonCard(event: CdkDragDrop<any>, targetPerson: PersonWithPhoto): void {
    const draggedItem = event.item.data;

    if (this.isUploadedPhoto(draggedItem)) {
      this.assignPhotoToPerson(draggedItem.mediaId, targetPerson.id);
      return;
    }

    if (this.isPersonWithPhoto(draggedItem) && draggedItem.assignedPhoto) {
      this.swapAssignments(draggedItem, targetPerson);
    }
  }

  onDropOnUnassigned(event: CdkDragDrop<any>): void {
    if (event.previousContainer === event.container) return;

    const draggedItem = event.item.data;
    if (this.isPersonWithPhoto(draggedItem) && draggedItem.assignedPhoto) {
      this.removeAssignment(draggedItem);
    }
  }

  private assignPhotoToPerson(mediaId: number, personId: number): void {
    const newAssignments = this.assignments().filter(a =>
      a.personId !== personId && a.mediaId !== mediaId
    );
    newAssignments.push({ personId, mediaId });
    this.assignmentsChange.emit(newAssignments);
  }

  private swapAssignments(sourcePerson: PersonWithPhoto, targetPerson: PersonWithPhoto): void {
    if (!sourcePerson.assignedPhoto) return;

    const sourceMediaId = sourcePerson.assignedPhoto.mediaId;
    const targetMediaId = targetPerson.assignedPhoto?.mediaId;

    let newAssignments = this.assignments().filter(a =>
      a.personId !== sourcePerson.id && a.personId !== targetPerson.id
    );

    newAssignments.push({ personId: targetPerson.id, mediaId: sourceMediaId });

    if (targetMediaId) {
      newAssignments.push({ personId: sourcePerson.id, mediaId: targetMediaId });
    }

    this.assignmentsChange.emit(newAssignments);
  }

  removeAssignment(person: PersonWithPhoto): void {
    const newAssignments = this.assignments().filter(a => a.personId !== person.id);
    this.assignmentsChange.emit(newAssignments);
  }

  private isUploadedPhoto(item: any): item is UploadedPhoto {
    return item && 'mediaId' in item && 'thumbUrl' in item && !('name' in item);
  }

  private isPersonWithPhoto(item: any): item is PersonWithPhoto {
    return item && 'id' in item && 'name' in item && 'assignedPhoto' in item;
  }

  // === LIGHTBOX ===

  openLightbox(photo: UploadedPhoto): void {
    const index = this.uploadedPhotos().findIndex(p => p.mediaId === photo.mediaId);
    if (index >= 0) {
      this.lightboxIndex.set(index);
      this.lightboxOpen.set(true);
    }
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  onLightboxNavigate(index: number): void {
    this.lightboxIndex.set(index);
  }
}
