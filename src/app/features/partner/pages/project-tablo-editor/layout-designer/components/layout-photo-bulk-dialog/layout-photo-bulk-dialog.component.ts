import {
  Component, ChangeDetectionStrategy, input, output, signal, inject, computed,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { DropZoneComponent } from '@shared/components/drop-zone/drop-zone.component';
import { PartnerAlbumService } from '../../../../../services/partner-album.service';
import { PartnerProjectService } from '../../../../../services/partner-project.service';
import { firstValueFrom } from 'rxjs';
import type { AlbumType, MatchResult, PhotoAssignment, UploadedPhoto } from '../../../../../models/partner.models';
import type { PhotoUploadPerson } from '../layout-photo-upload-dialog/layout-photo-upload-dialog.component';

interface MatchRow {
  person: PhotoUploadPerson;
  filename: string | null;
  confidence: 'high' | 'medium' | null;
  mediaId: number | null;
  status: 'matched' | 'unmatched';
}

/**
 * Több személy fotó feltöltése — drag & drop + AI párosítás.
 * 2 lépéses flow: 1) Upload  2) Review (AI párosítás után)
 */
@Component({
  selector: 'app-layout-photo-bulk-dialog',
  standalone: true,
  imports: [DialogWrapperComponent, DropZoneComponent, LucideAngularModule],
  templateUrl: './layout-photo-bulk-dialog.component.html',
  styleUrls: ['./layout-photo-bulk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutPhotoBulkDialogComponent {
  private readonly albumService = inject(PartnerAlbumService);
  private readonly projectService = inject(PartnerProjectService);
  protected readonly ICONS = ICONS;

  readonly persons = input.required<PhotoUploadPerson[]>();
  readonly projectId = input.required<number>();

  readonly close = output<void>();
  readonly photosAssigned = output<{ assignedCount: number }>();

  /** Aktuális lépés */
  readonly step = signal<'upload' | 'review'>('upload');

  /** Kiválasztott fájlok */
  readonly selectedFiles = signal<File[]>([]);

  /** Feltöltés mód */
  readonly uploadMode = signal<'archive' | 'override'>('override');

  /** Állapotok */
  readonly uploading = signal(false);
  readonly matching = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  /** Feltöltött fotók (a match-hez kellenek) */
  readonly uploadedPhotos = signal<UploadedPhoto[]>([]);

  /** Párosítási eredmény sorok */
  readonly matchRows = signal<MatchRow[]>([]);

  /** Párosítatlan fájlok */
  readonly unmatchedFiles = signal<string[]>([]);

  /** Dialógus cím */
  readonly title = computed(() => {
    if (this.step() === 'upload') {
      return `Fotók feltöltése — ${this.persons().length} személy kijelölve`;
    }
    return `Fotó párosítás — ${this.selectedFiles().length} kép → ${this.persons().length} személy`;
  });

  /** Párosított sorok száma */
  readonly matchedCount = computed(() =>
    this.matchRows().filter(r => r.status === 'matched').length
  );

  onFilesSelected(files: File[]): void {
    this.selectedFiles.update(prev => [...prev, ...files]);
    this.errorMessage.set(null);
  }

  clearFiles(): void {
    this.selectedFiles.set([]);
  }

  /** 1. lépés → 2. lépés: feltöltés + AI párosítás */
  async startMatching(): Promise<void> {
    const files = this.selectedFiles();
    if (files.length === 0) return;

    this.uploading.set(true);
    this.errorMessage.set(null);

    try {
      // Album típus a személyek típusa alapján
      const personTypes = new Set(this.persons().map(p => p.type));
      const albumType: AlbumType = personTypes.has('teacher') && !personTypes.has('student')
        ? 'teachers' : 'students';

      // Feltöltés pending albumba
      const uploadResult = await firstValueFrom(
        this.albumService.uploadToAlbum(this.projectId(), albumType, files),
      );

      if (!uploadResult.success) {
        this.errorMessage.set('Feltöltés sikertelen.');
        this.uploading.set(false);
        return;
      }

      this.uploadedPhotos.set(uploadResult.photos);
      this.uploading.set(false);

      // AI párosítás
      this.matching.set(true);
      const photoIds = uploadResult.photos.map(p => p.mediaId);
      const matchResult = await firstValueFrom(
        this.albumService.matchPhotos(this.projectId(), photoIds),
      );

      this.buildMatchRows(matchResult);
      this.step.set('review');
    } catch {
      this.errorMessage.set('Váratlan hiba a feltöltés/párosítás során.');
    }

    this.uploading.set(false);
    this.matching.set(false);
  }

  /** Vissza az upload lépésre */
  goBack(): void {
    this.step.set('upload');
    this.matchRows.set([]);
    this.unmatchedFiles.set([]);
  }

  /** Mentés: párosítás véglegesítése */
  async saveAssignments(): Promise<void> {
    const rows = this.matchRows().filter(r => r.status === 'matched' && r.mediaId);
    if (rows.length === 0) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      const assignments: PhotoAssignment[] = rows.map(r => ({
        personId: r.person.id,
        mediaId: r.mediaId!,
      }));

      // Hozzárendelés
      const result = await firstValueFrom(
        this.albumService.assignPhotos(this.projectId(), assignments),
      );

      // Ha override mód, minden párosítotthoz override-ot is beállítunk
      if (this.uploadMode() === 'override') {
        for (const row of rows) {
          await firstValueFrom(
            this.projectService.overridePersonPhoto(this.projectId(), row.person.id, row.mediaId!),
          );
        }
      }

      this.photosAssigned.emit({ assignedCount: result.assignedCount });
    } catch {
      this.errorMessage.set('Váratlan hiba a mentés során.');
    }

    this.saving.set(false);
  }

  /** Match eredmény → MatchRow[] (szűrve a kijelölt személyekre) */
  private buildMatchRows(result: MatchResult): void {
    const personMap = new Map(this.persons().map(p => [p.name, p]));
    const rows: MatchRow[] = [];
    const matchedPersonIds = new Set<number>();

    // Sikeres párosítások
    for (const m of result.matches) {
      const person = personMap.get(m.name);
      if (person) {
        rows.push({
          person,
          filename: m.filename,
          confidence: m.confidence,
          mediaId: m.mediaId,
          status: 'matched',
        });
        matchedPersonIds.add(person.id);
      }
    }

    // Párosítatlan személyek
    for (const person of this.persons()) {
      if (!matchedPersonIds.has(person.id)) {
        rows.push({
          person,
          filename: null,
          confidence: null,
          mediaId: null,
          status: 'unmatched',
        });
      }
    }

    this.matchRows.set(rows);
    this.unmatchedFiles.set(result.unmatchedFiles);
  }
}
