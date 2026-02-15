import { Component, OnInit, inject, signal, computed, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PartnerSchoolService } from '../../services/partner-school.service';
import { SchoolDetail, SchoolChangeLogEntry } from '../../models/partner.models';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { PsInputComponent } from '@shared/components/form';

@Component({
  selector: 'app-partner-school-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    LucideAngularModule,
    MatTooltipModule,
    PsInputComponent,
  ],
  templateUrl: './school-detail.component.html',
  styleUrl: './school-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerSchoolDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly schoolService = inject(PartnerSchoolService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  schoolId = 0;
  school = signal<SchoolDetail | null>(null);
  changelog = signal<SchoolChangeLogEntry[]>([]);
  loading = signal(true);

  // Inline szerkesztés
  editing = signal(false);
  saving = signal(false);
  editName = '';
  editCity = '';

  // Changelog keresés
  changelogSearch = signal('');
  filteredChangelog = computed(() => {
    const search = this.changelogSearch().toLowerCase().trim();
    const entries = this.changelog();
    if (!search) return entries;
    return entries.filter(e =>
      this.getChangeLabel(e.changeType).toLowerCase().includes(search) ||
      (e.oldValue?.toLowerCase().includes(search)) ||
      (e.newValue?.toLowerCase().includes(search)) ||
      (e.userName?.toLowerCase().includes(search))
    );
  });

  ngOnInit(): void {
    this.schoolId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSchool();
    this.loadChangelog();
  }

  loadSchool(): void {
    this.loading.set(true);
    this.schoolService.getSchool(this.schoolId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.school.set(res.data);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.router.navigate(['..'], { relativeTo: this.route });
        },
      });
  }

  loadChangelog(): void {
    this.schoolService.getChangelog(this.schoolId, { per_page: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (res) => this.changelog.set(res.data) });
  }

  // === Szerkesztés ===

  startEditing(): void {
    const s = this.school();
    if (!s) return;
    this.editName = s.name;
    this.editCity = s.city ?? '';
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  saveProfile(): void {
    const s = this.school();
    if (!s || this.saving()) return;

    const name = this.editName.trim();
    if (!name) return;

    this.saving.set(true);
    this.schoolService.updateSchool(this.schoolId, {
      name,
      city: this.editCity.trim() || null,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.editing.set(false);
          this.saving.set(false);
          this.loadSchool();
          this.loadChangelog();
        },
        error: () => this.saving.set(false),
      });
  }

  // === Navigáció ===

  goToProjects(): void {
    this.router.navigate(['/partner/projects'], {
      queryParams: { school_id: this.schoolId },
    });
  }

  goToTeachers(): void {
    this.router.navigate(['/partner/projects/teachers'], {
      queryParams: { school_id: this.schoolId },
    });
  }

  // === Changelog helper ===

  getChangeLabel(type: string): string {
    const labels: Record<string, string> = {
      created: 'Létrehozva',
      name_changed: 'Név módosítva',
      city_changed: 'Város módosítva',
    };
    return labels[type] ?? type;
  }

  getStatusLabel(status: string | null): string {
    const labels: Record<string, string> = {
      active: 'Aktív',
      done: 'Kész',
      in_print: 'Nyomtatásban',
      draft: 'Vázlat',
    };
    return labels[status ?? ''] ?? status ?? '';
  }
}
