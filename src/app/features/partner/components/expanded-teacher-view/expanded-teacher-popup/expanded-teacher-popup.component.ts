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
      const archiveId = this.firstArchiveId();

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
      } else if (archiveId) {
        this.loadingPhotos.set(true);
        this.teacherService.getTeacherPhotos(archiveId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: (res) => {
              this.archivePhotos.set(res.data);
              this.loadingPhotos.set(false);
            },
            error: () => this.loadingPhotos.set(false),
          });
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  openPhotoChooser(): void {
    this.showPhotoChooser.set(true);
  }

  onPhotoChooserSaved(): void {
    this.showPhotoChooser.set(false);
    // Fotók újratöltés
    const linkedGroup = this.firstLinkedGroup();
    const archiveId = this.firstArchiveId();
    if (linkedGroup) {
      this.teacherService.getLinkedGroupPhotos(linkedGroup)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (res) => this.archivePhotos.set(res.data) });
    } else if (archiveId) {
      this.teacherService.getTeacherPhotos(archiveId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: (res) => this.archivePhotos.set(res.data) });
    }
    this.dataService.reloadData();
  }

  applyOverride(personId: number): void {
    const activePhoto = this.activeArchivePhoto();
    if (!activePhoto) return;
    this.dataService.setOverrideFromArchive(personId, activePhoto.mediaId);
  }

  applyOverrideToAll(): void {
    const activePhoto = this.activeArchivePhoto();
    if (!activePhoto) return;
    const personIds = this.occurrences().map(o => o.personId);
    this.dataService.setOverrideFromArchiveForAll(personIds, activePhoto.mediaId);
  }

  removeOverride(personId: number): void {
    this.dataService.removeOverride(personId);
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
