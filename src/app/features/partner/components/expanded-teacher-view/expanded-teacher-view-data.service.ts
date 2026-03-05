import { Injectable, computed, inject, signal } from '@angular/core';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import {
  ExpandedViewResponse,
  ExpandedUploadedPhoto,
  ExpandedClassData,
  SimilarityGroup,
  ExpandedProjectInfo,
} from './expanded-teacher-view.types';
import { LoggerService } from '@core/services/logger.service';

export interface PendingDrop {
  photoId: number;
  targetPersonId: number;
  allPersonIds: number[];
  teacherName: string;
}

@Injectable()
export class ExpandedTeacherViewDataService {
  private teacherService = inject(PartnerTeacherService);
  private logger = inject(LoggerService);

  // Core state
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly syncing = signal(false);
  readonly data = signal<ExpandedViewResponse | null>(null);

  // Drag & drop
  readonly draggedPhoto = signal<ExpandedUploadedPhoto | null>(null);
  readonly assigning = signal(false);
  readonly pendingDrop = signal<PendingDrop | null>(null);

  // Hover/kijelölés
  readonly hoveredPersonId = signal<number | null>(null);
  readonly hoveredNormalizedName = signal<string | null>(null);
  readonly selectedPersonId = signal<number | null>(null);

  // Feltöltési terület
  readonly uploadPanelCollapsed = signal(false);

  // Computed: session ID
  readonly sessionId = computed<number | null>(() => this.data()?.sessionId ?? null);

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

  // Computed: feltöltött fotók
  readonly uploadedPhotos = computed<ExpandedUploadedPhoto[]>(() => this.data()?.uploadedPhotos ?? []);

  // Computed: projektek és osztályok
  readonly projects = computed<ExpandedProjectInfo[]>(() => this.data()?.projects ?? []);
  readonly availableProjects = computed<ExpandedProjectInfo[]>(() => this.data()?.availableProjects ?? []);
  readonly classes = computed<ExpandedClassData[]>(() => this.data()?.classes ?? []);
  readonly similarityGroups = computed<SimilarityGroup[]>(() => this.data()?.similarityGroups ?? []);

  private sourceProjectId: number | null = null;

