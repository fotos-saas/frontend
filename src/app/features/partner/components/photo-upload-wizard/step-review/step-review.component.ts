import {
  Component,
  inject,
  input,
  output,
  effect,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import {
  UploadedPhoto,
  TabloPersonItem,
  MatchResult,
  PhotoAssignment
} from '../../../services/partner.service';
import { SamplesLightboxComponent } from '../../../../../shared/components/samples-lightbox';
import {
  PersonWithPhoto,
  ReviewStatsBarComponent,
  ReviewFilterTabsComponent,
  ReviewSearchBoxComponent,
  ReviewPersonCardComponent,
  ReviewUnassignedPanelComponent,
} from './index';
import { StepReviewService } from './step-review.service';

/**
 * Step Review - Parkolópálya drag & drop párosítás.
 * Üzleti logika a StepReviewService-ben.
 */
@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [
    DragDropModule,
    LucideAngularModule,
    SamplesLightboxComponent,
    ReviewStatsBarComponent,
    ReviewFilterTabsComponent,
    ReviewSearchBoxComponent,
    ReviewPersonCardComponent,
    ReviewUnassignedPanelComponent,
  ],
  providers: [StepReviewService],
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
          <h4 class="section-title section-title--success section-title--collapsible"
              (click)="togglePairedCollapsed()">
            <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="16" />
            Párosítva ({{ pairedPersons().length }})
            <span class="section-hint">Húzz új képet a cseréhez</span>
            <lucide-icon
              [name]="pairedCollapsed() ? ICONS.CHEVRON_DOWN : ICONS.CHEVRON_UP"
              [size]="16"
              class="collapse-icon"
            />
          </h4>
          @if (!pairedCollapsed()) {
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
          }
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
  styleUrl: './step-review.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StepReviewComponent {
  private readonly svc = inject(StepReviewService);
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

  // === Szinkronizálás: input → service ===
  constructor() {
    effect(() => this.svc.setPersons(this.persons()));
    effect(() => this.svc.setMatchResult(this.matchResult()));
    effect(() => this.svc.setUploadedPhotos(this.uploadedPhotos()));
    effect(() => this.svc.setAssignments(this.assignments()));
    effect(() => this.svc.setUnassignedPhotos(this.unassignedPhotos()));

    // Alapból csukva ha van hiányzó (egyszer fut)
    let initialSet = false;
    effect(() => {
      const missing = this.missingPersonsList();
      if (!initialSet && missing.length > 0) {
        this.pairedCollapsed.set(true);
        initialSet = true;
      }
    });
  }

  // === Collapse state: alapból becsukva ha van hiányzó ===
  readonly pairedCollapsed = signal(false);

  togglePairedCollapsed(): void {
    this.pairedCollapsed.update(v => !v);
  }

  // === Template-delegálás: signal-ek ===
  readonly searchQuery = this.svc.searchQuery;
  readonly typeFilter = this.svc.typeFilter;
  readonly lightboxOpen = this.svc.lightboxOpen;
  readonly lightboxIndex = this.svc.lightboxIndex;

  // === Template-delegálás: computed-ek ===
  readonly pairedPersons = this.svc.pairedPersons;
  readonly missingPersonsList = this.svc.missingPersonsList;
  readonly allDropListIds = this.svc.allDropListIds;
  readonly lightboxItems = this.svc.lightboxItems;
  readonly filteredPersonsWithPhotos = this.svc.filteredPersonsWithPhotos;
  readonly studentStats = this.svc.studentStats;
  readonly teacherStats = this.svc.teacherStats;
  readonly assignedCount = this.svc.assignedCount;
  readonly missingCount = this.svc.missingCount;

  // === Template-delegálás: metódusok ===

  onDropOnPersonCard(event: CdkDragDrop<unknown>, targetPerson: PersonWithPhoto): void {
    const result = this.svc.onDropOnPersonCard(event, targetPerson);
    if (result) this.assignmentsChange.emit(result);
  }

  onDropOnUnassigned(event: CdkDragDrop<unknown>): void {
    const result = this.svc.onDropOnUnassigned(event);
    if (result) this.assignmentsChange.emit(result);
  }

  removeAssignment(person: PersonWithPhoto): void {
    this.assignmentsChange.emit(this.svc.removeAssignment(person));
  }

  openLightbox(photo: UploadedPhoto): void { this.svc.openLightbox(photo); }
  closeLightbox(): void { this.svc.closeLightbox(); }
  onLightboxNavigate(index: number): void { this.svc.onLightboxNavigate(index); }
}
