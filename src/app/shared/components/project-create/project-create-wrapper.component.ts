import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { PROJECT_CREATE_SERVICE, PROJECT_CREATE_ROUTE_PREFIX } from './project-create.tokens';
import { SchoolOption } from './project-create.types';

/**
 * Generikus Project Create Wrapper - közös projekt létrehozó komponens.
 */
@Component({
  selector: 'app-project-create-wrapper',
  standalone: true,
  imports: [RouterModule, FormsModule, LucideAngularModule],
  template: `
    <div class="project-create-page page-card">
      <header class="page-header">
        <button class="back-btn" [routerLink]="routePrefix + '/projects'">
          <lucide-icon name="arrow-left" [size]="20"></lucide-icon>
          Vissza
        </button>
        <h1>Új projekt létrehozása</h1>
        <p class="subtitle">Adj meg egy iskolát és osztályt az új projekthez</p>
      </header>

      <form class="create-form" (ngSubmit)="onSubmit()">
        <!-- Iskola választó -->
        <div class="form-group">
          <label for="school">Iskola</label>
          <div class="autocomplete-wrapper">
            <input
              type="text"
              id="school"
              class="form-input"
              placeholder="Kezdj el gépelni az iskola nevét..."
              [(ngModel)]="schoolSearchQuery"
              name="schoolSearch"
              (ngModelChange)="onSchoolSearch($event)"
              (focus)="showSchoolDropdown.set(true)"
              (blur)="onSchoolBlur()"
              (keydown)="onSchoolKeydown($event)"
              autocomplete="off"
            />
            @if (selectedSchool()) {
              <button type="button" class="clear-selection" (click)="clearSchool()">
                <lucide-icon name="x" [size]="16"></lucide-icon>
              </button>
            }

            @if (showSchoolDropdown() && !selectedSchool()) {
              <div class="autocomplete-dropdown">
                @if (loadingSchools()) {
                  <div class="dropdown-loading">
                    <span class="spinner"></span>
                    Keresés...
                  </div>
                } @else if (schoolOptions().length === 0 && schoolSearchQuery.length >= 2) {
                  <div class="dropdown-empty">Nincs találat</div>
                } @else {
                  @for (school of schoolOptions(); track school.id; let i = $index) {
                    <button
                      type="button"
                      class="dropdown-item"
                      [class.highlighted]="i === highlightedIndex()"
                      (mousedown)="selectSchool(school)"
                      (mouseenter)="highlightedIndex.set(i)"
                    >
                      <span class="school-name">{{ school.name }}</span>
                      @if (school.city) {
                        <span class="school-city">{{ school.city }}</span>
                      }
                    </button>
                  }
                }
              </div>
            }
          </div>
          <span class="form-hint">Opcionális - keress rá az iskola nevére vagy városára</span>
        </div>

        <!-- Osztály neve -->
        <div class="form-group">
          <label for="className">Osztály neve</label>
          <input
            type="text"
            id="className"
            class="form-input"
            placeholder="pl. 12.A"
            [(ngModel)]="className"
            name="className"
            maxlength="255"
          />
          <span class="form-hint">Opcionális - pl. 12.A, Ballagók 2024</span>
        </div>

        <!-- Évfolyam -->
        <div class="form-group">
          <label for="classYear">Évfolyam</label>
          <input
            type="text"
            id="classYear"
            class="form-input"
            placeholder="pl. 2024"
            [(ngModel)]="classYear"
            name="classYear"
            maxlength="50"
          />
          <span class="form-hint">Opcionális - pl. 2024, 2024/2025</span>
        </div>

        <!-- Hibaüzenet -->
        @if (errorMessage()) {
          <div class="error-message">
            <lucide-icon name="alert-circle" [size]="18"></lucide-icon>
            {{ errorMessage() }}
          </div>
        }

        <!-- Submit gomb -->
        <div class="form-actions">
          <button
            type="button"
            class="btn btn-secondary"
            [routerLink]="routePrefix + '/projects'"
          >
            Mégse
          </button>
          <button
            type="submit"
            class="btn btn-primary"
            [disabled]="saving()"
          >
            @if (saving()) {
              <span class="spinner"></span>
              Mentés...
            } @else {
              <lucide-icon name="plus" [size]="18"></lucide-icon>
              Projekt létrehozása
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .project-create-page {
      max-width: 600px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: none;
      border: none;
      color: #64748b;
      font-size: 0.875rem;
      cursor: pointer;
      padding: 8px 12px;
      margin: -8px -12px 16px;
      border-radius: 8px;
      transition: all 0.15s ease;
    }

    .back-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .page-header h1 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.875rem;
      margin: 0;
    }

    /* Form */
    .create-form {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .form-input {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9375rem;
      transition: all 0.2s ease;
      width: 100%;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #2563eb);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .form-hint {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    /* Autocomplete */
    .autocomplete-wrapper {
      position: relative;
    }

    .clear-selection {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      background: #e2e8f0;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #64748b;
      transition: all 0.15s ease;
    }

    .clear-selection:hover {
      background: #cbd5e1;
      color: #1e293b;
    }

    .autocomplete-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      margin-top: 4px;
      max-height: 240px;
      overflow-y: auto;
      z-index: 100;
      animation: dropdownIn 0.15s ease;
    }

    @keyframes dropdownIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .dropdown-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 12px 16px;
      width: 100%;
      text-align: left;
      background: none;
      border: none;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .dropdown-item:hover,
    .dropdown-item.highlighted {
      background: #f1f5f9;
    }

    .dropdown-item .school-name {
      font-weight: 500;
      color: #1e293b;
      font-size: 0.9375rem;
    }

    .dropdown-item .school-city {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .dropdown-loading,
    .dropdown-empty {
      padding: 16px;
      text-align: center;
      color: #64748b;
      font-size: 0.875rem;
    }

    .dropdown-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    /* Error message */
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 10px;
      color: #dc2626;
      font-size: 0.875rem;
    }

    /* Actions */
    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 8px;
      padding-top: 24px;
      border-top: 1px solid #e2e8f0;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .btn-primary {
      background: var(--color-primary, #2563eb);
      color: #ffffff;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #1d4ed8);
      transform: translateY(-1px);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Spinner */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .dropdown-loading .spinner {
      border-color: rgba(100, 116, 139, 0.3);
      border-top-color: #64748b;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 640px) {
      .form-actions {
        flex-direction: column-reverse;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCreateWrapperComponent implements OnInit {
  private projectService = inject(PROJECT_CREATE_SERVICE);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  readonly routePrefix = inject(PROJECT_CREATE_ROUTE_PREFIX);

  // Form fields
  schoolSearchQuery = '';
  className = '';
  classYear = '';

  // State
  saving = signal(false);
  errorMessage = signal('');
  loadingSchools = signal(false);
  showSchoolDropdown = signal(false);
  schoolOptions = signal<SchoolOption[]>([]);
  selectedSchool = signal<SchoolOption | null>(null);
  highlightedIndex = signal(-1);

  // Search debounce
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (query.length < 2) {
          this.loadingSchools.set(false);
          this.schoolOptions.set([]);
          return of(null);
        }
        this.loadingSchools.set(true);
        return this.projectService.getAllSchools(query);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (schools) => {
        if (schools !== null) {
          this.schoolOptions.set(schools);
          this.loadingSchools.set(false);
        }
      },
      error: (err) => {
        console.error('School search error:', err);
        this.loadingSchools.set(false);
        this.schoolOptions.set([]);
      },
    });
  }

  onSchoolSearch(query: string): void {
    if (this.selectedSchool()) {
      this.selectedSchool.set(null);
    }
    this.highlightedIndex.set(-1);
    this.searchSubject.next(query);
  }

  onSchoolKeydown(event: KeyboardEvent): void {
    const options = this.schoolOptions();
    if (!this.showSchoolDropdown() || options.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.highlightedIndex.update(i => (i + 1) % options.length);
        this.scrollToHighlighted();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.highlightedIndex.update(i => (i - 1 + options.length) % options.length);
        this.scrollToHighlighted();
        break;
      case 'Enter':
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx >= 0 && idx < options.length) {
          this.selectSchool(options[idx]);
        }
        break;
      case 'Escape':
        this.showSchoolDropdown.set(false);
        this.highlightedIndex.set(-1);
        break;
    }
  }

  private scrollToHighlighted(): void {
    setTimeout(() => {
      const dropdown = document.querySelector('.autocomplete-dropdown');
      const highlighted = dropdown?.querySelector('.dropdown-item.highlighted');
      if (highlighted) {
        highlighted.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 0);
  }

  selectSchool(school: SchoolOption): void {
    this.selectedSchool.set(school);
    this.schoolSearchQuery = school.name + (school.city ? ` (${school.city})` : '');
    this.showSchoolDropdown.set(false);
  }

  clearSchool(): void {
    this.selectedSchool.set(null);
    this.schoolSearchQuery = '';
    this.schoolOptions.set([]);
  }

  onSchoolBlur(): void {
    setTimeout(() => {
      this.showSchoolDropdown.set(false);
    }, 200);
  }

  onSubmit(): void {
    this.errorMessage.set('');
    this.saving.set(true);

    const data = {
      school_id: this.selectedSchool()?.id ?? null,
      class_name: this.className.trim() || null,
      class_year: this.classYear.trim() || null,
    };

    this.projectService.createProject(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.saving.set(false);
          this.router.navigate([this.routePrefix + '/projects', response.data.id]);
        },
        error: (err) => {
          this.saving.set(false);
          if (err.error?.message) {
            this.errorMessage.set(err.error.message);
          } else if (err.error?.errors) {
            const firstError = Object.values(err.error.errors)[0];
            this.errorMessage.set(Array.isArray(firstError) ? firstError[0] : String(firstError));
          } else {
            this.errorMessage.set('Hiba történt a projekt létrehozása során. Kérjük, próbáld újra!');
          }
        },
      });
  }
}