  loadData(projectId: number): void {
    this.sourceProjectId = projectId;
    this.loading.set(true);
    this.teacherService.getExpandedView(projectId).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Bővített nézet betöltési hiba', err);
        this.loading.set(false);
      },
    });
  }

  addProject(projectId: number): void {
    const sid = this.sessionId();
    if (!sid) return;

    this.loading.set(true);
    this.teacherService.addProjectToSession(sid, projectId).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Projekt hozzáadási hiba', err);
        this.loading.set(false);
      },
    });
  }

  removeProject(projectId: number): void {
    const sid = this.sessionId();
    if (!sid) return;

    this.loading.set(true);
    this.teacherService.removeProjectFromSession(sid, projectId).subscribe({
      next: (response) => {
        this.data.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.logger.error('Projekt eltávolítási hiba', err);
        this.loading.set(false);
      },
    });
  }

  uploadPhotos(files: File[]): void {
    const sid = this.sessionId();
    if (!sid) return;

    this.uploading.set(true);
    this.teacherService.uploadPhotosToSession(sid, files).subscribe({
      next: (response) => {
        // Feltöltött fotók hozzáadása a meglévőkhöz
        const current = this.data();
        if (current) {
          this.data.set({
            ...current,
            uploadedPhotos: [...response.photos, ...current.uploadedPhotos],
          });
        }
        this.uploading.set(false);
      },
      error: (err) => {
        this.logger.error('Fotó feltöltési hiba', err);
        this.uploading.set(false);
      },
    });
  }

  deletePhoto(photoId: number): void {
    this.teacherService.deleteSessionPhoto(photoId).subscribe({
      next: () => {
        const current = this.data();
        if (current) {
          this.data.set({
            ...current,
            uploadedPhotos: current.uploadedPhotos.filter(p => p.id !== photoId),
          });
        }
      },
      error: (err) => {
        this.logger.error('Fotó törlési hiba', err);
      },
    });
  }

  syncPhotos(): void {
    const sid = this.sessionId();
    if (!sid || !this.sourceProjectId) return;

    this.syncing.set(true);
    this.teacherService.syncSessionPhotos(sid).subscribe({
      next: () => {
        // Teljes újratöltés a sync után, hogy a tanár kártyákon megjelenjen a frissített fotó
        if (this.sourceProjectId) {
          this.loadData(this.sourceProjectId);
        }
        this.syncing.set(false);
      },
      error: (err) => {
        this.logger.error('Szinkronizálási hiba', err);
        this.syncing.set(false);
      },
    });
  }

  /**
   * Fotó ráhúzás kezelése: ha a tanár több osztályban is szerepel, kérdez.
   */
  handlePhotoDrop(photoId: number, targetPersonId: number): void {
    const viewData = this.data();
    if (!viewData) return;

    // Keressük meg a target tanár normalizedName-jét
    let targetName = '';
    let targetNormalized = '';
    for (const cls of viewData.classes) {
      const teacher = cls.teachers.find(t => t.personId === targetPersonId);
      if (teacher) {
        targetName = teacher.name;
        targetNormalized = teacher.normalizedName;
        break;
      }
    }

    if (!targetNormalized) return;

    // Keressük az összes azonos normalizedName-ű person-t
    const allPersonIds: number[] = [];
    for (const cls of viewData.classes) {
      for (const teacher of cls.teachers) {
        if (teacher.normalizedName === targetNormalized) {
          allPersonIds.push(teacher.personId);
        }
      }
    }

    if (allPersonIds.length <= 1) {
      // Csak 1 osztályban van → azonnal assign
      this.assignPhotoToTeacher(photoId, [targetPersonId]);
    } else {
      // Több osztályban is van → popup
      this.pendingDrop.set({
        photoId,
        targetPersonId,
        allPersonIds,
        teacherName: targetName,
      });
    }
  }

  confirmDrop(mode: 'all' | 'single'): void {
    const drop = this.pendingDrop();
    if (!drop) return;

    const personIds = mode === 'all' ? drop.allPersonIds : [drop.targetPersonId];
    this.pendingDrop.set(null);
    this.assignPhotoToTeacher(drop.photoId, personIds);
  }

  cancelDrop(): void {
    this.pendingDrop.set(null);
    this.draggedPhoto.set(null);
  }

  assignPhotoToTeacher(photoId: number, personIds: number[]): void {
    const sid = this.sessionId();
    if (!sid || this.assigning()) return;

    this.assigning.set(true);
    this.teacherService.assignPhotoToTeacher(sid, photoId, personIds).subscribe({
      next: (response) => {
        const results = response.data;
        const current = this.data();
        if (current) {
          this.data.set({
            ...current,
            classes: current.classes.map(cls => ({
              ...cls,
              teachers: cls.teachers.map(t => {
                const match = results.find(r => r.personId === t.personId);
                return match
                  ? { ...t, hasPhoto: true, photoThumbUrl: match.photoThumbUrl, hasOverride: match.hasOverride }
                  : t;
              }),
            })),
          });
        }
        this.assigning.set(false);
        this.draggedPhoto.set(null);
      },
      error: (err) => {
        this.logger.error('Fotó hozzárendelési hiba', err);
        this.assigning.set(false);
      },
    });
  }

  removeOverride(personId: number): void {
    const viewData = this.data();
    if (!viewData) return;

    // Keressük meg a person projectId-jét
    let projectId: number | null = null;
    for (const cls of viewData.classes) {
      if (cls.teachers.some(t => t.personId === personId)) {
        projectId = cls.projectId;
        break;
      }
    }

    if (!projectId) return;

    this.teacherService.removeOverridePhoto(projectId, personId).subscribe({
      next: (response) => {
        const result = response.data;
        const current = this.data();
        if (current) {
          this.data.set({
            ...current,
            classes: current.classes.map(cls => ({
              ...cls,
              teachers: cls.teachers.map(t =>
                t.personId === personId
                  ? { ...t, hasPhoto: result.hasPhoto, hasOverride: result.hasOverride, photoThumbUrl: result.photoThumbUrl ?? '' }
                  : t
              ),
            })),
          });
        }
      },
      error: (err) => {
        this.logger.error('Override eltávolítási hiba', err);
      },
    });
  }

  onTeacherHover(normalizedName: string | null, personId: number | null): void {
    this.hoveredNormalizedName.set(normalizedName);
    this.hoveredPersonId.set(personId);
  }

  onTeacherSelect(personId: number | null): void {
    this.selectedPersonId.set(personId === this.selectedPersonId() ? null : personId);
  }
}
