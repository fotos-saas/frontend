import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, MatTooltipModule],
  templateUrl: './teacher-debug.component.html',
  styleUrl: './teacher-debug.component.scss',
})
export class TeacherDebugComponent implements OnInit {
  private teacherService = inject(PartnerTeacherService);

  readonly ICONS = ICONS;

  // State
  items = signal<TeacherDebugItem[]>([]);
  stats = signal<TeacherDebugStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  // Filterek
  search = signal('');
  anomalyOnly = signal(false);
  selectedAnomaly = signal<TeacherDebugAnomaly | ''>('');
  classYear = signal('2026');

  // Szűrt lista
  filtered = computed(() => {
    let list = this.items();
    const s = this.search().toLowerCase().trim();
    const anom = this.selectedAnomaly();

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
    return list;
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);

    this.teacherService.getDebugList({
      class_year: this.classYear(),
      anomaly_only: false, // mindent betöltünk, frontenden szűrünk
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
  }

  onSearchChange(value: string): void {
    this.search.set(value);
  }

  trackById(_: number, item: TeacherDebugItem): number {
    return item.personId;
  }
}
