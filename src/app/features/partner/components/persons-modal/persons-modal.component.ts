import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService } from '../../services/partner.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { TypeFilter, TabloPersonItem } from './persons-modal.types';
import { ModalPersonCardComponent } from './modal-person-card.component';
import { PhotoLightboxComponent } from './photo-lightbox.component';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * Persons Modal - Személyek listája modal (grid nézet thumbnail-ekkel + lightbox).
 */
@Component({
  selector: 'app-persons-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, ModalPersonCardComponent, PhotoLightboxComponent],
  template: /* html */`
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div class="dialog-panel dialog-panel--lg" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-content">
            <h2>Személyek</h2>
            <p class="subtitle">{{ projectName() }}</p>
          </div>
          <button type="button" class="close-btn" (click)="close.emit()">
            <lucide-icon [name]="ICONS.X" [size]="20" />
          </button>
        </div>

        <!-- Search Box -->
        <div class="search-section">
          <div class="search-box">
            <lucide-icon [name]="ICONS.SEARCH" class="search-icon" [size]="16" />
            <input
              type="text"
              placeholder="Keresés név alapján..."
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              class="search-input"
            />
            @if (searchQuery()) {
              <button class="clear-btn" (click)="searchQuery.set('')">
                <lucide-icon [name]="ICONS.X" [size]="14" />
              </button>
            }
          </div>
        </div>

        <!-- Type Filter Tabs -->
        <div class="filter-tabs">
          <button type="button" class="tab" [class.tab--active]="typeFilter() === 'student'" (click)="typeFilter.set('student')">
            Diákok
            @if (!loading()) {
              <span class="tab-count">({{ studentCount() }})</span>
            }
          </button>
          <button type="button" class="tab" [class.tab--active]="typeFilter() === 'teacher'" (click)="typeFilter.set('teacher')">
            Tanárok
            @if (!loading()) {
              <span class="tab-count">({{ teacherCount() }})</span>
            }
          </button>
        </div>

        <!-- Photo Filter Toggle -->
        <div class="photo-filter">
          <label class="photo-filter-toggle">
            <span class="custom-checkbox" [class.custom-checkbox--checked]="showOnlyWithoutPhoto()">
              @if (showOnlyWithoutPhoto()) {
                <lucide-icon [name]="ICONS.CHECK" [size]="12" />
              }
            </span>
            <input type="checkbox" [ngModel]="showOnlyWithoutPhoto()" (ngModelChange)="showOnlyWithoutPhoto.set($event)" class="sr-only" />
            <span class="toggle-label">Csak kép nélküliek</span>
            @if (!loading()) {
              <span class="toggle-count">({{ withoutPhotoCount() }})</span>
            }
          </label>
        </div>

        <!-- Content -->
        <div class="modal-content">
          @if (loading()) {
            <div class="skeleton-grid">
              @for (i of [1, 2, 3, 4, 5, 6]; track i) {
                <div class="skeleton-card skeleton-shimmer"></div>
              }
            </div>
          } @else if (filteredPersons().length === 0) {
            <div class="empty-state">
              <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="48" class="empty-icon" />
              <h3>{{ emptyStateTitle() }}</h3>
              <p>{{ emptyStateText() }}</p>
            </div>
          } @else {
            <div class="persons-grid">
              @for (person of filteredPersons(); track person.id; let i = $index) {
                <app-modal-person-card
                  [person]="person"
                  [animationDelay]="i * 0.05 + 's'"
                  (cardClick)="openLightbox($event)"
                />
              }
            </div>
          }
        </div>

        <!-- Footer Stats -->
        @if (!loading() && allCount() > 0) {
          <div class="modal-footer">
            <div class="stats-row">
              <span class="stat"><strong>{{ filteredPersons().length }}</strong> találat</span>
              <span class="stat-separator">·</span>
              <span class="stat"><strong>{{ studentCount() }}</strong> diák</span>
              <span class="stat-separator">·</span>
              <span class="stat"><strong>{{ teacherCount() }}</strong> tanár</span>
              <span class="stat-separator">·</span>
              <span class="stat" [class.stat--danger]="withoutPhotoCount() > 0">
                <strong>{{ withoutPhotoCount() }}</strong> kép nélkül
              </span>
            </div>
            @if (withoutPhotoCount() > 0) {
              <button type="button" class="upload-btn" (click)="openUploadWizard.emit()">
                <lucide-icon [name]="ICONS.UPLOAD" [size]="18" />
                Tovább a fényképek feltöltéséhez
              </button>
            }
          </div>
        }
      </div>
    </div>

    <!-- Lightbox -->
    <app-photo-lightbox
      [person]="lightboxPerson()"
      [personsWithPhotos]="personsWithPhotos()"
      (close)="closeLightbox()"
      (navigate)="lightboxPerson.set($event)"
    />
  `,
  styles: [`
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 20px 24px 16px;
    }

    .header-content h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      border: none;
      border-radius: 8px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .close-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .search-section {
      padding: 0 24px 16px;
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 10px 36px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      transition: all 0.15s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .clear-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
    }

    .clear-btn:hover {
      color: #64748b;
      background: #f1f5f9;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      padding: 0 24px 16px;
      border-bottom: 1px solid #e2e8f0;
    }

    .tab {
      padding: 8px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .tab:hover:not(.tab--active) {
      background: #f1f5f9;
      border-color: #cbd5e1;
    }

    .tab--active {
      background: var(--color-primary, #1e3a5f);
      border-color: var(--color-primary, #1e3a5f);
      color: #ffffff;
    }

    .tab-count {
      font-weight: 400;
      opacity: 0.8;
    }

    .photo-filter {
      padding: 0 24px 16px;
    }

    .photo-filter-toggle {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
      font-size: 0.875rem;
      color: #475569;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    .custom-checkbox {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid #cbd5e1;
      border-radius: 5px;
      background: #ffffff;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }

    .custom-checkbox--checked {
      background: var(--color-primary, #1e3a5f);
      border-color: var(--color-primary, #1e3a5f);
      color: #ffffff;
    }

    .photo-filter-toggle:hover .custom-checkbox:not(.custom-checkbox--checked) {
      border-color: #94a3b8;
    }

    .toggle-label {
      font-weight: 500;
    }

    .toggle-count {
      color: #94a3b8;
      font-weight: 400;
    }

    .modal-content {
      padding: 16px 24px;
      max-height: 50vh;
      overflow-y: auto;
    }

    .persons-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
    }

    .empty-icon {
      color: #10b981;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 1rem;
      color: #1e293b;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    .skeleton-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
    }

    .skeleton-card {
      aspect-ratio: 0.8;
      border-radius: 8px;
      background: #e2e8f0;
    }

    .skeleton-shimmer {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 0 0 12px 12px;
    }

    .stats-row {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: #64748b;
      flex-wrap: wrap;
    }

    .stat strong {
      color: #1e293b;
    }

    .stat--danger {
      color: #dc2626;
    }

    .stat--danger strong {
      color: #dc2626;
    }

    .stat-separator {
      color: #94a3b8;
    }

    .upload-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 100%;
      padding: 12px 20px;
      margin-top: 16px;
      background: var(--color-primary, #1e3a5f);
      border: none;
      border-radius: 8px;
      font-size: 0.9375rem;
      font-weight: 500;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .upload-btn:hover {
      background: var(--color-primary-dark, #152a45);
    }

    @media (max-width: 480px) {
      .persons-grid,
      .skeleton-grid {
        grid-template-columns: repeat(3, 1fr);
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
export class PersonsModalComponent implements OnInit {
  readonly ICONS = ICONS;

  /** Backdrop handler a kijelölés közbeni bezárás megelőzéséhez */
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly projectId = input.required<number>();
  readonly projectName = input<string>('');

  readonly close = output<void>();
  readonly openUploadWizard = output<void>();

  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);

  loading = signal(true);
  allPersons = signal<TabloPersonItem[]>([]);

  // Filters
  typeFilter = signal<TypeFilter>('student');
  showOnlyWithoutPhoto = signal(false);
  searchQuery = signal('');

  // Lightbox
  lightboxPerson = signal<TabloPersonItem | null>(null);

  // Computed counts
  readonly allCount = computed(() => this.allPersons().length);
  readonly studentCount = computed(() => this.allPersons().filter(p => p.type === 'student').length);
  readonly teacherCount = computed(() => this.allPersons().filter(p => p.type === 'teacher').length);
  readonly withoutPhotoCount = computed(() => this.allPersons().filter(p => !p.hasPhoto).length);

  // Filtered persons
  readonly filteredPersons = computed(() => {
    let result = this.allPersons();
    result = result.filter(p => p.type === this.typeFilter());
    if (this.showOnlyWithoutPhoto()) {
      result = result.filter(p => !p.hasPhoto);
    }
    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      result = result.filter(p => p.name.toLowerCase().includes(query));
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
}
