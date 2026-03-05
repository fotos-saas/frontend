import { Injectable, computed, inject, signal } from '@angular/core';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import {
  ExpandedViewResponse,
  ExpandedArchiveTeacher,
  ExpandedClassData,
  SimilarityGroup,
  ExpandedSchoolInfo,
} from './expanded-teacher-view.types';
import { LoggerService } from '@core/services/logger.service';

@Injectable()
export class ExpandedTeacherViewDataService {
  private teacherService = inject(PartnerTeacherService);
  private logger = inject(LoggerService);

  // Core state
  readonly loading = signal(false);
  readonly data = signal<ExpandedViewResponse | null>(null);

  // Hover/kijelölés
  readonly hoveredPersonId = signal<number | null>(null);
  readonly hoveredNormalizedName = signal<string | null>(null);
  readonly selectedPersonId = signal<number | null>(null);

  // Archív szűrés
  readonly archiveSearchQuery = signal('');
  readonly showOnlyMissingPhoto = signal(false);
  readonly archiveCollapsed = signal(false);

  // Iskola kezelés
  readonly activeSchoolIds = signal<number[]>([]);
  readonly additionalSchoolIds = signal<number[]>([]);

  // Computed: hover alapján kiemelt person ID-k
  readonly matchingPersonIds = computed<Set<number>>(() => {
    const normalizedName = this.hoveredNormalizedName();
    const viewData = this.data();
    if (!normalizedName || !viewData) return new Set();

    const ids = new Set<number>();
    for (const cls of viewData.classes) {
      for (const teacher of cls.teachers) {
        if (teacher.normalizedName === normalizedName) {
          ids.add(teacher.personId);
        }
      }
    }
    return ids;
  });

  // Computed: hover név hasonlóság csoport
  readonly highlightedSimilarityGroup = computed<SimilarityGroup | null>(() => {
    const normalizedName = this.hoveredNormalizedName();
    const viewData = this.data();
    if (!normalizedName || !viewData) return null;

    return viewData.similarityGroups.find(g =>
      g.persons.some(p => {
        const cls = viewData.classes.find(c => c.projectId === p.projectId);
        const teacher = cls?.teachers.find(t => t.personId === p.personId);
        return teacher?.normalizedName === normalizedName;
      })
    ) ?? null;
  });

  // Computed: szűrt archív tanárok
  readonly filteredArchiveTeachers = computed<ExpandedArchiveTeacher[]>(() => {
    const viewData = this.data();
    if (!viewData) return [];

    let teachers = viewData.archive.teachers;

    const search = this.archiveSearchQuery().toLowerCase().trim();
    if (search) {
      teachers = teachers.filter(t => t.name.toLowerCase().includes(search));
    }

    if (this.showOnlyMissingPhoto()) {
      teachers = teachers.filter(t => !t.hasPhoto);
    }

    return teachers;
  });

  // Computed: iskolák listája
  readonly schools = computed<ExpandedSchoolInfo[]>(() => this.data()?.schools ?? []);
  readonly availableSchools = computed<ExpandedSchoolInfo[]>(() => this.data()?.availableSchools ?? []);
  readonly classes = computed<ExpandedClassData[]>(() => this.data()?.classes ?? []);
  readonly similarityGroups = computed<SimilarityGroup[]>(() => this.data()?.similarityGroups ?? []);

  loadData(schoolId: number, classYear?: string): void {
    this.loading.set(true);
    this.teacherService.getExpandedView(schoolId, classYear, this.additionalSchoolIds()).subscribe({
      next: (response) => {
        this.data.set(response);
        this.activeSchoolIds.set(response.schools.map(s => s.id));
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Bővített nézet betöltési hiba', err);
        this.loading.set(false);
      },
    });
  }

  addSchool(schoolId: number): void {
    const current = this.additionalSchoolIds();
    if (!current.includes(schoolId)) {
      this.additionalSchoolIds.set([...current, schoolId]);
    }
  }

  removeSchool(schoolId: number): void {
    this.additionalSchoolIds.update(ids => ids.filter(id => id !== schoolId));
  }

  refreshAfterChange(schoolId: number, classYear?: string): void {
    this.loadData(schoolId, classYear);
  }

  onTeacherHover(normalizedName: string | null, personId: number | null): void {
    this.hoveredNormalizedName.set(normalizedName);
    this.hoveredPersonId.set(personId);
  }

  onTeacherSelect(personId: number | null): void {
    this.selectedPersonId.set(personId === this.selectedPersonId() ? null : personId);
  }
}
