import { Injectable, inject, signal } from '@angular/core';
import { SnapshotLayer } from '@core/services/electron.types';
import { TabloPersonItem } from '../../../models/partner.models';
import { PhotoshopService } from '../../../services/photoshop.service';
import { PartnerProjectService } from '../../../services/partner-project.service';
import { LayoutDesignerStateService } from './layout-designer-state.service';
import { PhotoUploadPerson, PhotoUploadResult } from './components/layout-photo-upload-dialog/layout-photo-upload-dialog.component';
import { firstValueFrom } from 'rxjs';

/**
 * LayoutDesignerPsBridgeService — PS műveletek: refresh, sync, arrangeNames, updatePositions,
 * placePhotos, link/unlink, extra names.
 */
@Injectable()
export class LayoutDesignerPsBridgeService {
  private readonly state = inject(LayoutDesignerStateService);
  private readonly ps = inject(PhotoshopService);
  private readonly projectService = inject(PartnerProjectService);

  readonly linking = signal(false);
  readonly placingPhotos = signal(false);
  readonly syncingPhotos = signal(false);
  readonly arrangingNames = signal(false);
  readonly updatingPositions = signal(false);
  readonly insertingExtraNames = signal(false);
  readonly extraNamesSuccess = signal<string | null>(null);
  readonly extraNamesError = signal<string | null>(null);

  /** Getter-ek — a komponens set-eli ezeket */
  private _psdPath = '';
  private _persons: TabloPersonItem[] = [];
  private _projectId = 0;
  private _extraNames: { students: string; teachers: string } | null = null;
  private _autoSaveEmitter: ((layers: SnapshotLayer[]) => void) | null = null;
  private _extraNamesUpdatedEmitter: ((en: { students: string; teachers: string }) => void) | null = null;
  private _showPhotoDialogSetter: ((v: PhotoUploadPerson | null) => void) | null = null;
  private _showBulkPhotoDialogSetter: ((v: boolean) => void) | null = null;
  private _refreshFn: (() => Promise<void>) | null = null;

  configure(opts: {
    psdPath: string;
    persons: TabloPersonItem[];
    projectId: number;
    extraNames: { students: string; teachers: string } | null;
    autoSaveEmitter: (layers: SnapshotLayer[]) => void;
    extraNamesUpdatedEmitter: (en: { students: string; teachers: string }) => void;
    showPhotoDialogSetter: (v: PhotoUploadPerson | null) => void;
    showBulkPhotoDialogSetter: (v: boolean) => void;
    refreshFn: () => Promise<void>;
  }): void {
    this._psdPath = opts.psdPath;
    this._persons = opts.persons;
    this._projectId = opts.projectId;
    this._extraNames = opts.extraNames;
    this._autoSaveEmitter = opts.autoSaveEmitter;
    this._extraNamesUpdatedEmitter = opts.extraNamesUpdatedEmitter;
    this._showPhotoDialogSetter = opts.showPhotoDialogSetter;
    this._showBulkPhotoDialogSetter = opts.showBulkPhotoDialogSetter;
    this._refreshFn = opts.refreshFn;
  }

  updateContext(persons: TabloPersonItem[], extraNames: { students: string; teachers: string } | null): void {
    this._persons = persons;
    this._extraNames = extraNames;
  }

  /** Összes fotó szinkronizálása a Photoshopba */
  async syncAllPhotos(): Promise<void> {
    const layers = this.state.layers();
    const photosToSync: Array<{ layerName: string; photoUrl: string }> = [];
    for (const l of layers) {
      if ((l.category === 'student-image' || l.category === 'teacher-image') && l.personMatch?.photoUrl) {
        photosToSync.push({ layerName: l.layerName, photoUrl: l.personMatch.photoUrl });
      }
    }
    if (photosToSync.length === 0) return;
    this.syncingPhotos.set(true);
    try { await this.ps.placePhotos(photosToSync); } finally { this.syncingPhotos.set(false); }
  }

  /** Nevek igazítása */
  async arrangeNames(): Promise<void> {
    this.arrangingNames.set(true);
    try { await this.ps.arrangeNames(undefined, this.getLinkedLayerNames()); } finally { this.arrangingNames.set(false); }
  }

  /** Pozíció frissítése */
  async updatePositions(): Promise<void> {
    this.updatingPositions.set(true);
    try {
      const allPersons = this._persons;
      const selectedIds = this.state.selectedLayerIds();
      let personsToUpdate: typeof allPersons;
      if (selectedIds.size > 0) {
        const selectedPersonIds = new Set<number>();
        for (const layer of this.state.layers()) {
          if (selectedIds.has(layer.layerId) && layer.personMatch) selectedPersonIds.add(layer.personMatch.id);
        }
        personsToUpdate = allPersons.filter(p => selectedPersonIds.has(p.id));
      } else {
        personsToUpdate = allPersons;
      }
      if (personsToUpdate.length === 0) return;
      await this.ps.updatePositions(
        personsToUpdate.map(p => ({ id: p.id, name: p.name, type: p.type, title: p.title })),
        undefined, this.getLinkedLayerNames(),
      );
    } finally { this.updatingPositions.set(false); }
  }

  onOpenProject(): void { if (this._psdPath) this.ps.openPsdFile(this._psdPath); }
  onOpenWorkDir(): void { if (this._psdPath) this.ps.revealInFinder(this._psdPath); }

