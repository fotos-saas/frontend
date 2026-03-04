import { Injectable, inject, NgZone, DestroyRef, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { OverlayUploadService, PsLayerPerson, BatchProgress } from './overlay-upload.service';
import { OverlayProjectService, PersonItem } from './overlay-project.service';
import { OverlayPhotoshopService } from './overlay-photoshop.service';
import { OverlayPollingService } from './overlay-polling.service';
import { OverlaySettingsService } from './overlay-settings.service';
import { OverlayContext, ActiveDocInfo } from '../../core/services/electron.types';

interface UploadResult {
  success: boolean;
  message?: string;
  photo?: { thumbUrl: string; url?: string };
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

/**
 * Upload panel üzleti logikája: single + batch upload, file matching, PS place.
 * Kiemelve az overlay.component.ts-ből a redundancia csökkentése érdekében.
 */
@Injectable()
export class OverlayUploadPanelService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly uploadService = inject(OverlayUploadService);
  private readonly projectService = inject(OverlayProjectService);
  private readonly ps = inject(OverlayPhotoshopService);
  private readonly polling = inject(OverlayPollingService);
  private readonly settings = inject(OverlaySettingsService);

  // === Panel állapot ===
  readonly panelOpen = signal(false);
  readonly selectedPerson = signal<PersonItem | null>(null);
  readonly searchQuery = signal('');
  readonly uploading = signal(false);
  readonly uploadResult = signal<UploadResult | null>(null);
  readonly dragOver = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly panelHeight = signal(300);

  // === Batch upload állapot ===
  readonly psLayers = signal<PsLayerPerson[]>([]);
  readonly batchUploading = signal(false);
  readonly batchProgress = signal<BatchProgress>({ done: 0, total: 0 });
  readonly placing = signal(false);
  readonly unmatchedFiles = signal<File[]>([]);
  readonly selectedUnmatchedFile = signal<File | null>(null);
  readonly matching = signal(false);
  readonly batchResult = signal<{ success: boolean; message: string } | null>(null);

  // === Privát állapot ===
  private filePreviewCache = new Map<File, string>();
  private skipLayerMerge = false;
  private static readonly PANEL_MIN_H = 200;
  private static readonly PANEL_MAX_H_OFFSET = 120;

  // Resize állapot — komponens hívja DOM event-ekből
  resizing = false;
  private resizeStartY = 0;
  private resizeStartH = 0;

  // Kontextus resolver — komponens állítja be
  private contextResolver: () => OverlayContext = () => ({ mode: 'normal' });

  setContextResolver(fn: () => OverlayContext): void {
    this.contextResolver = fn;
  }

  // === Computed ===
  readonly hasPsLayers = computed(() => this.psLayers().length > 0);
  readonly uploadableLayers = computed(() => this.psLayers().filter(l => l.file && l.uploadStatus !== 'done'));
  readonly placableLayers = computed(() => this.psLayers().filter(l => l.uploadStatus === 'done' && l.photoUrl));
  readonly filteredPersons = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.projectService.persons();
    if (!q) return list;
    return list.filter(p => p.name.toLowerCase().includes(q));
  });
  readonly canUpload = computed(() => !!this.selectedPerson() && !!this.selectedFile() && !this.uploading());

  // === Panel nyitás/zárás ===

  async openPanel(): Promise<void> {
    this.panelOpen.set(true);
    const ctx = this.contextResolver();
    let pid = await this.projectService.resolveProjectId(ctx);

    if (!pid) {
      await this.loadPsLayers();
      const layers = this.psLayers();
      if (layers.length > 0) {
        pid = await this.projectService.lookupProjectIdFromPerson(layers[0].personId);
      }
    }

    if (pid) this.projectService.loadPersons(pid);
    this.loadPsLayers();
  }

  closePanel(): void {
    this.panelOpen.set(false);
    this.selectedPerson.set(null);
    this.selectedFile.set(null);
    this.uploadResult.set(null);
    this.searchQuery.set('');
    this.batchResult.set(null);
    this.selectedUnmatchedFile.set(null);
    this.filePreviewCache.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewCache.clear();
  }

  // === Resize ===

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.resizing = true;
    this.resizeStartY = event.clientY;
    this.resizeStartH = this.panelHeight();
    const onMove = (e: MouseEvent) => {
      if (!this.resizing) return;
      const delta = this.resizeStartY - e.clientY;
      const maxH = window.innerHeight - OverlayUploadPanelService.PANEL_MAX_H_OFFSET;
      const newH = Math.max(OverlayUploadPanelService.PANEL_MIN_H, Math.min(maxH, this.resizeStartH + delta));
      this.ngZone.run(() => this.panelHeight.set(newH));
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      setTimeout(() => { this.resizing = false; }, 200);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    const onBlur = () => { onUp(); window.removeEventListener('blur', onBlur); };
    window.addEventListener('blur', onBlur);
  }

  // === Single upload ===

  onSearchInput(event: Event): void { this.searchQuery.set((event.target as HTMLInputElement).value); }
  selectPerson(person: PersonItem): void { this.selectedPerson.set(person); this.uploadResult.set(null); }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.dragOver.set(true); }
  onDragLeave(event: DragEvent): void { event.preventDefault(); event.stopPropagation(); this.dragOver.set(false); }

  onDrop(event: DragEvent): void {
    event.preventDefault(); event.stopPropagation(); this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (!files?.length) return;
    if (this.hasPsLayers()) { this.matchDroppedFiles(files); } else { this.setFile(files[0]); }
  }

  onBatchFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.matchDroppedFiles(input.files);
    input.value = '';
  }

  upload(): void {
    const person = this.selectedPerson();
    const file = this.selectedFile();
    const pid = this.contextResolver().projectId;
    if (!person || !file || !pid) return;
    this.uploading.set(true);
    this.uploadResult.set(null);
    const formData = new FormData();
    formData.append('photo', file);
    const url = `${environment.apiUrl}/partner/projects/${pid}/persons/${person.id}/photo`;
    this.http.post<UploadResult>(url, formData).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => this.ngZone.run(() => {
        this.uploading.set(false);
        this.uploadResult.set(res);
        this.selectedFile.set(null);
        if (res.success) {
          this.projectService.persons.update(list =>
            list.map(p => p.id === person.id ? { ...p, hasPhoto: true, photoThumbUrl: res.photo?.thumbUrl ?? p.photoThumbUrl } : p)
          );
        }
      }),
      error: (err) => this.ngZone.run(() => {
        this.uploading.set(false);
        this.uploadResult.set({ success: false, message: err.error?.message || 'Hiba történt a feltöltés során.' });
      }),
    });
  }

  // === Batch upload (v2 — PS layer-alapú) ===

  refreshPsLayers(): void { this.loadPsLayers(); }

  resetUploadState(): void {
    this.filePreviewCache.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewCache.clear();
    this.unmatchedFiles.set([]);
    this.selectedUnmatchedFile.set(null);
    this.batchResult.set(null);
    this.batchUploading.set(false);
    this.placing.set(false);
    this.batchProgress.set({ done: 0, total: 0 });
    this.skipLayerMerge = true;
    this.psLayers.update(layers => layers.map(l => ({
      ...l, file: undefined, uploadStatus: 'pending' as const,
      photoUrl: undefined, errorMsg: undefined, matchType: undefined, matchConfidence: undefined,
    })));
  }

  matchDroppedFiles(fileList: FileList): void {
    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE) files.push(f);
    }
    if (files.length === 0) return;
    const { matched, unmatched } = this.uploadService.matchFilesToLayers(files, this.psLayers(), this.projectService.persons());
    this.psLayers.set(matched);
    this.unmatchedFiles.set(unmatched);
    this.batchResult.set(null);
  }

  assignFileToLayer(layerIndex: number, file: File): void {
    this.psLayers.update(layers => layers.map((l, i) => i === layerIndex ? { ...l, file, matchType: 'manual' as const, matchConfidence: 100 } : l));
    this.unmatchedFiles.update(files => files.filter(f => f !== file));
    this.selectedUnmatchedFile.set(null);
  }

  selectUnmatchedFile(file: File): void { this.selectedUnmatchedFile.update(current => current === file ? null : file); }

  onLayerRowClick(index: number): void {
    const file = this.selectedUnmatchedFile();
    if (!file) return;
    const layer = this.psLayers()[index];
    if (layer.file || layer.uploadStatus === 'done') return;
    this.assignFileToLayer(index, file);
  }

  retrySmartMatch(): void {
    const files = this.unmatchedFiles();
    if (files.length === 0 || this.matching()) return;
    this.matching.set(true);
    setTimeout(() => this.ngZone.run(() => {
      const { matched, unmatched } = this.uploadService.matchFilesToLayers(files, this.psLayers(), this.projectService.persons());
      this.psLayers.set(matched);
      this.unmatchedFiles.set(unmatched);
      this.matching.set(false);
    }), 300);
  }

  clearUnmatchedFiles(): void {
    this.unmatchedFiles().forEach(f => this.revokeFilePreview(f));
    this.unmatchedFiles.set([]);
    this.selectedUnmatchedFile.set(null);
  }

  getFilePreview(file: File): string {
    let url = this.filePreviewCache.get(file);
    if (!url) { url = URL.createObjectURL(file); this.filePreviewCache.set(file, url); }
    return url;
  }

  removeFileFromLayer(layerIndex: number): void {
    const layer = this.psLayers()[layerIndex];
    if (!layer?.file) return;
    const removedFile = layer.file;
    this.revokeFilePreview(removedFile);
    this.psLayers.update(layers => layers.map((l, i) => i === layerIndex ? { ...l, file: undefined } : l));
    this.unmatchedFiles.update(files => [...files, removedFile]);
  }

  async uploadAndPlace(): Promise<void> {
    let pid = this.contextResolver().projectId || this.projectService.getLastProjectId();
    if (this.batchUploading() || this.placing()) return;
    if (!pid) {
      const layers = this.psLayers();
      if (layers.length > 0) {
        this.batchUploading.set(true);
        pid = await this.projectService.lookupProjectIdFromPerson(layers[0].personId);
        if (!pid) { this.batchUploading.set(false); this.batchResult.set({ success: false, message: 'Nem sikerült a projekt azonosítása' }); return; }
      } else { this.batchResult.set({ success: false, message: 'Nincsenek PS layerek kijelölve' }); return; }
    }
    this.batchUploading.set(true);
    this.batchResult.set(null);
    this.batchProgress.set({ done: 0, total: this.uploadableLayers().length });
    this.uploadService.uploadBatch(
      pid, this.psLayers(),
      (progress) => this.ngZone.run(() => this.batchProgress.set(progress)),
      (index, update) => this.ngZone.run(() => this.psLayers.update(layers => layers.map((l, i) => i === index ? { ...l, ...update } : l))),
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (updated) => {
        const doneCount = updated.filter(l => l.uploadStatus === 'done').length;
        const errCount = updated.filter(l => l.uploadStatus === 'error').length;
        this.ngZone.run(() => { this.psLayers.set(updated); this.batchUploading.set(false); });
        if (doneCount > 0) {
          this.ngZone.run(() => this.placing.set(true));
          this.uploadService.placePhotosInPs(updated, this.settings.syncWithBorder(), this.polling.activeDoc().path ?? undefined).then(result => {
            this.ngZone.run(() => {
              this.placing.set(false);
              this.batchResult.set({
                success: result.success && errCount === 0,
                message: result.success
                  ? (errCount > 0 ? `${doneCount} behelyezve, ${errCount} hibás` : `${doneCount} fotó behelyezve`)
                  : (result.error || 'Hiba a behelyezés során'),
              });
            });
          });
        } else {
          this.ngZone.run(() => this.batchResult.set({ success: false, message: errCount > 0 ? `${errCount} feltöltés hibás` : 'Nincs feltölthető fotó' }));
        }
      },
      error: () => this.ngZone.run(() => this.batchUploading.set(false)),
    });
  }

  async placeInPs(): Promise<void> {
    this.placing.set(true);
    this.batchResult.set(null);
    const result = await this.uploadService.placePhotosInPs(this.psLayers(), this.settings.syncWithBorder(), this.polling.activeDoc().path ?? undefined);
    this.ngZone.run(() => {
      this.placing.set(false);
      this.batchResult.set({ success: result.success, message: result.success ? 'Fotók behelyezve a Photoshopba' : (result.error || 'Hiba a behelyezés során') });
    });
  }

  // === PS layer frissítés ===

  async loadPsLayers(): Promise<void> {
    const doc = this.polling.activeDoc();
    if (doc.selectedLayerNames && doc.selectedLayerNames.length > 0) { this.updatePsLayersFromDoc(doc); return; }
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.photoshop.runJsx({ scriptName: 'actions/get-active-doc.jsx' });
      if (result.success && result.output) {
        const cleaned = result.output.trim();
        if (cleaned.startsWith('{')) {
          const freshDoc: ActiveDocInfo = JSON.parse(cleaned);
          this.ngZone.run(() => { this.polling.activeDoc.set(freshDoc); this.updatePsLayersFromDoc(freshDoc); });
        }
      }
    } catch { /* PS nem elérhető */ }
  }

  updatePsLayersFromDoc(doc: ActiveDocInfo): void {
    const names = doc.selectedLayerNames || [];
    const parsed = this.uploadService.parseLayerNames(names);
    if (parsed.length === 0) { this.psLayers.set([]); return; }
    if (this.skipLayerMerge) {
      this.skipLayerMerge = false;
      const persons = this.projectService.persons();
      this.psLayers.set(persons.length > 0 ? this.uploadService.enrichWithPersons(parsed, persons) : parsed);
      return;
    }
    const existing = new Map(this.psLayers().map(l => [l.personId, l]));
    const merged = parsed.map(p => {
      const prev = existing.get(p.personId);
      return prev ? { ...p, file: prev.file, uploadStatus: prev.uploadStatus, photoUrl: prev.photoUrl, personName: prev.personName, photoThumbUrl: prev.photoThumbUrl, errorMsg: prev.errorMsg } : p;
    });
    const persons = this.projectService.persons();
    this.psLayers.set(persons.length > 0 ? this.uploadService.enrichWithPersons(merged, persons) : merged);
  }

  // === Privát helperek ===

  private setFile(file: File): void {
    if (!ALLOWED_TYPES.includes(file.type)) { this.uploadResult.set({ success: false, message: 'Csak képfájlok engedélyezettek (JPG, PNG, WebP, HEIC).' }); return; }
    if (file.size > MAX_FILE_SIZE) { this.uploadResult.set({ success: false, message: 'A fájl túl nagy (max 100 MB).' }); return; }
    this.selectedFile.set(file);
    this.uploadResult.set(null);
  }

  private revokeFilePreview(file: File): void {
    const url = this.filePreviewCache.get(file);
    if (url) { URL.revokeObjectURL(url); this.filePreviewCache.delete(file); }
  }
}
