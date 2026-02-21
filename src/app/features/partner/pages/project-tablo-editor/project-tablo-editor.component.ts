import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ProjectDetailHeaderComponent } from '@shared/components/project-detail/project-detail-header/project-detail-header.component';
import { DialogWrapperComponent } from '@shared/components/dialog-wrapper/dialog-wrapper.component';
import { ProjectDetailData } from '@shared/components/project-detail/project-detail.types';
import { PartnerService, PartnerProjectDetails } from '../../services/partner.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { TabloEditorDebugService, DebugLogEntry } from './tablo-editor-debug.service';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloEditorTemplateService } from './tablo-editor-template.service';
import { SnapshotListItem, SnapshotLayer, TemplateListItem } from '@core/services/electron.types';
import { SnapshotRestoreDialogComponent } from './snapshot-restore-dialog.component';
import { TemplateSaveDialogComponent } from './template-save-dialog.component';
import { TemplateApplyDialogComponent } from './template-apply-dialog.component';
import { LayoutDesignerComponent } from './layout-designer/layout-designer.component';

type EditorTab = 'commands' | 'settings' | 'debug';

@Component({
  selector: 'app-project-tablo-editor',
  standalone: true,
  imports: [LucideAngularModule, ProjectDetailHeaderComponent, MatTooltipModule, DialogWrapperComponent, SnapshotRestoreDialogComponent, TemplateSaveDialogComponent, TemplateApplyDialogComponent, LayoutDesignerComponent],
  providers: [TabloEditorDebugService, TabloEditorSnapshotService, TabloEditorTemplateService],
  templateUrl: './project-tablo-editor.component.html',
  styleUrl: './project-tablo-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTabloEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly partnerService = inject(PartnerService);
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
  private readonly debugService = inject(TabloEditorDebugService);
  readonly snapshotService = inject(TabloEditorSnapshotService);
  readonly templateService = inject(TabloEditorTemplateService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly ICONS = ICONS;

  /** Aktív tab */
  readonly activeTab = signal<EditorTab>('commands');

  /** Projekt adatok */
  readonly loading = signal(true);
  private readonly project = signal<PartnerProjectDetails | null>(null);

  readonly projectData = computed<ProjectDetailData | null>(() => {
    const p = this.project();
    if (!p) return null;
    return {
      id: p.id,
      name: p.name,
      school: p.school,
      partner: p.partner,
      className: p.className,
      classYear: p.classYear,
      status: p.status,
      statusLabel: p.statusLabel,
      statusColor: p.statusColor,
      tabloStatus: p.tabloStatus,
      photoDate: p.photoDate,
      deadline: p.deadline,
      expectedClassSize: p.expectedClassSize,
      orderSubmittedAt: p.orderSubmittedAt,
      draftPhotoCount: p.draftPhotoCount,
      contact: p.contact,
      contacts: p.contacts ?? [],
      qrCode: p.qrCode,
      activeQrCodes: p.activeQrCodes ?? [],
      qrCodesHistory: p.qrCodesHistory ?? [],
      tabloGalleryId: p.tabloGalleryId,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  /** Photoshop állapot */
  readonly psPath = this.ps.path;
  readonly isConfigured = this.ps.isConfigured;
  readonly checking = this.ps.checking;
  readonly launching = signal(false);

  /** Beállítások */
  readonly marginCm = this.ps.marginCm;
  readonly studentSizeCm = this.ps.studentSizeCm;
  readonly teacherSizeCm = this.ps.teacherSizeCm;
  readonly gapHCm = this.ps.gapHCm;
  readonly gapVCm = this.ps.gapVCm;
  readonly nameGapCm = this.ps.nameGapCm;
  readonly nameBreakAfter = this.ps.nameBreakAfter;
  readonly textAlign = this.ps.textAlign;
  readonly gridAlign = this.ps.gridAlign;

  /** PSD generálás */
  readonly tabloSizes = signal<TabloSize[]>([]);
  readonly selectedSize = signal<TabloSize | null>(null);
  readonly loadingSizes = signal(false);
  readonly generating = signal(false);
  readonly arranging = signal(false);
  readonly arrangingNames = signal(false);

  /** Aktuális PSD fájl útvonala (generáláskor mentjük) */
  readonly currentPsdPath = signal<string | null>(null);

  /** Projekt személyei (diákok + tanárok) */
  readonly persons = signal<TabloPersonItem[]>([]);

  /** Debug log (delegálva a debug service-nek) */
  readonly debugLogs = this.debugService.debugLogs;

  /** Vizuális szerkesztő */
  readonly showLayoutDesigner = signal(false);
  readonly designerSnapshotPath = signal<string | null>(null);
  readonly designerPsdPath = signal<string | null>(null);
  readonly designerBoardConfig = signal<{ widthCm: number; heightCm: number } | null>(null);

  /** Összecsukott snapshot csoportok (eredeti nevek set-je) */
  readonly collapsedGroups = signal<Set<string>>(new Set());

  /** Csoportosított snapshot lista: eredeti snapshotok + alattuk a szerkesztett verziók */
  readonly groupedSnapshots = computed(() => {
    const all = this.snapshotService.snapshots();
    const originals: SnapshotListItem[] = [];
    const editedMap = new Map<string, SnapshotListItem[]>();

    for (const snap of all) {
      if (snap.snapshotName.endsWith('(szerkesztett)')) {
        const baseName = snap.snapshotName.replace(/ \(szerkesztett\)$/, '');
        const list = editedMap.get(baseName) ?? [];
        list.push(snap);
        editedMap.set(baseName, list);
      } else {
        originals.push(snap);
      }
    }

    // Eredeti snapshotokhoz csatoljuk a szerkesztett verziókat
    const groups: Array<{ original: SnapshotListItem; edited: SnapshotListItem[] }> = [];
    const usedEdited = new Set<string>();

    for (const orig of originals) {
      const edited = editedMap.get(orig.snapshotName) ?? [];
      groups.push({ original: orig, edited });
      if (edited.length) usedEdited.add(orig.snapshotName);
    }

    // Árva szerkesztett verziók (nincs hozzá eredeti)
    for (const [baseName, editedList] of editedMap) {
      if (!usedEdited.has(baseName)) {
        // Nincs eredeti → önálló elemként jelennek meg
        for (const snap of editedList) {
          groups.push({ original: snap, edited: [] });
        }
      }
    }

    return groups;
  });

  toggleGroupCollapse(name: string): void {
    const current = this.collapsedGroups();
    const next = new Set(current);
    if (next.has(name)) {
      next.delete(name);
    } else {
      next.add(name);
    }
    this.collapsedGroups.set(next);
  }

  isGroupCollapsed(name: string): boolean {
    return this.collapsedGroups().has(name);
  }

  /** Üzenetek */
  readonly error = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id) || id < 1) {
      this.loading.set(false);
      return;
    }

    this.loadProject(id);
    this.ps.detectPhotoshop();
    this.loadTabloSizes();
  }

  private loadProject(id: number): void {
    this.partnerService.getProjectDetails(id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
        this.loadPersons(id);
        this.tryLoadSnapshots();
      },
      error: () => this.loading.set(false),
    });
  }

  private loadPersons(projectId: number): void {
    this.partnerService.getProjectPersons(projectId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => this.persons.set(res.data),
      error: () => { /* Szemelyek betoltese nem kritikus */ },
    });
  }

  private loadTabloSizes(): void {
    this.loadingSizes.set(true);
    this.partnerService.getTabloSizes().pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (res) => {
        this.tabloSizes.set(res.sizes);
        if (res.sizes.length > 0) {
          this.selectedSize.set(res.sizes[0]);
        }
        this.loadingSizes.set(false);
        this.tryLoadSnapshots();
      },
      error: () => this.loadingSizes.set(false),
    });
  }

  goBack(): void {
    this.location.back();
  }

  selectSize(size: TabloSize): void {
    this.selectedSize.set(size);
  }

  /** Input event → szám validáció → setter hívás */
  private async setNumericValue(event: Event, min: number, max: number, setter: (v: number) => Promise<boolean>): Promise<void> {
    const v = Number((event.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= min && v <= max) await setter(v);
  }

  setMarginValue(e: Event) { this.setNumericValue(e, 0, 10, v => this.ps.setMargin(v)); }
  setStudentSizeValue(e: Event) { this.setNumericValue(e, 1, 30, v => this.ps.setStudentSize(v)); }
  setTeacherSizeValue(e: Event) { this.setNumericValue(e, 1, 30, v => this.ps.setTeacherSize(v)); }
  setGapHValue(e: Event) { this.setNumericValue(e, 0, 10, v => this.ps.setGapH(v)); }
  setGapVValue(e: Event) { this.setNumericValue(e, 0, 10, v => this.ps.setGapV(v)); }
  setNameGapValue(e: Event) { this.setNumericValue(e, 0, 5, v => this.ps.setNameGap(v)); }
  setNameBreakAfterValue(e: Event) { this.setNumericValue(e, 0, 5, v => this.ps.setNameBreakAfter(v)); }

  setTextAlignValue(align: string) { this.ps.setTextAlign(align); }
  setGridAlignValue(align: string) { this.ps.setGridAlign(align); }

  async selectPsPath(): Promise<void> {
    this.clearMessages();
    const path = await this.ps.browseForPhotoshop();
    if (!path) return;

    const ok = await this.ps.setPath(path);
    if (ok) {
      this.successMessage.set('Photoshop sikeresen beállítva!');
    } else {
      this.error.set('A kiválasztott fájl nem egy érvényes Photoshop alkalmazás.');
    }
  }

  async launchPs(): Promise<void> {
    this.clearMessages();
    this.launching.set(true);
    try {
      const result = await this.ps.launchPhotoshop();
      if (result.success) {
        this.successMessage.set('Photoshop elindítva!');
      } else {
        this.error.set(result.error || 'Nem sikerült elindítani a Photoshop-ot.');
      }
    } finally {
      this.launching.set(false);
    }
  }

  async generatePsd(): Promise<void> {
    const size = this.selectedSize();
    const p = this.project();
    if (!size) return;

    this.clearMessages();
    this.generating.set(true);
    try {
      const personsData = this.persons().map(person => ({
        id: person.id,
        name: person.name,
        type: person.type,
        photoUrl: person.photoUrl,
      }));

      const result = await this.ps.generateAndOpenPsd(size, p ? {
        projectName: p.name,
        className: p.className,
        brandName: this.branding.brandName(),
        persons: personsData.length > 0 ? personsData : undefined,
      } : undefined);
      if (!result.success) {
        this.error.set(result.error || 'PSD generálás sikertelen.');
        return;
      }

      // PSD path mentése a layout funkciókhoz + snapshot lista frissítés
      if (result.outputPath) {
        this.currentPsdPath.set(result.outputPath);
        this.snapshotService.loadSnapshots(result.outputPath);
      }

      // Varunk hogy a Photoshop megnyissa a PSD-t
      await new Promise(resolve => setTimeout(resolve, 2000));

      // PSD fajlnev kiszamitasa a cel dokumentum nev-alapu aktivalasahoz
      const psdFileName = result.outputPath
        ? result.outputPath.split('/').pop() || undefined
        : undefined;

      // 0. Margó guide-ok (mindig, ha van margó beállítva)
      const guideResult = await this.ps.addGuides(psdFileName);
      if (!guideResult.success) {
        this.error.set(`Guide-ok: ${guideResult.error}`);
      }

      // PSD megnyitás után: JSX layerek hozzáadása (ha vannak személyek)
      if (personsData.length > 0) {
        // 1. Név layerek (text)
        const nameResult = await this.ps.addNameLayers(personsData, psdFileName);

        // 2. Image layerek (Smart Object placeholder-ek)
        const imageResult = await this.ps.addImageLayers(personsData, undefined, psdFileName);

        const nameOk = nameResult.success;
        const imageOk = imageResult.success;

        // 3. Grid elrendezés (image layerek pozícionálása rácsba)
        if (imageOk) {
          const boardSize = this.ps.parseSizeValue(size.value);
          if (boardSize) {
            const gridResult = await this.ps.arrangeGrid(boardSize, psdFileName);
            if (!gridResult.success) {
              this.error.set(`Grid elrendezés: ${gridResult.error}`);
            }

            // 4. Layout JSON automatikus mentése a PSD mellé
            await this.autoSaveSnapshot(result.outputPath);
          }
        }

        if (nameOk && imageOk) {
          this.successMessage.set(`PSD generálva: ${personsData.length} név + kép layer: ${size.label}`);
        } else {
          this.successMessage.set(`PSD generálva és megnyitva: ${size.label}`);
          const errors: string[] = [];
          if (!nameOk) errors.push(`Név layerek: ${nameResult.error}`);
          if (!imageOk) errors.push(`Image layerek: ${imageResult.error}`);
          this.error.set(errors.join(' | '));
        }
      } else {
        this.successMessage.set(`PSD generálva és megnyitva: ${size.label}`);
      }
    } finally {
      this.generating.set(false);
    }
  }

  async arrangeGrid(): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.clearMessages();
    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeGrid(boardSize);
      if (result.success) {
        this.successMessage.set('Rácsba rendezés kész!');

        // Layout JSON automatikus mentése
        await this.autoSaveSnapshot();
      } else {
        this.error.set(result.error || 'Rácsba rendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
    }
  }

  async arrangeNames(): Promise<void> {
    this.clearMessages();
    this.arrangingNames.set(true);
    try {
      const result = await this.ps.arrangeNames();
      if (result.success) {
        this.successMessage.set('Nevek rendezése kész!');

        // Layout JSON automatikus mentése
        await this.autoSaveSnapshot();
      } else {
        this.error.set(result.error || 'Nevek rendezése sikertelen.');
      }
    } finally {
      this.arrangingNames.set(false);
    }
  }

  /**
   * Elrendezés frissítése (smart snapshot update):
   * - 0 snapshot → automatikusan létrehoz egyet "Automatikus mentés" névvel
   * - 1 snapshot → azt frissíti
   * - több snapshot → picker dialógus, alapból a legutolsót ajánlja
   */
  async updateSnapshot(): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size);
    if (!psdPath) return;

    const snapshots = this.snapshotService.snapshots();

    // Több snapshot → picker dialog
    if (snapshots.length > 1) {
      this.snapshotService.openUpdatePicker();
      return;
    }

    // 0 vagy 1 snapshot → közvetlen frissítés
    this.clearMessages();
    const target = snapshots.length === 1 ? snapshots[0] : null;
    const result = await this.snapshotService.updateSnapshot(target, boardSize, psdPath);

    if (result.success) {
      this.successMessage.set('Elrendezés frissítve!');
    } else {
      this.error.set(result.error || 'Elrendezés frissítése sikertelen.');
    }
  }

  /** Frissítés picker-ből kiválasztott snapshot felülírása */
  async updateSnapshotWithPick(snapshot: SnapshotListItem): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size);
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.updateSnapshot(snapshot, boardSize, psdPath);

    if (result.success) {
      this.successMessage.set(`Pillanatkép frissítve: ${snapshot.snapshotName}`);
    } else {
      this.error.set(result.error || 'Pillanatkép frissítése sikertelen.');
    }
  }

  getSizePixels(size: TabloSize): string {
    const dims = this.ps.parseSizeValue(size.value);
    if (!dims) return '';
    const w = Math.round(dims.widthCm * 200 / 2.54);
    const h = Math.round(dims.heightCm * 200 / 2.54);
    return `${w}×${h} px`;
  }

  /** PSD path feloldása: explicit path > computePsdPath (projekt kontextusból) */
  private async resolvePsdPath(size?: TabloSize | null): Promise<string | null> {
    if (this.currentPsdPath()) return this.currentPsdPath();

    const s = size ?? this.selectedSize();
    const p = this.project();
    if (!s) return null;

    return this.ps.computePsdPath(s.value, p ? {
      projectName: p.name,
      className: p.className,
      brandName: this.branding.brandName(),
    } : undefined);
  }

  /** Automatikus snapshot frissítés (csendes — nem jelenít meg hibaüzenetet) */
  private async autoSaveSnapshot(psdPath?: string | null): Promise<void> {
    const size = this.selectedSize();
    const path = psdPath ?? await this.resolvePsdPath();
    if (!path || !size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const latest = this.snapshotService.latestSnapshot();
    await this.snapshotService.updateSnapshot(latest, boardSize, path);
  }

  private clearMessages(): void {
    this.error.set(null);
    this.successMessage.set(null);
  }

  addLog(step: string, detail: string, status: DebugLogEntry['status'] = 'info'): void {
    this.debugService.addLog(step, detail, status);
  }

  clearDebugLogs(): void {
    this.debugService.clearLogs();
  }

  async generatePsdDebug(): Promise<void> {
    const size = this.selectedSize();
    if (!size) {
      this.addLog('Méret', 'Nincs méret kiválasztva!', 'error');
      return;
    }

    this.generating.set(true);
    try {
      await this.debugService.runDebugGeneration({
        size,
        project: this.project(),
        persons: this.persons(),
      });
    } catch (err) {
      this.addLog('Váratlan hiba', String(err), 'error');
    } finally {
      this.generating.set(false);
    }
  }

  /** Snapshot lista betöltés próba (projekt + méret kész után) */
  private snapshotsInitLoaded = false;
  private async tryLoadSnapshots(): Promise<void> {
    if (this.snapshotsInitLoaded) return;
    if (!this.project() || !this.selectedSize()) return;
    this.snapshotsInitLoaded = true;
    await this.loadSnapshots();
  }

  /** Snapshot lista betöltése (ha van PSD path) */
  async loadSnapshots(): Promise<void> {
    const psdPath = await this.resolvePsdPath();
    if (!psdPath) return;
    await this.snapshotService.loadSnapshots(psdPath);
  }

  /** Új pillanatkép mentése */
  async saveSnapshotFromDialog(): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size);
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.saveSnapshot(
      this.snapshotService.snapshotName(),
      boardSize,
      psdPath,
    );

    if (result.success) {
      this.successMessage.set('Pillanatkép mentve!');
    } else {
      this.error.set(result.error || 'Pillanatkép mentés sikertelen.');
    }
  }

  /** Pillanatkép visszaállítása — dialógust nyit a csoport-választóval */
  async restoreSnapshot(snapshot: SnapshotListItem): Promise<void> {
    await this.snapshotService.openRestoreDialog(snapshot);
  }

  /** Visszaállítás a dialógusból kiválasztott csoportokkal */
  async restoreWithGroups(groups: string[][]): Promise<void> {
    const snapshot = this.snapshotService.restoreDialogSnapshot();
    if (!snapshot) return;

    const psdPath = await this.resolvePsdPath();
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.restoreSnapshot(
      snapshot.filePath,
      psdPath,
      undefined,
      groups,
    );

    this.snapshotService.closeRestoreDialog();

    if (result.success) {
      this.successMessage.set(`Pillanatkép visszaállítva: ${snapshot.snapshotName}`);
    } else {
      this.error.set(result.error || 'Visszaállítás sikertelen.');
    }
  }

  /** Pillanatkép átnevezése (inline szerkesztésből) */
  async commitSnapshotRename(): Promise<void> {
    const psdPath = await this.resolvePsdPath();
    if (!psdPath) {
      this.snapshotService.cancelEditing();
      return;
    }

    const result = await this.snapshotService.commitEditing(psdPath);
    if (result.success) {
      this.successMessage.set('Pillanatkép átnevezve.');
    } else if (result.error) {
      this.error.set(result.error);
    }
  }

  /** Pillanatkép törlése */
  async deleteSnapshot(snapshot: SnapshotListItem): Promise<void> {
    const psdPath = await this.resolvePsdPath();
    if (!psdPath) return;

    this.clearMessages();
    const result = await this.snapshotService.deleteSnapshot(
      snapshot.filePath,
      psdPath,
    );

    if (result.success) {
      this.successMessage.set('Pillanatkép törölve.');
    } else {
      this.error.set(result.error || 'Törlés sikertelen.');
    }
  }

  // ============ Sablon rendszer ============

  /** Sablon mentése dialógusból */
  async saveTemplateFromDialog(): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.clearMessages();
    const result = await this.templateService.saveTemplate(boardSize);

    if (result.success) {
      this.successMessage.set('Sablon mentve!');
    } else {
      this.error.set(result.error || 'Sablon mentés sikertelen.');
    }
  }

  /** Sablon alkalmazása */
  async applyTemplate(templateId: string): Promise<void> {
    this.clearMessages();
    const result = await this.templateService.applyTemplate(templateId);

    if (result.success) {
      this.successMessage.set('Sablon alkalmazva!');
    } else {
      this.error.set(result.error || 'Sablon alkalmazás sikertelen.');
    }
  }

  /** Sablon törlése */
  async deleteTemplate(templateId: string): Promise<void> {
    this.clearMessages();
    const result = await this.templateService.deleteTemplate(templateId);

    if (result.success) {
      this.successMessage.set('Sablon törölve.');
    } else {
      this.error.set(result.error || 'Sablon törlés sikertelen.');
    }
  }

  /** Sablon átnevezés commit */
  async commitTemplateRename(): Promise<void> {
    const result = await this.templateService.commitEditing();
    if (result.success && result.error) {
      this.error.set(result.error);
    }
  }

  /** Személyek számának getter-je a template alkalmazás összehasonlításhoz */
  get currentStudentCount(): number {
    return this.persons().filter(p => p.type !== 'teacher').length;
  }

  // ============ Vizuális szerkesztő ============

  /** Vizuális szerkesztő megnyitása a legutolsó snapshot-tal */
  async openLayoutDesigner(): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    if (!latest) return;

    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath(size);
    if (!psdPath) return;

    this.designerSnapshotPath.set(latest.filePath);
    this.designerPsdPath.set(psdPath);
    this.designerBoardConfig.set(boardSize);
    this.showLayoutDesigner.set(true);
  }

  /** Vizuális szerkesztő mentés: módosított layerek új snapshot-ként mentése (az eredeti megmarad) */
  async onDesignerSave(event: { layers: SnapshotLayer[]; isLivePsd: boolean }): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await this.resolvePsdPath();
    if (!latest || !psdPath) {
      this.showLayoutDesigner.set(false);
      return;
    }

    this.clearMessages();

    // Snapshot betöltése → layers felülírása → új snapshot mentés
    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) {
      this.error.set('Nem sikerült betölteni a pillanatképet a mentéshez.');
      this.showLayoutDesigner.set(false);
      return;
    }

    const snapshotData = loadResult.data as Record<string, unknown>;
    snapshotData['layers'] = event.layers;

    let saveResult: { success: boolean; error?: string };

    if (event.isLivePsd) {
      // Friss PSD beolvasásból → teljesen új snapshot "Élő PSD" névvel
      saveResult = await this.ps.saveSnapshotDataAsNew(psdPath, snapshotData, 'Élő PSD beolvasás');
    } else {
      // Snapshot-ból indultunk → az eredeti neve alapján "(szerkesztett)" jelöléssel
      const originalName = latest.snapshotName.replace(/ \(szerkesztett\)$/, '');
      saveResult = await this.ps.saveSnapshotDataAsNew(psdPath, snapshotData, originalName);
    }

    this.showLayoutDesigner.set(false);

    if (saveResult.success) {
      this.successMessage.set('Elrendezés mentve új pillanatképként!');
      await this.loadSnapshots();
    } else {
      this.error.set(saveResult.error || 'Pillanatkép mentés sikertelen.');
    }
  }

  /** Vizuális szerkesztő bezárása */
  closeLayoutDesigner(): void {
    this.showLayoutDesigner.set(false);
  }
}
