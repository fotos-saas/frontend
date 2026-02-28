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
import { PartnerFinalizationService } from '../../services/partner-finalization.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloSize, TabloSizeThreshold, TabloPersonItem } from '../../models/partner.models';
import { selectTabloSize } from '@shared/utils/tablo-size.util';
import { TabloEditorSnapshotService } from './tablo-editor-snapshot.service';
import { TabloEditorTemplateService } from './tablo-editor-template.service';
import { SnapshotListItem, SnapshotLayer, TemplateListItem } from '@core/services/electron.types';
import { SnapshotRestoreDialogComponent } from './snapshot-restore-dialog.component';
import { TemplateSaveDialogComponent } from './template-save-dialog.component';
import { TemplateApplyDialogComponent } from './template-apply-dialog.component';
import { LayoutDesignerComponent } from './layout-designer/layout-designer.component';
import { TabloLayoutDialogComponent, BoardDimensions } from './tablo-layout-dialog/tablo-layout-dialog.component';
import { TabloLayoutConfig } from './layout-designer/layout-designer.types';

type EditorTab = 'commands' | 'settings';

@Component({
  selector: 'app-project-tablo-editor',
  standalone: true,
  imports: [LucideAngularModule, ProjectDetailHeaderComponent, MatTooltipModule, DialogWrapperComponent, SnapshotRestoreDialogComponent, TemplateSaveDialogComponent, TemplateApplyDialogComponent, LayoutDesignerComponent, TabloLayoutDialogComponent],
  providers: [TabloEditorSnapshotService, TabloEditorTemplateService],
  templateUrl: './project-tablo-editor.component.html',
  styleUrl: './project-tablo-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTabloEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly partnerService = inject(PartnerService);
  private readonly finalizationService = inject(PartnerFinalizationService);
  private readonly ps = inject(PhotoshopService);
  private readonly branding = inject(BrandingService);
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

  /** Extra nevek a projektből (diákok + tanárok akik nincsenek regisztrálva) */
  readonly projectExtraNames = computed(() => this.project()?.extraNames ?? null);

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

  /** PSD generálás / megnyitás */
  readonly tabloSizes = signal<TabloSize[]>([]);
  readonly selectedSize = signal<TabloSize | null>(null);
  readonly loadingSizes = signal(false);
  private sizeThreshold: TabloSizeThreshold | null = null;
  private sizeResolved = false;
  readonly generating = signal(false);
  readonly opening = signal(false);
  readonly arranging = signal(false);
  readonly arrangingNames = signal(false);

  /** Minta generálás */
  readonly generatingSample = signal(false);
  readonly sampleResult = signal<{ localPaths: string[]; uploadedCount: number; generatedAt: string } | null>(null);

  /** Véglegesítés */
  readonly generatingFinal = signal(false);
  readonly finalResult = signal<{ localPath: string; uploadedCount: number; generatedAt: string } | null>(null);
  readonly projectStatus = computed(() => this.project()?.status ?? null);

  /** Minta beállítások (signal referenciák a ps service-ből) */
  readonly sampleSizeLarge = this.ps.sampleSizeLarge;
  readonly sampleSizeSmall = this.ps.sampleSizeSmall;
  readonly sampleLargeSize = this.ps.sampleUseLargeSize;
  readonly sampleWatermarkText = this.ps.sampleWatermarkText;
  readonly sampleWatermarkColor = this.ps.sampleWatermarkColor;
  readonly sampleWatermarkOpacity = this.ps.sampleWatermarkOpacity;
  readonly opacityPercent = computed(() => Math.round(this.sampleWatermarkOpacity() * 100));

  /** Aktuális PSD fájl útvonala (generáláskor mentjük) */
  readonly currentPsdPath = signal<string | null>(null);
  /** Feloldott PSD útvonal */
  readonly resolvedPsdPath = signal<string | null>(null);

  /** Projekt személyei (diákok + tanárok) */
  readonly persons = signal<TabloPersonItem[]>([]);

  /** Vizuális szerkesztő */
  readonly showLayoutDesigner = signal(false);
  readonly designerSnapshotPath = signal<string | null>(null);
  readonly designerPsdPath = signal<string | null>(null);
  readonly designerBoardConfig = signal<{ widthCm: number; heightCm: number } | null>(null);

  /** Mentés elnevezési dialógus */
  readonly showDesignerSaveDialog = signal(false);
  readonly designerSaveName = signal('');
  readonly designerSaving = signal(false);
  private pendingDesignerSave: { layers: SnapshotLayer[]; isLivePsd: boolean } | null = null;

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

  /** PSD fájl létezés (régi migrált projekteknél) */
  readonly psdExists = signal(false);
  readonly psdHasLayouts = signal(false);
  readonly generatingInitialSnapshot = signal(false);

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

    // Overlay context beallitasa a projectId-val (normal modban is kell a feltolteshez)
    window.electronAPI?.overlay.setContext({ mode: 'normal', projectId: id });
  }

  private loadProject(id: number): void {
    this.partnerService.getProjectDetails(id).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (project) => {
        this.project.set(project);
        this.loading.set(false);
        this.loadPersons(id);
        this.tryResolveSize();
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
        this.sizeThreshold = res.threshold;
        this.tryResolveSize();
        this.loadingSizes.set(false);
        this.tryLoadSnapshots();
      },
      error: () => this.loadingSizes.set(false),
    });
  }

  /** Méretválasztás: mindkét adat (sizes + project) kell hozzá */
  private tryResolveSize(): void {
    if (this.sizeResolved) return;
    const sizes = this.tabloSizes();
    const project = this.project();
    if (sizes.length === 0 || !project) return;

    this.sizeResolved = true;

    // 1. Mentett projekt-szintű méret
    if (project.tabloSize) {
      const match = sizes.find(s => s.value === project.tabloSize);
      if (match) { this.selectedSize.set(match); return; }
    }

    // 2. Küszöbérték: csak diákok száma számít (tanárok nem!)
    if (this.sizeThreshold) {
      const studentCount = project.studentsCount ?? project.expectedClassSize ?? 0;
      if (studentCount > 0) {
        const auto = selectTabloSize(studentCount, sizes, this.sizeThreshold);
        if (auto) { this.selectedSize.set(auto); return; }
      }
    }

    // 3. Fallback: első méret
    this.selectedSize.set(sizes[0]);
  }

  goBack(): void {
    this.location.back();
  }

  onStatusChange(event: { value: string; label: string; color: string }): void {
    const id = this.project()?.id;
    if (!id) return;

    this.partnerService.updateProject(id, { status: event.value }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        const current = this.project();
        if (current) {
          this.project.set({ ...current, status: event.value, statusLabel: event.label, statusColor: event.color });
        }
      },
    });
  }

  selectSize(size: TabloSize): void {
    this.selectedSize.set(size);
    const projectId = this.project()?.id;
    if (projectId) {
      this.finalizationService.updateTabloSize(projectId, size.value).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe();
    }
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

  /** PSD generálás indítása — dialógust nyit a layout beállításokhoz */
  readonly pendingGenerate = signal(false);

  generatePsd(): void {
    this.pendingGenerate.set(true);
    this.showLayoutDialog.set(true);
  }

  /** Layout dialógus → Alkalmaz → PSD generálás vagy újrarendezés */
  async onLayoutConfigApplyInternal(config: TabloLayoutConfig): Promise<void> {
    this.showLayoutDialog.set(false);
    this.lastLayoutConfig.set(config);

    // Gap + align frissítés a service-ben
    this.ps.setGapH(config.gapHCm);
    this.ps.setGapV(config.gapVCm);
    this.ps.setGridAlign(config.gridAlign);

    if (this.pendingGenerate()) {
      this.pendingGenerate.set(false);
      await this.doGeneratePsd(config);
    } else {
      await this.doArrangeTabloLayout(config);
    }
  }

  /** Dialógus bezárásakor a pending generate-et is töröljük */
  closeLayoutDialog(): void {
    this.showLayoutDialog.set(false);
    this.pendingGenerate.set(false);
  }

  /** Tényleges PSD generálás (a dialógus után) */
  private async doGeneratePsd(config: TabloLayoutConfig): Promise<void> {
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
        schoolName: p.school?.name ?? null,
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

        // Project-info.json írása a PSD mappájába (overlay toolbar azonosításhoz)
        if (p) {
          window.electronAPI?.photoshop.writeProjectInfo({
            psdFilePath: result.outputPath,
            projectId: p.id,
            projectName: p.name,
            schoolName: p.school?.name ?? undefined,
            className: p.className ?? undefined,
          });
        }
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

      // 0.5 Subtitle feliratok
      const subtitles = this.ps.buildSubtitles({
        schoolName: p?.school?.name,
        className: p?.className,
        classYear: p?.classYear,
      });
      if (subtitles.length > 0) {
        const subResult = await this.ps.addSubtitleLayers(subtitles, psdFileName);
        if (!subResult.success) {
          this.error.set(`Feliratok: ${subResult.error}`);
        }
      }

      // PSD megnyitás után: JSX layerek hozzáadása (ha vannak személyek)
      if (personsData.length > 0) {
        // 1. Név layerek (text)
        const nameResult = await this.ps.addNameLayers(personsData, psdFileName);

        // 2. Image layerek (Smart Object placeholder-ek)
        const imageResult = await this.ps.addImageLayers(personsData, undefined, psdFileName);

        const nameOk = nameResult.success;
        const imageOk = imageResult.success;

        // 3. Tablóelrendezés: tanárok fent, feliratok középen, diákok lent + nevek
        if (imageOk) {
          const boardSize = this.ps.parseSizeValue(size.value);
          if (boardSize) {
            const layoutResult = await this.ps.arrangeTabloLayout(boardSize, psdFileName, undefined, config);
            if (!layoutResult.success) {
              this.error.set(`Tablóelrendezés: ${layoutResult.error}`);
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

  /** PSD fájl megnyitása Photoshopban */
  async openPsdFile(): Promise<void> {
    const psdPath = this.currentPsdPath();
    if (!psdPath) return;

    this.clearMessages();
    this.opening.set(true);
    try {
      const result = await this.ps.openPsdFile(psdPath);
      if (!result.success) {
        this.error.set(result.error || 'Nem sikerült megnyitni a PSD fájlt.');
      }
    } finally {
      this.opening.set(false);
    }
  }

  /** Projekt mappa megnyitása Finderben */
  openProjectFolder(): void {
    const psdPath = this.currentPsdPath();
    if (!psdPath) return;
    this.ps.revealInFinder(psdPath);
  }

  /** Elrendezési minta dialógus */
  readonly showLayoutDialog = signal(false);
  readonly lastLayoutConfig = signal<TabloLayoutConfig | null>(null);

  /** Diákok és tanárok száma a dialógushoz */
  readonly studentCountForDialog = computed(() =>
    this.persons().filter(p => p.type !== 'teacher').length,
  );
  readonly teacherCountForDialog = computed(() =>
    this.persons().filter(p => p.type === 'teacher').length,
  );

  /** Tábla fizikai méretek a dialógus arányos előnézetéhez */
  readonly boardDimensionsForDialog = computed<BoardDimensions | null>(() => {
    const size = this.selectedSize();
    if (!size) return null;
    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return null;
    return {
      boardWidthCm: boardSize.widthCm,
      boardHeightCm: boardSize.heightCm,
      marginCm: this.ps.marginCm(),
      studentSizeCm: this.ps.studentSizeCm(),
      teacherSizeCm: this.ps.teacherSizeCm(),
    };
  });

  arrangeTabloLayout(): void {
    this.pendingGenerate.set(false);
    this.showLayoutDialog.set(true);
  }

  /** Tényleges újrarendezés (a dialógus után, nem generálás) */
  private async doArrangeTabloLayout(config: TabloLayoutConfig): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    this.clearMessages();
    this.arranging.set(true);
    try {
      const result = await this.ps.arrangeTabloLayout(boardSize, undefined, undefined, config);
      if (result.success) {
        this.successMessage.set('Tablóelrendezés kész!');
        await this.autoSaveSnapshot();
      } else {
        this.error.set(result.error || 'Tablóelrendezés sikertelen.');
      }
    } finally {
      this.arranging.set(false);
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

    const resolved = await this.ps.computePsdPath(s.value, p ? {
      projectName: p.name,
      schoolName: p.school?.name ?? null,
      className: p.className,
      brandName: this.branding.brandName(),
    } : undefined);

    // Auto-open: PS service mindig tudja a PSD útvonalat
    if (resolved) {
      this.ps.psdPath.set(resolved);
      this.resolvedPsdPath.set(resolved);
    }
    return resolved;
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

  /** Snapshot lista betöltés próba (projekt + méret kész után) */
  private snapshotsInitLoaded = false;
  private async tryLoadSnapshots(): Promise<void> {
    if (this.snapshotsInitLoaded) return;
    if (!this.project() || !this.selectedSize()) return;
    this.snapshotsInitLoaded = true;

    const psdPath = await this.resolvePsdPath();
    if (!psdPath) return;

    // PSD fájl létezés ellenőrzése
    const check = await this.ps.checkPsdExists(psdPath);
    this.psdExists.set(check.exists);
    this.psdHasLayouts.set(check.hasLayouts);

    if (check.exists) {
      this.currentPsdPath.set(psdPath);

      // Project-info.json frissítése (overlay toolbar azonosításhoz)
      const p = this.project();
      if (p) {
        window.electronAPI?.photoshop.writeProjectInfo({
          psdFilePath: psdPath,
          projectId: p.id,
          projectName: p.name,
          schoolName: p.school?.name ?? undefined,
          className: p.className ?? undefined,
        });
      }

      if (check.hasLayouts) {
        await this.snapshotService.loadSnapshots(psdPath);
      }
    }
  }

  /** Snapshot lista betöltése (ha van PSD path) */
  async loadSnapshots(): Promise<void> {
    const psdPath = await this.resolvePsdPath();
    if (!psdPath) return;
    await this.snapshotService.loadSnapshots(psdPath);
  }

  /** Pillanatkép generálása meglévő PSD-ből (régi migrált projektek) */
  async generateSnapshotFromExistingPsd(): Promise<void> {
    const size = this.selectedSize();
    if (!size) return;

    const boardSize = this.ps.parseSizeValue(size.value);
    if (!boardSize) return;

    const psdPath = await this.resolvePsdPath();
    if (!psdPath) return;

    this.generatingInitialSnapshot.set(true);
    this.clearMessages();

    const psdFileName = psdPath.split('/').pop() || undefined;

    const result = await this.snapshotService.saveSnapshot(
      'Kezdeti elrendezés',
      boardSize,
      psdPath,
      psdFileName,
    );

    this.generatingInitialSnapshot.set(false);

    if (result.success) {
      this.psdHasLayouts.set(true);
      await this.openLayoutDesigner();
    } else {
      this.error.set(result.error || 'Nem sikerült kiolvasni az elrendezést. Győződj meg, hogy a PSD meg van nyitva a Photoshop-ban!');
    }
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

  // ============ Minta generálás ============

  toggleLargeSize(): void {
    const next = !this.sampleLargeSize();
    this.sampleLargeSize.set(next);
    this.ps.setSampleSettings({ useLargeSize: next });
  }

  toggleWatermarkColor(): void {
    const next = this.sampleWatermarkColor() === 'white' ? 'black' : 'white';
    this.sampleWatermarkColor.set(next);
    this.ps.setSampleSettings({ watermarkColor: next });
  }

  cycleWatermarkOpacity(): void {
    const pct = Math.round(this.sampleWatermarkOpacity() * 100);
    const next = (pct >= 23 ? 10 : pct + 1) / 100;
    this.sampleWatermarkOpacity.set(next);
    this.ps.setSampleSettings({ watermarkOpacity: next });
  }

  async generateSample(): Promise<void> {
    if (this.generatingSample()) return;
    const p = this.project();
    if (!p) return;

    this.clearMessages();
    this.generatingSample.set(true);
    try {
      const result = await this.ps.generateSample(p.id, p.name, this.sampleLargeSize(), {
        schoolName: p.school?.name ?? null,
        className: p.className ?? null,
      });
      if (result.success) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        this.sampleResult.set({
          localPaths: result.localPaths || [],
          uploadedCount: result.uploadedCount || 0,
          generatedAt: timeStr,
        });
        this.successMessage.set(`Minta generálás kész! ${result.localPaths?.length || 0} fájl mentve, ${result.uploadedCount || 0} feltöltve.`);
      } else {
        this.error.set(result.error || 'Minta generálás sikertelen.');
      }
    } finally {
      this.generatingSample.set(false);
    }
  }

  async generateFinal(): Promise<void> {
    if (this.generatingFinal()) return;
    const p = this.project();
    if (!p) return;

    this.clearMessages();
    this.generatingFinal.set(true);
    try {
      const result = await this.ps.generateFinal(p.id, p.name, {
        schoolName: p.school?.name ?? null,
        className: p.className ?? null,
      });
      if (result.success) {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        this.finalResult.set({
          localPath: result.localPath || '',
          uploadedCount: result.uploadedCount || 0,
          generatedAt: timeStr,
        });
        this.successMessage.set(`Véglegesítés kész! Feltöltve: ${result.uploadedCount || 0} fájl.`);
      } else {
        this.error.set(result.error || 'Véglegesítés sikertelen.');
      }
    } finally {
      this.generatingFinal.set(false);
    }
  }

  setSampleSizeLargeValue(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 500 && v <= 10000) this.ps.setSampleSettings({ sizeLarge: v });
  }

  setSampleSizeSmallValue(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 500 && v <= 10000) this.ps.setSampleSettings({ sizeSmall: v });
  }

  setSampleWatermarkTextValue(e: Event) {
    const v = (e.target as HTMLInputElement).value.trim();
    if (v.length > 0) this.ps.setSampleSettings({ watermarkText: v });
  }

  setSampleWatermarkColorValue(color: 'white' | 'black') {
    this.ps.setSampleSettings({ watermarkColor: color });
  }

  setSampleWatermarkOpacityValue(e: Event) {
    const v = Number((e.target as HTMLInputElement).value);
    if (!isNaN(v) && v >= 0.05 && v <= 0.50) this.ps.setSampleSettings({ watermarkOpacity: v });
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

  /** Vizuális szerkesztő mentés: dialógust nyit az elnevezéshez */
  onDesignerSave(event: { layers: SnapshotLayer[]; isLivePsd: boolean }): void {
    this.pendingDesignerSave = event;
    this.showLayoutDesigner.set(false);

    // Auto név generálás
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    if (event.isLivePsd) {
      this.designerSaveName.set(`Élő PSD ${dateStr}`);
    } else {
      const latest = this.snapshotService.latestSnapshot();
      const baseName = latest?.snapshotName.replace(/ \(szerkesztett\)$/, '') || 'Pillanatkép';
      this.designerSaveName.set(`${baseName} (szerkesztett)`);
    }

    this.showDesignerSaveDialog.set(true);
  }

  /** Mentés elnevezési dialógus — tényleges mentés */
  async confirmDesignerSave(): Promise<void> {
    const event = this.pendingDesignerSave;
    if (!event) return;

    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await this.resolvePsdPath();
    if (!latest || !psdPath) {
      this.showDesignerSaveDialog.set(false);
      this.pendingDesignerSave = null;
      return;
    }

    this.designerSaving.set(true);
    this.clearMessages();

    // Snapshot betöltése → layers felülírása → új snapshot mentés
    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) {
      this.error.set('Nem sikerült betölteni a pillanatképet a mentéshez.');
      this.showDesignerSaveDialog.set(false);
      this.designerSaving.set(false);
      this.pendingDesignerSave = null;
      return;
    }

    const snapshotData = loadResult.data as Record<string, unknown>;
    snapshotData['layers'] = event.layers;

    const name = this.designerSaveName().trim() || 'Szerkesztett';
    snapshotData['snapshotName'] = name;
    snapshotData['createdAt'] = new Date().toISOString();

    // Fájlnév generálás
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const slugName = name.toLowerCase().replace(/[^a-z0-9áéíóöőúüű]+/gi, '-').replace(/-+$/, '');
    const fileName = `${dateStr}_${slugName}.json`;

    const saveResult = await this.ps.saveSnapshotWithFileName(psdPath, snapshotData, fileName);

    this.showDesignerSaveDialog.set(false);
    this.designerSaving.set(false);
    this.pendingDesignerSave = null;

    if (saveResult.success) {
      this.successMessage.set(`Pillanatkép mentve: ${name}`);
      await this.loadSnapshots();
    } else {
      this.error.set(saveResult.error || 'Pillanatkép mentés sikertelen.');
    }
  }

  /** Auto-mentés a designer-ből (pl. frissítés után) — dialógus nélkül, nem lép ki */
  async onDesignerAutoSave(event: { layers: SnapshotLayer[] }): Promise<void> {
    const latest = this.snapshotService.latestSnapshot();
    const psdPath = await this.resolvePsdPath();
    if (!latest || !psdPath) return;

    const loadResult = await this.ps.loadSnapshot(latest.filePath);
    if (!loadResult.success || !loadResult.data) return;

    const snapshotData = loadResult.data as Record<string, unknown>;
    snapshotData['layers'] = event.layers;

    // Auto cím: "Élő PSD HH:MM"
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    snapshotData['snapshotName'] = `Élő PSD ${timeStr}`;
    snapshotData['createdAt'] = now.toISOString();

    // Fix fájlnév — mindig felülírja az előzőt, nem halmozódik
    const saveResult = await this.ps.saveSnapshotWithFileName(psdPath, snapshotData, '_elo-psd.json');

    if (saveResult.success) {
      await this.loadSnapshots();
    }
  }

  /** Extra nevek frissítése a layout designer dialógusból */
  onExtraNamesUpdated(extraNames: { students: string; teachers: string }): void {
    const p = this.project();
    if (p) {
      this.project.set({ ...p, extraNames });
    }
  }

  /** Mentés elnevezési dialógus bezárása (nem ment) */
  cancelDesignerSave(): void {
    this.showDesignerSaveDialog.set(false);
    this.pendingDesignerSave = null;
  }

  /** Vizuális szerkesztő bezárása */
  closeLayoutDesigner(): void {
    this.showLayoutDesigner.set(false);
  }
}
