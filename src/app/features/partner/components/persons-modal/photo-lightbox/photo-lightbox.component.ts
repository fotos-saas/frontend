import { Component, ChangeDetectionStrategy, input, output, computed, inject, DestroyRef, OnInit, signal, effect } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { TabloPersonItem } from '../persons-modal.types';
import { PartnerAlbumService } from '../../../services/partner-album.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import { PersonPhoto } from '../../../models/partner.models';

/**
 * Lightbox komponens képek nagyított nézetéhez navigációval + archív fotó strip.
 */
@Component({
  selector: 'app-photo-lightbox',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './photo-lightbox.component.html',
  styleUrl: './photo-lightbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoLightboxComponent implements OnInit {
  readonly ICONS = ICONS;
  private destroyRef = inject(DestroyRef);
  private albumService = inject(PartnerAlbumService);
  private projectService = inject(PartnerProjectService);

  readonly person = input<TabloPersonItem | null>(null);
  readonly personsWithPhotos = input<TabloPersonItem[]>([]);
  readonly projectId = input<number>(0);

  readonly close = output<void>();
  readonly navigate = output<TabloPersonItem>();
  readonly photoChanged = output<{
    personId: number;
    hasPhoto: boolean;
    photoThumbUrl: string | null;
    photoUrl: string | null;
    hasOverride: boolean;
  }>();

  archivePhotos = signal<PersonPhoto[]>([]);
  archiveLoading = signal(false);

  readonly canNavigatePrev = computed(() => {
    const p = this.person();
    if (!p) return false;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    return idx > 0;
  });

  readonly canNavigateNext = computed(() => {
    const p = this.person();
    if (!p) return false;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    return idx < list.length - 1;
  });

  readonly showArchiveStrip = computed(() => {
    const p = this.person();
    return p && p.type === 'teacher' && p.archiveId && this.archivePhotos().length > 1;
  });

  constructor() {
    // Amikor a person változik, betöltjük az archív fotókat
    effect(() => {
      const p = this.person();
      if (p && p.type === 'teacher' && p.archiveId && this.projectId()) {
        this.loadArchivePhotos(this.projectId(), p.id);
      } else {
        this.archivePhotos.set([]);
      }
    });
  }

  ngOnInit(): void {
    const handler = (event: KeyboardEvent) => this.onKeydown(event);
    document.addEventListener('keydown', handler, true);
    this.destroyRef.onDestroy(() => document.removeEventListener('keydown', handler, true));
  }

  private loadArchivePhotos(projectId: number, personId: number): void {
    this.archiveLoading.set(true);
    this.albumService.getPersonPhotos(projectId, personId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.archivePhotos.set(res.photos);
          this.archiveLoading.set(false);
        },
        error: () => {
          this.archivePhotos.set([]);
          this.archiveLoading.set(false);
        }
      });
  }

  selectArchivePhoto(photo: PersonPhoto, event: MouseEvent): void {
    event.stopPropagation();
    const p = this.person();
    if (!p) return;

    this.projectService.overridePersonPhoto(this.projectId(), p.id, photo.mediaId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.photoChanged.emit({
            personId: p.id,
            hasPhoto: res.data.hasPhoto,
            photoThumbUrl: res.data.photoThumbUrl,
            photoUrl: res.data.photoUrl,
            hasOverride: res.data.hasOverride,
          });
        }
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.person()) return;

    switch (event.key) {
      case 'Escape':
        event.stopImmediatePropagation();
        this.close.emit();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.navigatePrevInternal();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.navigateNextInternal();
        break;
    }
  }

  navigatePrev(event: MouseEvent): void {
    event.stopPropagation();
    this.navigatePrevInternal();
  }

  navigateNext(event: MouseEvent): void {
    event.stopPropagation();
    this.navigateNextInternal();
  }

  private navigatePrevInternal(): void {
    const p = this.person();
    if (!p) return;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    if (idx > 0) {
      this.navigate.emit(list[idx - 1]);
    }
  }

  private navigateNextInternal(): void {
    const p = this.person();
    if (!p) return;
    const list = this.personsWithPhotos();
    const idx = list.findIndex(item => item.id === p.id);
    if (idx < list.length - 1) {
      this.navigate.emit(list[idx + 1]);
    }
  }
}
