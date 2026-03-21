import { Component, inject, signal, computed, OnInit, HostListener, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherDebugItem, TeacherDebugStats, TeacherDebugAnomaly } from '../../models/teacher.models';
import { ICONS } from '@shared/constants/icons.constants';
import { ListPaginationComponent } from '@shared/components/list-pagination/list-pagination.component';

@Component({
  selector: 'app-teacher-debug',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule, MatTooltipModule, ListPaginationComponent],
  templateUrl: './teacher-debug.component.html',
  styleUrls: ['./teacher-debug.component.scss'],
})
export class TeacherDebugComponent implements OnInit {
  private teacherService = inject(PartnerTeacherService);
  private router = inject(Router);
  private el = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.el.nativeElement.querySelector('.school-filter-wrap')?.contains(event.target)) {
      this.schoolDropdownOpen.set(false);
    }
  }

  readonly ICONS = ICONS;
  perPage = signal(50);

  // Base URL (pl. /designer vagy /partner) — az aktuális URL-ből deriválva
  readonly baseUrl = computed(() => {
    const url = this.router.url; // pl. /designer/projects/teacher-debug
    const match = url.match(/^\/(partner|designer|printer|assistant)/);
    return match ? `/${match[1]}` : '/partner';
  });

  // State
  items = signal<TeacherDebugItem[]>([]);
  stats = signal<TeacherDebugStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filterek
  search = signal('');
  anomalyOnly = signal(false);
  selectedAnomaly = signal<TeacherDebugAnomaly | ''>('');
  selectedSchool = signal('');
  schoolSearch = signal('');
  schoolDropdownOpen = signal(false);
  classYear = signal('2026');
  currentPage = signal(1);
  sortColumn = signal<'name' | 'schoolName' | 'className' | 'archiveSchoolName' | 'anomalies'>('name');
  sortDir = signal<'asc' | 'desc'>('asc');

  // Elérhető iskolák (a betöltött adatból)
  schools = computed(() => {
    const names = [...new Set(this.items().map(i => i.schoolName).filter(Boolean))] as string[];
    return names.sort();
  });

  filteredSchools = computed(() => {
    const q = this.schoolSearch().toLowerCase().trim();
    if (!q) return this.schools();
    return this.schools().filter(s => s.toLowerCase().includes(q));
  });

  // Szűrt lista
  filtered = computed(() => {
    let list = this.items();
    const s = this.search().toLowerCase().trim();
    const anom = this.selectedAnomaly();
    const school = this.selectedSchool();

    if (s) {
      list = list.filter(i =>
        i.name.toLowerCase().includes(s) ||
        i.schoolName?.toLowerCase().includes(s) ||
        i.className?.toLowerCase().includes(s)
      );
    }
    if (anom) {
      list = list.filter(i => i.anomalies.includes(anom));
    }
    if (this.anomalyOnly()) {
      list = list.filter(i => i.hasAnomaly);
    }
    if (school) {
      list = list.filter(i => i.schoolName === school);
    }

    // Rendezés
    const col = this.sortColumn();
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      if (col === 'anomalies') {
        return (b.anomalies.length - a.anomalies.length) * dir;
      }
      const valA = (a[col] ?? '').toLowerCase();
      const valB = (b[col] ?? '').toLowerCase();
      return valA.localeCompare(valB, 'hu') * dir;
    });

    return list;
  });

  // Paginálás
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.perPage())));
  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.perPage();
    return this.filtered().slice(start, start + this.perPage());
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.teacherService.getDebugList({
      class_year: this.classYear(),
      anomaly_only: false,
    }).subscribe({
      next: res => {
        this.items.set(res.data.items);
        this.stats.set(res.data.stats);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Nem sikerült betölteni az adatokat.');
        this.loading.set(false);
      }
    });
  }

  anomalyLabel(a: TeacherDebugAnomaly): string {
    const map: Record<TeacherDebugAnomaly, string> = {
      no_archive: 'Nincs archív',
      wrong_school: 'Rossz iskola',
      photo_from_other: 'Idegen fotó',
      no_photo: 'Nincs fotó',
    };
    return map[a];
  }

  anomalyClass(a: TeacherDebugAnomaly): string {
    const map: Record<TeacherDebugAnomaly, string> = {
      no_archive: 'badge--red',
      wrong_school: 'badge--orange',
      photo_from_other: 'badge--purple',
      no_photo: 'badge--gray',
    };
    return map[a];
  }

  anomalyIcon(a: TeacherDebugAnomaly): string {
    const map: Record<TeacherDebugAnomaly, string> = {
      no_archive: ICONS.ALERT_TRIANGLE,
      wrong_school: ICONS.SCHOOL,
      photo_from_other: ICONS.IMAGE,
      no_photo: ICONS.IMAGE_DOWN,
    };
    return map[a];
  }

  anomalyTooltip(item: TeacherDebugItem, a: TeacherDebugAnomaly): string {
    if (a === 'wrong_school') {
      return `Projekt: ${item.schoolName} | Archív: ${item.archiveSchoolName}`;
    }
    if (a === 'photo_from_other') {
      return `A fotó valójában: ${item.photoOwner?.name ?? 'ismeretlen'}`;
    }
    return this.anomalyLabel(a);
  }

  filterByAnomaly(a: TeacherDebugAnomaly | ''): void {
    this.selectedAnomaly.set(a);
    this.anomalyOnly.set(false);
    this.currentPage.set(1);
  }

  filterAnomalyOnly(): void {
    this.selectedAnomaly.set('');
    this.anomalyOnly.set(true);
    this.currentPage.set(1);
  }

  filterAll(): void {
    this.selectedAnomaly.set('');
    this.anomalyOnly.set(false);
    this.currentPage.set(1);
  }

  onSearchChange(value: string): void {
    this.search.set(value);
    this.currentPage.set(1);
  }

  selectSchool(value: string): void {
    this.selectedSchool.set(value);
    this.schoolSearch.set('');
    this.schoolDropdownOpen.set(false);
    this.currentPage.set(1);
  }

  onSchoolSearchInput(value: string): void {
    this.schoolSearch.set(value);
    this.schoolDropdownOpen.set(true);
  }

  clearSchool(): void {
    this.selectedSchool.set('');
    this.schoolSearch.set('');
    this.currentPage.set(1);
  }

  toggleSort(col: 'name' | 'schoolName' | 'className' | 'archiveSchoolName' | 'anomalies'): void {
    if (this.sortColumn() === col) {
      this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(col);
      this.sortDir.set('asc');
    }
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPerPageChange(value: number): void {
    this.perPage.set(value);
    this.currentPage.set(1);
  }
}
