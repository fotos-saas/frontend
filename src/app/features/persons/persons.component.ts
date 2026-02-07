import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { AuthService, TabloProject, TabloPerson } from '../../core/services/auth.service';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Persons Component - Személyek oldal
 *
 * Megjeleníti a diákokat és tanárokat akiknek nincs még feltöltve a képük.
 * Csoportosítva típus szerint (diák/tanár), kereséssel és szűréssel.
 *
 * Lazy-loaded standalone komponens.
 */
@Component({
    selector: 'app-persons',
    standalone: true,
    imports: [FormsModule, AsyncPipe],
    templateUrl: './persons.component.html',
    styleUrls: ['./persons.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PersonsComponent implements OnInit {
  /** Aktuális projekt */
  project$: Observable<TabloProject | null>;

  /** Keresőmező értéke */
  searchQuery = signal<string>('');
  private readonly searchQuery$ = toObservable(this.searchQuery);

  /** Szűrő (all, student, teacher) */
  filterType = signal<'all' | 'student' | 'teacher'>('all');
  private readonly filterType$ = toObservable(this.filterType);

  /** Szűrt és keresett személyek */
  filteredPersons$!: Observable<{
    students: TabloPerson[];
    teachers: TabloPerson[];
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
        if (!project?.persons) {
          return { students: [], teachers: [], studentsWithoutPhoto: 0, teachersWithoutPhoto: 0 };
        }

        // Only show persons without photo
        let persons = project.persons.filter(p => !p.hasPhoto);

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
          studentsWithoutPhoto: project.personStats?.studentsWithoutPhoto ?? 0,
          teachersWithoutPhoto: project.personStats?.teachersWithoutPhoto ?? 0
        };
      })
    );
  }

  /**
   * Keresés változás
   */
  onSearchChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }

  /**
   * Szűrő változás
   */
  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'all' | 'student' | 'teacher';
    this.filterType.set(value);
  }

  /**
   * TrackBy függvény
   */
  trackByPerson(index: number, person: TabloPerson): number {
    return person.id;
  }
}
