import {
  Component,
  OnInit,
  inject,
  signal,
  DestroyRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { LoggerService } from '@core/services/logger.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PsInputComponent } from '@shared/components/form';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { PROJECT_CREATE_SERVICE, PROJECT_CREATE_ROUTE_PREFIX } from './project-create.tokens';
import { SchoolOption } from './project-create.types';

/**
 * Generikus Project Create Wrapper - közös projekt létrehozó komponens.
 */
@Component({
  selector: 'app-project-create-wrapper',
  standalone: true,
  imports: [RouterModule, FormsModule, LucideAngularModule, PsInputComponent],
  templateUrl: './project-create-wrapper.component.html',
  styleUrls: ['./project-create-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCreateWrapperComponent implements OnInit {
  private readonly logger = inject(LoggerService);
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
        this.logger.error('School search error', err);
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
