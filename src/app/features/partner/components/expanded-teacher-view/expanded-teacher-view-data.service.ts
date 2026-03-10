import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpEventType, HttpResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { PartnerTeacherService } from '../../services/partner-teacher.service';
import { PartnerProjectService } from '../../services/partner-project.service';
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
  readonly assigningPersonIds = signal<Set<number>>(new Set());
  readonly pendingDrop = signal<PendingDrop | null>(null);

  // Hover/kijelölés
  readonly hoveredPersonId = signal<number | null>(null);
  readonly hoveredNormalizedName = signal<string | null>(null);
  readonly selectedPersonId = signal<number | null>(null);

  // Tanár keresés
  readonly teacherSearch = signal('');

  // Feltöltési terület
  readonly uploadPanelCollapsed = signal(false);
  readonly uploadProgress = signal<number>(0);

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

  /** linkedGroup UUID → sorszám (1, 2, 3...) mapping — csak ha a nézetben legalább 2 tanár tartozik hozzá */
  readonly linkedGroupNumbers = computed<Map<string, number>>(() => {
    const viewData = this.data();
    if (!viewData) return new Map();

    // Számolja hány tanár tartozik az egyes linkedGroup-okhoz a nézetben
    const groupCounts = new Map<string, number>();
    for (const cls of viewData.classes) {
      for (const teacher of cls.teachers) {
        if (teacher.linkedGroup) {
          groupCounts.set(teacher.linkedGroup, (groupCounts.get(teacher.linkedGroup) ?? 0) + 1);
        }
      }
    }

    // Csak azokat számozza, amelyekhez legalább 2 tanár tartozik
    const groupMap = new Map<string, number>();
    let counter = 1;
    for (const [group, count] of groupCounts) {
      if (count >= 2) {
        groupMap.set(group, counter++);
      }
    }
    return groupMap;
  });

  private projectService = inject(PartnerProjectService);
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
    this.uploadProgress.set(0);
    this.teacherService.uploadPhotosToSession(sid, files).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          this.uploadProgress.set(Math.round((100 * event.loaded) / event.total));
        } else if (event instanceof HttpResponse) {
          const response = event.body;
          if (response) {
            const current = this.data();
            if (current) {
              this.data.set({
                ...current,
                uploadedPhotos: [...response.photos, ...current.uploadedPhotos],
              });
            }
          }
          this.uploading.set(false);
          this.uploadProgress.set(0);
        }
      },
      error: (err) => {
        this.logger.error('Fotó feltöltési hiba', err);
        this.uploading.set(false);
        this.uploadProgress.set(0);
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

  deleteAllPhotos(): void {
    const sid = this.sessionId();
    if (!sid) return;

    this.teacherService.deleteAllSessionPhotos(sid).subscribe({
      next: () => {
        const current = this.data();
        if (current) {
          this.data.set({
            ...current,
            uploadedPhotos: [],
          });
        }
      },
      error: (err) => {
        this.logger.error('Összes fotó törlési hiba', err);
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
    this.assigningPersonIds.set(new Set(personIds));
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
        this.assigningPersonIds.set(new Set());
        this.draggedPhoto.set(null);
      },
      error: (err) => {
        this.logger.error('Fotó hozzárendelési hiba', err);
        this.assigning.set(false);
        this.assigningPersonIds.set(new Set());
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

  setOverrideFromArchive(personId: number, mediaId: number): void {
    const viewData = this.data();
    if (!viewData) return;

    let projectId: number | null = null;
    for (const cls of viewData.classes) {
      if (cls.teachers.some(t => t.personId === personId)) {
        projectId = cls.projectId;
        break;
      }
    }
    if (!projectId) return;

    this.teacherService.setOverridePhoto(projectId, personId, mediaId).subscribe({
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
        this.logger.error('Override beállítási hiba', err);
      },
    });
  }

  setOverrideFromArchiveForAll(personIds: number[], mediaId: number): void {
    const viewData = this.data();
    if (!viewData || personIds.length === 0) return;

    const requests = personIds.map(pid => {
      let projectId: number | null = null;
      for (const cls of viewData.classes) {
        if (cls.teachers.some(t => t.personId === pid)) {
          projectId = cls.projectId;
          break;
        }
      }
      return projectId ? this.teacherService.setOverridePhoto(projectId, pid, mediaId) : null;
    }).filter((r): r is NonNullable<typeof r> => r !== null);

    if (requests.length === 0) return;

    forkJoin(requests).subscribe({
      next: (responses) => {
        const current = this.data();
        if (!current) return;

        const resultMap = new Map<number, { hasPhoto: boolean; hasOverride: boolean; photoThumbUrl: string | null }>();
        responses.forEach((resp, i) => {
          resultMap.set(personIds[i], resp.data);
        });

        this.data.set({
          ...current,
          classes: current.classes.map(cls => ({
            ...cls,
            teachers: cls.teachers.map(t => {
              const result = resultMap.get(t.personId);
              return result
                ? { ...t, hasPhoto: result.hasPhoto, hasOverride: result.hasOverride, photoThumbUrl: result.photoThumbUrl ?? '' }
                : t;
            }),
          })),
        });
      },
      error: (err) => {
        this.logger.error('Tömeges override beállítási hiba', err);
      },
    });
  }

  /** Tanár hozzáadása egy projekthez (osztályhoz) */
  addTeacher(projectId: number, name: string): void {
    this.projectService.addPersons(projectId, name, 'teacher').subscribe({
      next: () => this.reloadData(),
      error: (err) => this.logger.error('Tanár hozzáadási hiba', err),
    });
  }

  /** Tanár nevének/pozíciójának módosítása */
  updateTeacher(projectId: number, personId: number, data: { name?: string; title?: string | null }): void {
    this.projectService.updatePerson(projectId, personId, data).subscribe({
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
                  ? { ...t, name: result.name, title: result.title }
                  : t
              ),
            })),
          });
        }
      },
      error: (err) => this.logger.error('Tanár módosítási hiba', err),
    });
  }

  /** Tanár törlése egy projektből */
  deleteTeacher(projectId: number, personId: number): void {
    this.projectService.deletePerson(projectId, personId).subscribe({
      next: () => {
        const current = this.data();
        if (current) {
          this.data.set({
            ...current,
            classes: current.classes.map(cls => ({
              ...cls,
              teachers: cls.teachers.filter(t => t.personId !== personId),
            })),
          });
        }
        // Ha a törölt tanár volt kiválasztva, zárd be a popup-ot
        if (this.selectedPersonId() === personId) {
          this.selectedPersonId.set(null);
        }
      },
      error: (err) => this.logger.error('Tanár törlési hiba', err),
    });
  }

  reloadData(): void {
    if (this.sourceProjectId) {
      this.loadData(this.sourceProjectId);
    }
  }

  onTeacherHover(normalizedName: string | null, personId: number | null): void {
    this.hoveredNormalizedName.set(normalizedName);
    this.hoveredPersonId.set(personId);
  }

  onTeacherSelect(personId: number | null): void {
    this.selectedPersonId.set(personId === this.selectedPersonId() ? null : personId);
  }
}
