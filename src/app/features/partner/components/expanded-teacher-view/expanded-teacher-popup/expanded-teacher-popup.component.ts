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
import { FormsModule } from '@angular/forms';
import { forkJoin, switchMap } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ExpandedTeacherViewDataService } from '../expanded-teacher-view-data.service';
import { PartnerTeacherService } from '../../../services/partner-teacher.service';
import { TeacherPhotoChooserDialogComponent } from '../../teacher-photo-chooser-dialog/teacher-photo-chooser-dialog.component';
import { ConfirmDialogComponent, ConfirmDialogResult } from '@shared/components/confirm-dialog/confirm-dialog.component';
import type { LinkedGroupPhoto, PhotoChooserMode } from '../../../models/teacher.models';

interface OccurrenceItem {
  personId: number;
  projectId: number;
  name: string;
  title: string | null;
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
  imports: [LucideAngularModule, MatTooltipModule, TeacherPhotoChooserDialogComponent, ConfirmDialogComponent, FormsModule],
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
  /** Auto-link után beállított linkedGroup (amíg a data reload nem frissíti) */
  private linkedGroupOverride = signal<string | null>(null);
  /** Kiválasztott fotó a strip-ből — döntésre vár (mindenkinek / csak itt) */
  readonly pendingPhoto = signal<LinkedGroupPhoto | null>(null);

  // Szerkesztés
  readonly editingPersonId = signal<number | null>(null);
  readonly editName = signal('');
  readonly editTitle = signal('');

  // Törlés
  readonly deleteConfirmPersonId = signal<number | null>(null);

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
            title: t.title,
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
    const lg = this.linkedGroupOverride() ?? this.firstLinkedGroup();
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
    const archiveIds = this.allArchiveIds();
    // Ha több nem-linkelt archívum van, csendben link-eljük → data reload → utána nyitjuk
    if (!this.firstLinkedGroup() && archiveIds.length > 1) {
      this.autoLinkThenOpen(archiveIds);
      return;
    }
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

  selectArchivePhoto(photo: LinkedGroupPhoto): void {
    // Ha több előfordulás van, kérdezzük meg: mindenkinek vagy csak itt
    if (this.occurrences().length > 1) {
      this.pendingPhoto.set(photo);
      return;
    }
    // Egyetlen előfordulás → egyből alkalmazzuk mindenkire
    this.applyPhotoToAll(photo.mediaId);
  }

  /** Pending fotó alkalmazása mindenkire (archív aktív fotó) */
  confirmPhotoForAll(): void {
    const photo = this.pendingPhoto();
    if (!photo) return;
    this.pendingPhoto.set(null);
    this.applyPhotoToAll(photo.mediaId);
  }

  /** Pending fotó alkalmazása csak az aktuális személyhez (override) */
  confirmPhotoForCurrent(): void {
    const photo = this.pendingPhoto();
    if (!photo) return;
    this.pendingPhoto.set(null);
    this.dataService.setOverrideFromArchive(this.personId(), photo.mediaId);
  }

  cancelPendingPhoto(): void {
    this.pendingPhoto.set(null);
  }

  /** Fotó beállítása az összes előfordulásra (archív aktív fotó) */
  private applyPhotoToAll(mediaId: number): void {
    const linkedGroup = this.linkedGroupOverride() ?? this.firstLinkedGroup();
    const archiveIds = this.allArchiveIds();

    if (linkedGroup) {
      this.teacherService.setGroupActivePhoto(linkedGroup, mediaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => { this.reloadPhotos(); this.dataService.reloadData(); } });
    } else if (archiveIds.length > 1) {
      this.autoLinkAndSetPhoto(archiveIds, mediaId);
    } else if (archiveIds.length === 1) {
      this.teacherService.setActivePhotoByMedia(archiveIds[0], mediaId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ next: () => { this.reloadPhotos(); this.dataService.reloadData(); } });
    }
  }

  applyOverride(personId: number): void {
    const activePhoto = this.activeArchivePhoto();
    if (!activePhoto) return;
    this.dataService.setOverrideFromArchive(personId, activePhoto.mediaId);
  }

  applyArchiveToAll(): void {
    const activePhoto = this.activeArchivePhoto();
    if (!activePhoto) return;

    const linkedGroup = this.linkedGroupOverride() ?? this.firstLinkedGroup();
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
        switchMap(res => {
          this.linkedGroupOverride.set(res.data.linkedGroup);
          return this.teacherService.setGroupActivePhoto(res.data.linkedGroup, mediaId);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ next: () => { this.reloadPhotos(); this.dataService.reloadData(); } });
  }

  /** Csendben link-el, majd megnyitja a fotóválasztó dialógust linkedGroup módban */
  private autoLinkThenOpen(archiveIds: number[]): void {
    this.teacherService.linkTeachers(archiveIds)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.linkedGroupOverride.set(res.data.linkedGroup);
          this.archivePhotos.set(res.data.photos);
          this.dataService.reloadData();
          this.showPhotoChooser.set(true);
        },
      });
  }

  /** Fotólista újratöltése a jelenlegi állapot szerint */
  private reloadPhotos(): void {
    const linkedGroup = this.linkedGroupOverride() ?? this.firstLinkedGroup();
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

  // Szerkesztés
  startEdit(item: OccurrenceItem): void {
    this.editingPersonId.set(item.personId);
    this.editName.set(item.name);
    this.editTitle.set(item.title ?? '');
  }

  cancelEdit(): void {
    this.editingPersonId.set(null);
    this.editName.set('');
    this.editTitle.set('');
  }

  saveEdit(item: OccurrenceItem): void {
    const name = this.editName().trim();
    if (!name) return;
    this.dataService.updateTeacher(item.projectId, item.personId, {
      name,
      title: this.editTitle().trim() || null,
    });
    this.editingPersonId.set(null);
  }

  onEditKeydown(event: KeyboardEvent, item: OccurrenceItem): void {
    if (event.key === 'Enter') {
      this.saveEdit(item);
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  // Törlés
  confirmDelete(personId: number): void {
    this.deleteConfirmPersonId.set(personId);
  }

  onDeleteResult(result: ConfirmDialogResult): void {
    const personId = this.deleteConfirmPersonId();
    this.deleteConfirmPersonId.set(null);
    if (result.action !== 'confirm' || !personId) return;

    const item = this.occurrences().find(o => o.personId === personId);
    if (!item) return;

    this.dataService.deleteTeacher(item.projectId, personId);
    // Ha nincs több előfordulás, zárd be a popup-ot
    if (this.occurrences().length <= 1) {
      this.close.emit();
    }
  }
}
