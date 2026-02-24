import {
  Component, ChangeDetectionStrategy, signal, computed,
  OnInit, DestroyRef, inject, NgZone,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { OverlayContext, ActiveDocInfo } from '../../core/services/electron.types';
import { environment } from '../../../environments/environment';
import { OverlayUploadService, PsLayerPerson, BatchProgress } from './overlay-upload.service';

interface ToolbarItem {
  id: string;
  icon: string;
  label: string;
  tooltip?: string;
  accent?: 'green' | 'purple' | 'amber' | 'red' | 'blue';
}

interface ToolbarGroup {
  id: string;
  items: ToolbarItem[];
  designerOnly?: boolean;
}

interface PersonItem {
  id: number;
  name: string;
  type: 'student' | 'teacher';
  hasPhoto: boolean;
  photoThumbUrl: string | null;
}

interface UploadResult {
  success: boolean;
  message?: string;
  photo?: { thumbUrl: string; url?: string };
}

const POLL_NORMAL = 5000;
const POLL_TURBO = 1000;
const TURBO_DURATION = 2 * 60 * 1000;
const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];

@Component({
  selector: 'app-overlay',
  standalone: true,
  imports: [LucideAngularModule],
  providers: [OverlayUploadService],
  templateUrl: './overlay.component.html',
  styleUrl: './overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class OverlayComponent implements OnInit {
  protected readonly ICONS = ICONS;
  private readonly destroyRef = inject(DestroyRef);
  private readonly ngZone = inject(NgZone);
  private readonly http = inject(HttpClient);
  private readonly uploadService = inject(OverlayUploadService);

  readonly context = signal<OverlayContext>({ mode: 'normal' });
  readonly activeDoc = signal<ActiveDocInfo>({ name: null, path: null, dir: null });
  readonly isDesignerMode = computed(() => this.context().mode === 'designer');
  readonly isTurbo = signal(false);
  readonly busyCommand = signal<string | null>(null);
  readonly openSubmenu = signal<string | null>(null);
  private collapseTimer: ReturnType<typeof setTimeout> | null = null;

  // Upload panel state
  readonly uploadPanelOpen = signal(false);
  readonly persons = signal<PersonItem[]>([]);
  readonly selectedPerson = signal<PersonItem | null>(null);
  readonly searchQuery = signal('');
  readonly uploading = signal(false);
  readonly uploadResult = signal<UploadResult | null>(null);
  readonly dragOver = signal(false);
  readonly loadingPersons = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly panelHeight = signal(300); // default panel magasság
  private resizing = false;
  private resizeStartY = 0;
  private resizeStartH = 0;
  private filePreviewCache = new Map<File, string>();

  private static readonly PANEL_MIN_H = 200;
  private static readonly PANEL_MAX_H_OFFSET = 120; // toolbar + padding + margó

  // Auth state — ha 401 jön, login gomb jelenik meg
  readonly isLoggedOut = signal(false);
  // Utolsó ismert projectId (fallback ha a context frissül közben)
  private lastProjectId: number | null = null;

  // v2 — PS layer-alapú batch upload
  readonly psLayers = signal<PsLayerPerson[]>([]);
  readonly batchUploading = signal(false);
  readonly batchProgress = signal<BatchProgress>({ done: 0, total: 0 });
  readonly placing = signal(false);
  readonly unmatchedFiles = signal<File[]>([]);
  readonly selectedUnmatchedFile = signal<File | null>(null);
  readonly matching = signal(false);
  readonly batchResult = signal<{ success: boolean; message: string } | null>(null);

  readonly hasPsLayers = computed(() => this.psLayers().length > 0);
  readonly uploadableLayers = computed(() =>
    this.psLayers().filter(l => l.file && l.uploadStatus !== 'done')
  );
  readonly placableLayers = computed(() =>
    this.psLayers().filter(l => l.uploadStatus === 'done' && l.photoUrl)
  );

  readonly filteredPersons = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.persons();
    if (!q) return list;
    return list.filter(p => p.name.toLowerCase().includes(q));
  });

  readonly canUpload = computed(() =>
    !!this.selectedPerson() && !!this.selectedFile() && !this.uploading()
  );

  readonly activeDocLabel = computed(() => {
    const name = this.activeDoc().name;
    if (!name) return null;
    const base = name.replace(/\.(psd|psb|pdd)$/i, '');
    return base.length > 25 ? base.slice(0, 22) + '...' : base;
  });

  readonly selectedLayers = computed(() => this.activeDoc().selectedLayers ?? 0);

  private readonly allGroups: ToolbarGroup[] = [
    {
      id: 'align',
      designerOnly: true,
      items: [
        { id: 'align-left', icon: ICONS.ALIGN_START_V, label: 'Balra igazítás' },
        { id: 'align-center-h', icon: ICONS.ALIGN_CENTER_V, label: 'Vízszintes középre' },
        { id: 'align-right', icon: ICONS.ALIGN_END_V, label: 'Jobbra igazítás' },
        { id: 'align-top', icon: ICONS.ALIGN_START_H, label: 'Felülre igazítás' },
        { id: 'align-center-v', icon: ICONS.ALIGN_CENTER_H, label: 'Függőleges középre' },
        { id: 'align-bottom', icon: ICONS.ALIGN_END_H, label: 'Alulra igazítás' },
      ],
    },
    {
      id: 'distribute',
      designerOnly: true,
      items: [
        { id: 'distribute-h', icon: ICONS.ALIGN_H_DISTRIBUTE, label: 'Vízszintes elosztás' },
        { id: 'distribute-v', icon: ICONS.ALIGN_V_DISTRIBUTE, label: 'Függőleges elosztás' },
        { id: 'center-document', icon: ICONS.MOVE, label: 'Dokumentum középre' },
      ],
    },
    {
      id: 'sort',
      designerOnly: true,
      items: [
        { id: 'arrange-grid', icon: ICONS.LAYOUT_GRID, label: 'Rácsba rendezés', accent: 'purple' },
        { id: 'sort-abc', icon: ICONS.ARROW_DOWN_AZ, label: 'ABC sorrend', accent: 'blue' },
        { id: 'sort-gender', icon: ICONS.USERS, label: 'Felváltva fiú-lány' },
        { id: 'sort-custom', icon: ICONS.LIST_ORDERED, label: 'Egyedi sorrend' },
      ],
    },
    {
      id: 'layers',
      designerOnly: true,
      items: [
        { id: 'link-layers', icon: ICONS.LINK, label: 'Összelinkelés' },
        { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Szétlinkelés' },
        { id: 'extra-names', icon: ICONS.FILE_TEXT, label: 'Extra nevek' },
      ],
    },
    {
      id: 'photoshop',
      items: [
        { id: 'upload-photo', icon: ICONS.CAMERA, label: 'Fotó feltöltése', accent: 'green' },
        { id: 'sync-photos', icon: ICONS.IMAGE_DOWN, label: 'Fotók szinkronizálása', accent: 'green' },
        { id: 'arrange-names', icon: ICONS.ALIGN_CENTER, label: 'Nevek igazítása', tooltip: 'Nevek a képek alá (kijelölt képeknél csak azokat, egyébként mindet). Unlinkeli a párokat.', accent: 'purple' },
        { id: 'link-layers', icon: ICONS.LINK, label: 'Összelinkelés', tooltip: 'Kijelölt layerek összelinkelése az azonos nevű társaikkal' },
        { id: 'unlink-layers', icon: ICONS.UNLINK, label: 'Szétlinkelés', tooltip: 'Kijelölt layerek linkelésének megszüntetése' },
        { id: 'refresh', icon: ICONS.REFRESH, label: 'Frissítés PS-ből' },
      ],
    },
    {
      id: 'generate',
      items: [
        { id: 'generate-sample', icon: ICONS.IMAGE, label: 'Minta generálása', accent: 'amber' },
        { id: 'generate-final', icon: ICONS.CHECK_CIRCLE, label: 'Véglegesítés', accent: 'green' },
      ],
    },
    {
      id: 'view',
      designerOnly: true,
      items: [
        { id: 'toggle-grid', icon: ICONS.GRID, label: 'Rács be/ki' },
        { id: 'snap-grid', icon: ICONS.WAND, label: 'Rácsba igazít' },
        { id: 'save', icon: ICONS.SAVE, label: 'Mentés', accent: 'purple' },
      ],
    },
    {
      id: 'ps-quick',
      items: [
        { id: 'ps-launch', icon: ICONS.PLAY, label: 'Photoshop indítása', accent: 'blue' },
        { id: 'open-project', icon: ICONS.FILE_PLUS, label: 'PSD megnyitása' },
        { id: 'ps-open-workdir', icon: ICONS.FOLDER_OPEN, label: 'Munkamappa' },
      ],
    },
  ];

  readonly groups = computed(() => {
    const isDesigner = this.isDesignerMode();
    return this.allGroups.filter(g => {
      if (g.id === 'ps-quick') return !isDesigner;
      if (g.designerOnly) return isDesigner;
      return true;
    });
  });

  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private turboTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    document.body.classList.add('overlay-mode');
    this.loadContext();
    this.listenContextChanges();
    this.loadActiveDoc();
    this.listenActiveDocChanges();
    this.startPolling(POLL_NORMAL);
    this.setupClickThrough();
    this.listenVisibility();
  }

  private static readonly ALIGN_MAP: Record<string, string> = {
    'align-left': 'left',
    'align-center-h': 'centerH',
    'align-right': 'right',
    'align-top': 'top',
    'align-center-v': 'centerV',
    'align-bottom': 'bottom',
  };

  private static readonly SUBMENU_IDS = new Set(['arrange-names', 'sync-photos']);

  readonly syncWithBorder = signal(this.loadSyncBorder());

  onCommand(commandId: string): void {
    // Upload-photo → panel toggle
    if (commandId === 'upload-photo') {
      this.toggleUploadPanel();
      return;
    }

    // Submenu-s gomb → inline collapse toggle
    if (OverlayComponent.SUBMENU_IDS.has(commandId)) {
      const isOpen = this.openSubmenu() === commandId;
      this.openSubmenu.set(isOpen ? null : commandId);
      this.resetCollapseTimer(isOpen ? null : commandId);
      return;
    }
    this.closeSubmenu();

    if (commandId === 'link-layers') {
      this.runJsxAction(commandId, 'actions/link-selected.jsx');
      return;
    }
    if (commandId === 'unlink-layers') {
      this.runJsxAction(commandId, 'actions/unlink-selected.jsx');
      return;
    }
    const alignType = OverlayComponent.ALIGN_MAP[commandId];
    if (alignType) {
      this.runJsxAction(commandId, 'actions/align-linked.jsx', { ALIGN_TYPE: alignType });
      return;
    }
    window.electronAPI?.overlay.executeCommand(commandId);
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.resizing) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.toolbar-wrap')) {
      if (this.openSubmenu()) this.closeSubmenu();
      if (this.uploadPanelOpen()) this.closeUploadPanel();
    }
  }

  arrangeNames(textAlign: string): void {
    this.closeSubmenu();
    this.runJsxAction('arrange-names', 'actions/arrange-names-selected.jsx', { TEXT_ALIGN: textAlign });
  }

  syncPhotos(mode: 'all' | 'missing'): void {
    this.closeSubmenu();
    const commandId = mode === 'missing' ? 'sync-photos-missing' : 'sync-photos';
    window.electronAPI?.overlay.executeCommand(commandId);
  }

  toggleSyncBorder(): void {
    this.syncWithBorder.update(v => !v);
    this.saveSyncBorder(this.syncWithBorder());
    window.electronAPI?.overlay.executeCommand(
      this.syncWithBorder() ? 'sync-border-on' : 'sync-border-off',
    );
  }

  // ============ Upload Panel ============

  toggleUploadPanel(): void {
    if (this.uploadPanelOpen()) {
      this.closeUploadPanel();
    } else {
      this.openUploadPanel();
    }
  }

  private openUploadPanel(): void {
    this.uploadPanelOpen.set(true);
    this.closeSubmenu();
    const pid = this.context().projectId;
    if (pid) {
      this.loadPersons(pid);
    }
    this.loadPsLayers();
  }

  closeUploadPanel(): void {
    this.uploadPanelOpen.set(false);
    this.selectedPerson.set(null);
    this.selectedFile.set(null);
    this.uploadResult.set(null);
    this.searchQuery.set('');
    this.batchResult.set(null);
    this.selectedUnmatchedFile.set(null);
    // Blob URL-ek felszabadítása
    this.filePreviewCache.forEach(url => URL.revokeObjectURL(url));
    this.filePreviewCache.clear();
  }

  // ============ Resize panel ============

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    this.resizing = true;
    this.resizeStartY = event.clientY;
    this.resizeStartH = this.panelHeight();

    const onMove = (e: MouseEvent) => {
      if (!this.resizing) return;
      const delta = this.resizeStartY - e.clientY; // felfelé húzás = pozitív
      const maxH = window.innerHeight - OverlayComponent.PANEL_MAX_H_OFFSET;
      const newH = Math.max(OverlayComponent.PANEL_MIN_H, Math.min(maxH, this.resizeStartH + delta));
      this.ngZone.run(() => this.panelHeight.set(newH));
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      // Kis késleltetés, hogy a mouseup utáni click ne zárja be a panelt
      setTimeout(() => { this.resizing = false; }, 200);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    // Window blur = egér kiment az ablakból resize közben
    const onBlur = () => {
      onUp();
      window.removeEventListener('blur', onBlur);
    };
    window.addEventListener('blur', onBlur);
  }

  onSearchInput(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  selectPerson(person: PersonItem): void {
    this.selectedPerson.set(person);
    this.uploadResult.set(null);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.setFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
    const files = event.dataTransfer?.files;
    if (!files?.length) return;

    // v2 mód: ha vannak PS layerek, batch matching
    if (this.hasPsLayers()) {
      this.matchDroppedFiles(files);
    } else {
      this.setFile(files[0]);
    }
  }

  /** Multi-file tallózás (v2 batch módhoz) */
  onBatchFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.matchDroppedFiles(input.files);
    input.value = ''; // reset, hogy ugyanaz a fájl újra kiválasztható legyen
  }

  upload(): void {
    const person = this.selectedPerson();
    const file = this.selectedFile();
    const pid = this.context().projectId;
    if (!person || !file || !pid) return;

    this.uploading.set(true);
    this.uploadResult.set(null);

    const formData = new FormData();
    formData.append('photo', file);

    const url = `${environment.apiUrl}/partner/projects/${pid}/persons/${person.id}/photo`;

    this.http.post<UploadResult>(url, formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            this.uploading.set(false);
            this.uploadResult.set(res);
            this.selectedFile.set(null);
            if (res.success) {
              this.persons.update(list =>
                list.map(p => p.id === person.id
                  ? { ...p, hasPhoto: true, photoThumbUrl: res.photo?.thumbUrl ?? p.photoThumbUrl }
                  : p
                )
              );
            }
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.uploading.set(false);
            this.uploadResult.set({
              success: false,
              message: err.error?.message || 'Hiba történt a feltöltés során.',
            });
          });
        },
      });
  }

  // ============ v2 — PS Layer batch upload ============

  refreshPsLayers(): void {
    this.loadPsLayers();
  }

  matchDroppedFiles(fileList: FileList): void {
    const files: File[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (ALLOWED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE) {
        files.push(f);
      }
    }
    if (files.length === 0) return;

    const { matched, unmatched } = this.uploadService.matchFilesToLayers(files, this.psLayers(), this.persons());
    this.psLayers.set(matched);
    this.unmatchedFiles.set(unmatched);
    this.batchResult.set(null);
  }

  assignFileToLayer(layerIndex: number, file: File): void {
    this.psLayers.update(layers =>
      layers.map((l, i) => i === layerIndex ? { ...l, file, matchType: 'manual' as const, matchConfidence: 100 } : l)
    );
    this.unmatchedFiles.update(files => files.filter(f => f !== file));
    this.selectedUnmatchedFile.set(null);
  }

  /** Nem párosított fájl kiválasztása manuális hozzárendeléshez */
  selectUnmatchedFile(file: File): void {
    this.selectedUnmatchedFile.update(current => current === file ? null : file);
  }

  /** Layer sorra kattintás — ha van kiválasztott unmatched fájl, hozzárendeli */
  onLayerRowClick(index: number): void {
    const file = this.selectedUnmatchedFile();
    if (!file) return;
    const layer = this.psLayers()[index];
    if (layer.file || layer.uploadStatus === 'done') return;
    this.assignFileToLayer(index, file);
  }

  /** Nem párosított fájlok újra-matchelése a persons lista alapján */
  retrySmartMatch(): void {
    const files = this.unmatchedFiles();
    if (files.length === 0 || this.matching()) return;
    this.matching.set(true);
    // Kis delay hogy a spinner látható legyen
    setTimeout(() => {
      this.ngZone.run(() => {
        const { matched, unmatched } = this.uploadService.matchFilesToLayers(files, this.psLayers(), this.persons());
        this.psLayers.set(matched);
        this.unmatchedFiles.set(unmatched);
        this.matching.set(false);
      });
    }, 300);
  }

  clearUnmatchedFiles(): void {
    this.unmatchedFiles().forEach(f => this.revokeFilePreview(f));
    this.unmatchedFiles.set([]);
    this.selectedUnmatchedFile.set(null);
  }

  getFilePreview(file: File): string {
    let url = this.filePreviewCache.get(file);
    if (!url) {
      url = URL.createObjectURL(file);
      this.filePreviewCache.set(file, url);
    }
    return url;
  }

  private revokeFilePreview(file: File): void {
    const url = this.filePreviewCache.get(file);
    if (url) {
      URL.revokeObjectURL(url);
      this.filePreviewCache.delete(file);
    }
  }

  removeFileFromLayer(layerIndex: number): void {
    const layer = this.psLayers()[layerIndex];
    if (!layer?.file) return;
    const removedFile = layer.file;
    this.revokeFilePreview(removedFile);
    this.psLayers.update(layers =>
      layers.map((l, i) => i === layerIndex ? { ...l, file: undefined } : l)
    );
    this.unmatchedFiles.update(files => [...files, removedFile]);
  }

  /** Feltöltés + PS behelyezés egy lépésben */
  uploadAndPlace(): void {
    const pid = this.context().projectId || this.lastProjectId;
    if (this.batchUploading() || this.placing()) return;
    if (!pid) {
      this.batchResult.set({ success: false, message: 'Nincs projekt kiválasztva' });
      return;
    }

    this.batchUploading.set(true);
    this.batchResult.set(null);
    this.batchProgress.set({ done: 0, total: this.uploadableLayers().length });

    this.uploadService.uploadBatch(
      pid,
      this.psLayers(),
      (progress) => this.ngZone.run(() => this.batchProgress.set(progress)),
      (index, update) => this.ngZone.run(() => {
        this.psLayers.update(layers =>
          layers.map((l, i) => i === index ? { ...l, ...update } : l)
        );
      }),
    ).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          const doneCount = updated.filter(l => l.uploadStatus === 'done').length;
          const errCount = updated.filter(l => l.uploadStatus === 'error').length;

          this.ngZone.run(() => {
            this.psLayers.set(updated);
            this.batchUploading.set(false);
          });

          // Ha van sikeres feltöltés, behelyezés PS-be
          if (doneCount > 0) {
            this.ngZone.run(() => this.placing.set(true));
            this.uploadService.placePhotosInPs(updated).then(result => {
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
            this.ngZone.run(() => {
              this.batchResult.set({
                success: false,
                message: errCount > 0 ? `${errCount} feltöltés hibás` : 'Nincs feltölthető fotó',
              });
            });
          }
        },
        error: () => {
          this.ngZone.run(() => this.batchUploading.set(false));
        },
      });
  }

  async placeInPs(): Promise<void> {
    this.placing.set(true);
    this.batchResult.set(null);
    const result = await this.uploadService.placePhotosInPs(this.psLayers());
    this.ngZone.run(() => {
      this.placing.set(false);
      this.batchResult.set({
        success: result.success,
        message: result.success
          ? 'Fotók behelyezve a Photoshopba'
          : (result.error || 'Hiba a behelyezés során'),
      });
    });
  }

  private async loadPsLayers(): Promise<void> {
    // Először az activeDoc-ból próbáljuk (ha a polling már beszerezte)
    const doc = this.activeDoc();
    if (doc.selectedLayerNames && doc.selectedLayerNames.length > 0) {
      this.updatePsLayersFromDoc(doc);
      return;
    }
    // Ha nincs, frissítsük a PS-ből
    if (!window.electronAPI) return;
    try {
      const result = await window.electronAPI.photoshop.runJsx({ scriptName: 'actions/get-active-doc.jsx' });
      if (result.success && result.output) {
        const cleaned = result.output.trim();
        if (cleaned.startsWith('{')) {
          const freshDoc: ActiveDocInfo = JSON.parse(cleaned);
          this.ngZone.run(() => {
            this.activeDoc.set(freshDoc);
            this.updatePsLayersFromDoc(freshDoc);
          });
        }
      }
    } catch { /* PS nem elérhető */ }
  }

  // ============ Private helpers ============

  private setFile(file: File): void {
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.uploadResult.set({ success: false, message: 'Csak képfájlok engedélyezettek (JPG, PNG, WebP, HEIC).' });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      this.uploadResult.set({ success: false, message: `A fájl túl nagy (max 100 MB).` });
      return;
    }
    this.selectedFile.set(file);
    this.uploadResult.set(null);
  }

  private loadPersons(projectId: number): void {
    this.lastProjectId = projectId;
    this.loadingPersons.set(true);
    const url = `${environment.apiUrl}/partner/projects/${projectId}/persons`;

    this.http.get<{ data: PersonItem[] }>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.ngZone.run(() => {
            const personsList = res.data || [];
            this.persons.set(personsList);
            this.loadingPersons.set(false);
            this.isLoggedOut.set(false);
            // PS layerek enrichelése az új személylistával
            const current = this.psLayers();
            if (current.length > 0 && personsList.length > 0) {
              this.psLayers.set(this.uploadService.enrichWithPersons(current, personsList));
            }
          });
        },
        error: (err) => {
          this.ngZone.run(() => {
            this.loadingPersons.set(false);
            if (err.status === 401 || err.status === 419) {
              this.isLoggedOut.set(true);
            }
          });
        },
      });
  }

  private syncBorderKey(): string {
    const projectId = this.context().projectId ?? 'default';
    return `sync-border-${projectId}`;
  }

  private loadSyncBorder(): boolean {
    return this.loadSyncBorderForProject(this.context().projectId);
  }

  private loadSyncBorderForProject(projectId?: number): boolean {
    try {
      const key = `sync-border-${projectId ?? 'default'}`;
      return localStorage.getItem(key) !== 'false';
    } catch {
      return true;
    }
  }

  private saveSyncBorder(value: boolean): void {
    try {
      localStorage.setItem(this.syncBorderKey(), String(value));
    } catch { /* ignore */ }
  }

  private setupClickThrough(): void {
    if (!window.electronAPI) return;
    document.addEventListener('mousemove', (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target === document.documentElement || target === document.body) {
        window.electronAPI!.overlay.setIgnoreMouseEvents(true);
      }
    });
    document.addEventListener('mouseenter', () => {
      window.electronAPI!.overlay.setIgnoreMouseEvents(false);
    }, true);
  }

  onCollapseEnter(): void {
    this.clearCollapseTimer();
  }

  onCollapseLeave(): void {
    if (this.openSubmenu()) {
      this.resetCollapseTimer(this.openSubmenu());
    }
  }

  private closeSubmenu(): void {
    if (this.openSubmenu()) {
      this.openSubmenu.set(null);
      this.clearCollapseTimer();
    }
  }

  private resetCollapseTimer(submenuId: string | null): void {
    this.clearCollapseTimer();
    if (submenuId) {
      this.collapseTimer = setTimeout(() => {
        this.ngZone.run(() => this.closeSubmenu());
      }, 5000);
    }
  }

  private clearCollapseTimer(): void {
    if (this.collapseTimer) {
      clearTimeout(this.collapseTimer);
      this.collapseTimer = null;
    }
  }

  private async runJsxAction(commandId: string, scriptName: string, jsonData?: Record<string, unknown>): Promise<void> {
    if (!window.electronAPI) return;
    this.busyCommand.set(commandId);
    try {
      await window.electronAPI.photoshop.runJsx({ scriptName, jsonData });
      this.pollActiveDoc();
    } catch { /* ignore */ }
    this.ngZone.run(() => this.busyCommand.set(null));
  }

  hide(): void {
    window.electronAPI?.overlay.hide();
  }

  showLogin(): void {
    window.electronAPI?.overlay.showMainWindow();
  }

  openActiveDocDir(): void {
    this.onCommand('ps-open-workdir');
  }

  toggleTurbo(): void {
    if (this.isTurbo()) {
      this.stopTurbo();
    } else {
      this.isTurbo.set(true);
      this.restartPolling(POLL_TURBO);
      this.turboTimeout = setTimeout(() => this.stopTurbo(), TURBO_DURATION);
    }
  }

  private stopTurbo(): void {
    this.isTurbo.set(false);
    if (this.turboTimeout) {
      clearTimeout(this.turboTimeout);
      this.turboTimeout = null;
    }
    this.restartPolling(POLL_NORMAL);
  }

  private restartPolling(interval: number): void {
    this.lastPollInterval = interval;
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.isVisible) {
      this.pollTimer = setInterval(() => this.pollActiveDoc(), interval);
    }
  }

  private async loadContext(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const ctx = await window.electronAPI.overlay.getContext();
      this.ngZone.run(() => this.context.set(ctx));
    } catch { /* default: normal */ }
  }

  private listenContextChanges(): void {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.overlay.onContextChanged((ctx) => {
      this.ngZone.run(() => {
        this.context.set(ctx);
        this.syncWithBorder.set(this.loadSyncBorderForProject(ctx.projectId));
        // Context change → auth recovery próba
        if (this.isLoggedOut() && ctx.projectId) {
          this.isLoggedOut.set(false);
          this.loadPersons(ctx.projectId);
        } else if (ctx.projectId && this.uploadPanelOpen()) {
          this.loadPersons(ctx.projectId);
        }
      });
    });
    this.destroyRef.onDestroy(cleanup);
  }

  private async loadActiveDoc(): Promise<void> {
    if (!window.electronAPI) return;
    try {
      const doc = await window.electronAPI.overlay.getActiveDoc();
      this.ngZone.run(() => this.mergeActiveDoc(doc));
    } catch { /* ignore */ }
  }

  private listenActiveDocChanges(): void {
    if (!window.electronAPI) return;
    const cleanup = window.electronAPI.overlay.onActiveDocChanged((doc) => {
      this.ngZone.run(() => this.mergeActiveDoc(doc));
    });
    this.destroyRef.onDestroy(cleanup);
  }

  private mergeActiveDoc(doc: ActiveDocInfo): void {
    const current = this.activeDoc();
    this.activeDoc.set({
      ...doc,
      selectedLayers: doc.selectedLayers ?? current.selectedLayers,
    });
  }

  /** Ablak lathato-e (Electron hide/show esemenyek) */
  private isVisible = true;
  private lastPollInterval = POLL_NORMAL;

  /** Ha az Electron overlay ablak elrejtodik, szuneteltetjuk a pollingot */
  private listenVisibility(): void {
    const handler = (): void => {
      const hidden = document.hidden;
      if (hidden && this.isVisible) {
        this.isVisible = false;
        this.pausePolling();
      } else if (!hidden && !this.isVisible) {
        this.isVisible = true;
        this.resumePolling();
      }
    };
    document.addEventListener('visibilitychange', handler);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', handler));
  }

  private pausePolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private resumePolling(): void {
    const interval = this.isTurbo() ? POLL_TURBO : this.lastPollInterval;
    this.pollActiveDoc();
    this.pollTimer = setInterval(() => this.pollActiveDoc(), interval);
  }

  private startPolling(interval: number): void {
    if (!window.electronAPI) return;
    this.lastPollInterval = interval;
    this.pollActiveDoc();
    this.pollTimer = setInterval(() => this.pollActiveDoc(), interval);
    this.destroyRef.onDestroy(() => {
      if (this.pollTimer) clearInterval(this.pollTimer);
      if (this.turboTimeout) clearTimeout(this.turboTimeout);
    });
  }

  private async pollActiveDoc(): Promise<void> {
    if (!window.electronAPI || !this.isVisible) return;

    // Ha kijelentkezve vagyunk, periodikusan próbáljuk a visszaállítást
    if (this.isLoggedOut()) {
      this.tryAuthRecovery();
    }

    try {
      const result = await window.electronAPI.photoshop.runJsx({ scriptName: 'actions/get-active-doc.jsx' });
      if (result.success && result.output) {
        const cleaned = result.output.trim();
        if (cleaned.startsWith('{')) {
          const doc: ActiveDocInfo = JSON.parse(cleaned);
          this.ngZone.run(() => {
            this.activeDoc.set(doc);
            // Ha a panel nyitva van, frissítsük a PS layereket is
            if (this.uploadPanelOpen()) {
              this.updatePsLayersFromDoc(doc);
            }
          });
          window.electronAPI.overlay.setActiveDoc(doc);
        }
      }
    } catch { /* PS nem elerheto — skip */ }
  }

  private tryAuthRecovery(): void {
    const pid = this.context().projectId;
    if (!pid) return;
    // Próbáljuk meg betölteni a személyeket — ha sikerül, a loadPersons reseteli az isLoggedOut-ot
    if (!this.loadingPersons()) {
      this.loadPersons(pid);
    }
  }

  private updatePsLayersFromDoc(doc: ActiveDocInfo): void {
    const names = doc.selectedLayerNames || [];
    const parsed = this.uploadService.parseLayerNames(names);
    if (parsed.length === 0) {
      this.psLayers.set([]);
      return;
    }
    // Meglévő feltöltési státusz megőrzése (file, uploadStatus, photoUrl)
    const existing = new Map(this.psLayers().map(l => [l.personId, l]));
    const merged = parsed.map(p => {
      const prev = existing.get(p.personId);
      return prev ? { ...p, file: prev.file, uploadStatus: prev.uploadStatus, photoUrl: prev.photoUrl, personName: prev.personName, photoThumbUrl: prev.photoThumbUrl, errorMsg: prev.errorMsg } : p;
    });
    // Enrich persons-ból ha van
    const persons = this.persons();
    const result = persons.length > 0
      ? this.uploadService.enrichWithPersons(merged, persons)
      : merged;
    this.psLayers.set(result);
  }
}
