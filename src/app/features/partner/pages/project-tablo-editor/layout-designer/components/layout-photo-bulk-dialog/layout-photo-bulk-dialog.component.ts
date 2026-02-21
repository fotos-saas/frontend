import {
  Component, ChangeDetectionStrategy, input, output, signal, inject, computed,
} from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper';
import { DropZoneComponent } from '@shared/components/drop-zone/drop-zone.component';
import { PartnerAlbumService } from '../../../../../services/partner-album.service';
import { firstValueFrom } from 'rxjs';
import type { AlbumType, MatchResult, PhotoAssignment, UploadedPhoto } from '../../../../../models/partner.models';
import type { PhotoUploadPerson } from '../layout-photo-upload-dialog/layout-photo-upload-dialog.component';

interface MatchRow {
  person: PhotoUploadPerson;
  filename: string | null;
  confidence: 'high' | 'medium' | null;
  mediaId: number | null;
  status: 'matched' | 'unmatched';
  manuallyAssigned?: boolean;
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

  /** Párosítatlan fájlok (még nem kézzel hozzárendelt) */
  readonly unmatchedFiles = signal<string[]>([]);

  /** Kézzel hozzárendelhető fájlok (unmatchedFiles - már kézzel párosítottak) */
  readonly availableFiles = computed(() => {
    const manuallyAssigned = new Set(
      this.matchRows()
        .filter(r => r.status === 'matched' && r.manuallyAssigned)
        .map(r => r.filename),
    );
    return this.unmatchedFiles().filter(f => !manuallyAssigned.has(f));
  });

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

      // Hozzárendelés (override mód esetén a backend is beállítja az override_photo_id-t)
      const result = await firstValueFrom(
        this.albumService.assignPhotos(this.projectId(), assignments, this.uploadMode() === 'override'),
      );

      this.photosAssigned.emit({ assignedCount: result.assignedCount });
    } catch {
      this.errorMessage.set('Váratlan hiba a mentés során.');
    }

    this.saving.set(false);
  }

  /** Kézi párosítás: fájl hozzárendelése személyhez */
  manualAssign(personId: number, filename: string): void {
    if (!filename) return;

    // Fájlnév alapján megkeressük a mediaId-t
    const photo = this.uploadedPhotos().find(p => p.filename === filename);
    if (!photo) return;

    this.matchRows.update(rows => rows.map(r => {
      if (r.person.id === personId) {
        return {
          ...r,
          filename,
          mediaId: photo.mediaId,
          status: 'matched' as const,
          confidence: null,
          manuallyAssigned: true,
        };
      }
      return r;
    }));
  }

  /** Kézi párosítás visszavonása */
  clearManualAssign(personId: number): void {
    this.matchRows.update(rows => rows.map(r => {
      if (r.person.id === personId && r.manuallyAssigned) {
        return {
          ...r,
          filename: null,
          mediaId: null,
          status: 'unmatched' as const,
          confidence: null,
          manuallyAssigned: false,
        };
      }
      return r;
    }));
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
