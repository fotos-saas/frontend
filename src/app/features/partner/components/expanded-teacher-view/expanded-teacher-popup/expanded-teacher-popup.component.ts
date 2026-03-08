import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, switchMap } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';
import { PartnerTeacherService } from '../../../services/partner-teacher.service';
import { TeacherPhotoChooserDialogComponent } from '../../teacher-photo-chooser-dialog/teacher-photo-chooser-dialog.component';
import type { LinkedGroupPhoto, PhotoChooserMode } from '../../../models/teacher.models';

interface OccurrenceItem {
  personId: number;
  projectId: number;
  name: string;
  className: string;
  schoolName: string;
  hasPhoto: boolean;
  photoThumbUrl: string | null;
  hasOverride: boolean;
  archiveId: number | null;
  linkedGroup: string | null;
}

@Component({
  selector: 'app-expanded-teacher-popup',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule, TeacherPhotoChooserDialogComponent],
  templateUrl: './expanded-teacher-popup.component.html',
  styleUrl: './expanded-teacher-popup.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpandedTeacherPopupComponent {
  readonly ICONS = ICONS;
  private dataService = inject(ExpandedTeacherViewDataService);
  private teacherService = inject(PartnerTeacherService);
  private destroyRef = inject(DestroyRef);

  readonly personId = input.required<number>();
  readonly close = output<void>();

  // Archív fotók
  readonly archivePhotos = signal<LinkedGroupPhoto[]>([]);
  readonly loadingPhotos = signal(false);
  readonly showPhotoChooser = signal(false);
  readonly linking = signal(false);

  readonly occurrences = computed<OccurrenceItem[]>(() => {
    const viewData = this.dataService.data();
    const pid = this.personId();
    if (!viewData) return [];

    let targetNormalized: string | null = null;
    for (const cls of viewData.classes) {
      const found = cls.teachers.find(t => t.personId === pid);
      if (found) {
        targetNormalized = found.normalizedName;
        break;
      }
    }
    if (!targetNormalized) return [];

    const items: OccurrenceItem[] = [];
    for (const cls of viewData.classes) {
      for (const t of cls.teachers) {
        if (t.normalizedName === targetNormalized) {
          items.push({
            personId: t.personId,
            projectId: cls.projectId,
            name: t.name,
            className: cls.className,
            schoolName: cls.schoolName,
            hasPhoto: t.hasPhoto,
            photoThumbUrl: t.photoThumbUrl,
            hasOverride: t.hasOverride,
            archiveId: t.archiveId,
            linkedGroup: t.linkedGroup,
          });
        }
      }
    }
    return items;
  });

  readonly teacherName = computed(() => {
    const items = this.occurrences();
    return items.length > 0 ? items[0].name : '';
  });

  readonly hasNameVariants = computed(() => {
    const items = this.occurrences();
    const names = new Set(items.map(i => i.name));
    return names.size > 1;
  });

  readonly firstArchiveId = computed<number | null>(() => {
    const items = this.occurrences();
    return items.find(i => i.archiveId)?.archiveId ?? null;
  });

  /** Összes egyedi archiveId az előfordulások között */
  readonly allArchiveIds = computed<number[]>(() => {
    const items = this.occurrences();
    return [...new Set(items.map(i => i.archiveId).filter((id): id is number => id !== null))];
  });

  readonly firstLinkedGroup = computed<string | null>(() => {
    const items = this.occurrences();
    return items.find(i => i.linkedGroup)?.linkedGroup ?? null;
  });

  readonly canLink = computed(() => {
    const items = this.occurrences();
    const withArchive = items.filter(i => i.archiveId);
    if (withArchive.length < 2) return false;
    const groups = new Set(withArchive.map(i => i.linkedGroup).filter(Boolean));
    // Ha nincs group, vagy több group van, vagy nem mind ugyanabban a group-ban
    return groups.size !== 1 || withArchive.some(i => !i.linkedGroup);
  });

  readonly activeArchivePhoto = computed<LinkedGroupPhoto | null>(() => {
    const photos = this.archivePhotos();
    return photos.find(p => p.isActive) ?? photos[0] ?? null;
  });

  readonly photoChooserMode = computed<PhotoChooserMode | null>(() => {
    const lg = this.firstLinkedGroup();
    if (lg) return { kind: 'linkedGroup', linkedGroup: lg };
    const aid = this.firstArchiveId();
    if (aid) return { kind: 'individual', archiveId: aid, teacherName: this.teacherName() };
    return null;
  });

  // Feltöltött fotó egyezés keresés
  readonly uploadedPhotoMatch = computed(() => {
    const viewData = this.dataService.data();
    const items = this.occurrences();
    if (!viewData || items.length === 0) return null;

    const targetName = items[0].name.toLowerCase().trim();
    return viewData.uploadedPhotos.find(p => {
      const nameFromFile = p.filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').toLowerCase().trim();
      return nameFromFile === targetName;
    }) ?? null;
  });

  constructor() {
    effect(() => {
      const linkedGroup = this.firstLinkedGroup();
      const archiveIds = this.allArchiveIds();

      if (linkedGroup) {
        this.loadingPhotos.set(true);
        this.teacherService.getLinkedGroupPhotos(linkedGroup)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              this.archivePhotos.set(res.data);
              this.loadingPhotos.set(false);
            },
            error: () => this.loadingPhotos.set(false),
          });
      } else if (archiveIds.length > 0) {
        this.loadingPhotos.set(true);
        this.loadAllArchivePhotos(archiveIds);
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  openPhotoChooser(): void {
    this.showPhotoChooser.set(true);
  }

  onPhotoChooserSaved(selectedMediaId: number): void {
    this.showPhotoChooser.set(false);
    const archiveIds = this.allArchiveIds();

    // Ha több nem-linkelt archívum van, csendben összekapcsoljuk + fotó beállítás
    if (!this.firstLinkedGroup() && archiveIds.length > 1) {
      this.autoLinkAndSetPhoto(archiveIds, selectedMediaId);
      return;
    }

    // Fotók újratöltés
    this.reloadPhotos();
    this.dataService.reloadData();
  }

  applyOverride(personId: number): void {
    const activePhoto = this.activeArchivePhoto();
    if (!activePhoto) return;
    this.dataService.setOverrideFromArchive(personId, activePhoto.mediaId);
  }

  applyArchiveToAll(): void {
    const activePhoto = this.activeArchivePhoto();
    if (!activePhoto) return;

    const linkedGroup = this.firstLinkedGroup();
    const archiveIds = this.allArchiveIds();

    if (linkedGroup) {
      this.teacherService.setGroupActivePhoto(linkedGroup, activePhoto.mediaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => this.dataService.reloadData() });
    } else if (archiveIds.length > 1) {
      // Több nem-linkelt archívum → csendben összekapcsoljuk + fotó beállítás
      this.autoLinkAndSetPhoto(archiveIds, activePhoto.mediaId);
    } else if (archiveIds.length === 1) {
      this.teacherService.setActivePhotoByMedia(archiveIds[0], activePhoto.mediaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => this.dataService.reloadData() });
    }
  }

  removeOverride(personId: number): void {
    this.dataService.removeOverride(personId);
  }

  /** Több archívum fotóit egyszerre betölti és deduplikálva összevonja */
  private loadAllArchivePhotos(archiveIds: number[]): void {
    if (archiveIds.length === 1) {
      this.teacherService.getTeacherPhotos(archiveIds[0])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (res) => {
            this.archivePhotos.set(res.data);
            this.loadingPhotos.set(false);
          },
          error: () => this.loadingPhotos.set(false),
        });
      return;
    }

    const requests = archiveIds.map(id => this.teacherService.getTeacherPhotos(id));
    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          // Összes fotó összevonása, mediaId alapján deduplikálva
          const seen = new Set<number>();
          const merged: LinkedGroupPhoto[] = [];
          for (const res of results) {
            for (const photo of res.data) {
              if (!seen.has(photo.mediaId)) {
                seen.add(photo.mediaId);
                merged.push(photo);
              }
            }
          }
          this.archivePhotos.set(merged);
          this.loadingPhotos.set(false);
        },
        error: () => this.loadingPhotos.set(false),
      });
  }

  /** Csendben összekapcsolja a tanárokat, majd beállítja a fotót a csoportra */
  private autoLinkAndSetPhoto(archiveIds: number[], mediaId: number): void {
    this.teacherService.linkTeachers(archiveIds)
      .pipe(
        switchMap(res =>
          this.teacherService.setGroupActivePhoto(res.data.linkedGroup, mediaId)
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => this.dataService.reloadData() });
  }

  /** Fotólista újratöltése a jelenlegi állapot szerint */
  private reloadPhotos(): void {
    const linkedGroup = this.firstLinkedGroup();
    if (linkedGroup) {
      this.teacherService.getLinkedGroupPhotos(linkedGroup)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (res) => this.archivePhotos.set(res.data) });
    } else {
      const archiveIds = this.allArchiveIds();
      if (archiveIds.length > 0) this.loadAllArchivePhotos(archiveIds);
    }
  }

  linkTeachers(): void {
    const archiveIds = this.occurrences()
      .map(o => o.archiveId)
      .filter((id): id is number => id !== null);

    const uniqueIds = [...new Set(archiveIds)];
    if (uniqueIds.length < 2 || this.linking()) return;

    this.linking.set(true);
    this.teacherService.linkTeachers(uniqueIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.linking.set(false);
          this.dataService.reloadData();
        },
        error: () => this.linking.set(false),
      });
  }
}
