import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { TeacherDebugItem, TeacherDebugStats, TeacherDebugAnomaly } from '../../models/teacher.models';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-teacher-debug',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule, MatTooltipModule],
  templateUrl: './teacher-debug.component.html',
  styleUrls: ['./teacher-debug.component.scss'],
})
export class TeacherDebugComponent implements OnInit {
  private teacherService = inject(PartnerTeacherService);

  readonly ICONS = ICONS;
  readonly PAGE_SIZE = 30;

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
  classYear = signal('2026');
  currentPage = signal(1);

  // Elérhető iskolák (a betöltött adatból)
  schools = computed(() => {
    const names = [...new Set(this.items().map(i => i.schoolName).filter(Boolean))] as string[];
    return names.sort();
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
    return list;
  });

  // Paginálás
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.PAGE_SIZE)));
  paginatedItems = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filtered().slice(start, start + this.PAGE_SIZE);
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

  onSchoolChange(value: string): void {
    this.selectedSchool.set(value);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  pageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    const start = Math.max(1, current - 3);
    const end = Math.min(total, current + 3);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
