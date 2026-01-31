import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, TabloProject, MissingPerson } from '../../core/services/auth.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Missing Persons Component - Hiányzó személyek oldal
 *
 * Megjeleníti a diákokat és tanárokat akiknek nincs még feltöltve a képük.
 * Csoportosítva típus szerint (diák/tanár), kereséssel és szűréssel.
 *
 * Lazy-loaded standalone komponens.
 */
@Component({
    selector: 'app-missing-persons',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './missing-persons.component.html',
    styleUrls: ['./missing-persons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingPersonsComponent implements OnInit {
  /** Aktuális projekt */
  project$: Observable<TabloProject | null>;

  /** Keresőmező értéke */
  searchQuery$ = new BehaviorSubject<string>('');

  /** Szűrő (all, student, teacher) */
  filterType$ = new BehaviorSubject<'all' | 'student' | 'teacher'>('all');

  /** Szűrt és keresett személyek */
  filteredPersons$!: Observable<{
    students: MissingPerson[];
    teachers: MissingPerson[];
    studentsWithoutPhoto: number;
    teachersWithoutPhoto: number;
  }>;

  constructor(
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.project$ = this.authService.project$;
  }

  ngOnInit(): void {
    this.filteredPersons$ = combineLatest([
      this.project$,
      this.searchQuery$,
      this.filterType$
    ]).pipe(
      map(([project, search, filterType]) => {
        if (!project?.missingPersons) {
          return { students: [], teachers: [], studentsWithoutPhoto: 0, teachersWithoutPhoto: 0 };
        }

        // Only show persons without photo
        let persons = project.missingPersons.filter(p => !p.hasPhoto);

        // Apply search filter
        if (search.trim()) {
          const query = search.toLowerCase().trim();
          persons = persons.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.localId && p.localId.toLowerCase().includes(query))
          );
        }

        // Apply type filter
        if (filterType !== 'all') {
          persons = persons.filter(p => p.type === filterType);
        }

        // Split by type
        const students = persons.filter(p => p.type === 'student');
        const teachers = persons.filter(p => p.type === 'teacher');

        return {
          students,
          teachers,
          studentsWithoutPhoto: project.missingStats?.studentsWithoutPhoto ?? 0,
          teachersWithoutPhoto: project.missingStats?.teachersWithoutPhoto ?? 0
        };
      })
    );
  }

  /**
   * Keresés változás
   */
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery$.next(value);
  }

  /**
   * Szűrő változás
   */
  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'student' | 'teacher';
    this.filterType$.next(value);
  }

  /**
   * TrackBy függvény
   */
  trackByPerson(index: number, person: MissingPerson): number {
    return person.id;
  }
}