  /** Extra nevek beillesztése */
  async onInsertExtraNames(options: { includeStudents: boolean; includeTeachers: boolean }): Promise<void> {
    if (!this._extraNames) return;
    this.insertingExtraNames.set(true);
    this.extraNamesSuccess.set(null);
    this.extraNamesError.set(null);
    try {
      const result = await this.ps.addExtraNames(this._extraNames, options);
      if (result.success) {
        this.extraNamesSuccess.set('Extra nevek beillesztve');
        this._autoSaveEmitter?.(this.state.exportChanges());
      } else {
        this.extraNamesError.set(result.error || 'Extra nevek beillesztése sikertelen');
      }
    } catch { this.extraNamesError.set('Váratlan hiba az extra nevek beillesztésekor'); }
    finally { this.insertingExtraNames.set(false); }
  }

  /** Extra nevek dialógusból: mentés backendre + beillesztés PSD-be */
  async onExtraNamesDialogInsert(event: {
    extraNames: { students: string; teachers: string };
    includeStudents: boolean;
    includeTeachers: boolean;
  }): Promise<void> {
    this.insertingExtraNames.set(true);
    this.extraNamesSuccess.set(null);
    this.extraNamesError.set(null);
    try {
      const saveResult = await firstValueFrom(this.projectService.updateExtraNames(this._projectId, event.extraNames));
      this._extraNamesUpdatedEmitter?.(saveResult.data.extraNames);
      const result = await this.ps.addExtraNames(
        saveResult.data.extraNames,
        { includeStudents: event.includeStudents, includeTeachers: event.includeTeachers },
      );
      if (result.success) {
        this.extraNamesSuccess.set('Extra nevek mentve és beillesztve');
        this._autoSaveEmitter?.(this.state.exportChanges());
      } else {
        this.extraNamesError.set(result.error || 'Extra nevek beillesztése sikertelen');
      }
    } catch { this.extraNamesError.set('Váratlan hiba az extra nevek mentésekor'); }
    finally { this.insertingExtraNames.set(false); }
  }

  /** Fotók behelyezése */
  async placePhotos(layers: Array<{ layerName: string; photoUrl: string }>): Promise<void> {
    this.placingPhotos.set(true);
    try { await this.ps.placePhotos(layers); } finally { this.placingPhotos.set(false); }
  }

  /** Single fotó feltöltés sikeres → Photoshopba behelyezés */
  async onPhotoUploaded(result: PhotoUploadResult): Promise<void> {
    this._showPhotoDialogSetter?.(null);
    const selected = this.state.selectedLayers();
    const targetLayers = selected.filter(
      l => (l.category === 'student-image' || l.category === 'teacher-image') && l.personMatch?.id === result.personId,
    );
    if (targetLayers.length > 0 && result.photoUrl) {
      await this.placePhotos(targetLayers.map(l => ({ layerName: l.layerName, photoUrl: result.photoUrl })));
    }
    this.refreshPersonsInState();
  }

  /** Bulk fotó feltöltés sikeres */
  onBulkPhotosAssigned(_result: { assignedCount: number }): void {
    this._showBulkPhotoDialogSetter?.(false);
    this.refreshPersonsInState();
  }

  /** Link/Unlink */
  onLinkLayers(): void {
    const names = this.getSelectedLayerNames();
    if (names.length === 0) return;
    this.linkLayers(names);
  }

  onUnlinkLayers(): void {
    const names = this.getSelectedLayerNames();
    if (names.length === 0) return;
    this.unlinkLayers(names);
  }

  async linkLayers(layerNames: string[]): Promise<void> {
    this.linking.set(true);
    try {
      const result = await this.ps.linkLayers(layerNames);
      if (result.success) this.updateLinkedState(layerNames, true);
    } finally { this.linking.set(false); }
  }

  async unlinkLayers(layerNames: string[]): Promise<void> {
    this.linking.set(true);
    try {
      const result = await this.ps.unlinkLayers(layerNames);
      if (result.success) this.updateLinkedState(layerNames, false);
    } finally { this.linking.set(false); }
  }

  private getLinkedLayerNames(): string[] {
    const nameSet = new Set<string>();
    for (const l of this.state.layers()) { if (l.linked) nameSet.add(l.layerName); }
    return Array.from(nameSet);
  }

  private getSelectedLayerNames(): string[] {
    const nameSet = new Set<string>();
    for (const l of this.state.selectedLayers()) { if (l.category !== 'fixed') nameSet.add(l.layerName); }
    return Array.from(nameSet);
  }

  private updateLinkedState(layerNames: string[], linked: boolean): void {
    const nameSet = new Set(layerNames);
    this.state.layers.set(this.state.layers().map(l => nameSet.has(l.layerName) ? { ...l, linked } : l));
  }

  private refreshPersonsInState(): void {
    firstValueFrom(this.projectService.getProjectPersons(this._projectId)).then(res => {
      const personMap = new Map(res.data.map(p => [p.id, p]));
      this.state.layers.set(this.state.layers().map(l => {
        if (!l.personMatch) return l;
        const person = personMap.get(l.personMatch.id);
        if (!person) return l;
        return { ...l, personMatch: { ...l.personMatch, photoThumbUrl: person.photoThumbUrl, photoUrl: person.photoUrl } };
      }));
    });
  }
}
