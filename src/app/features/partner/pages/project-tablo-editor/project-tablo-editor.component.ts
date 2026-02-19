import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { ProjectDetailHeaderComponent } from '@shared/components/project-detail/project-detail-header/project-detail-header.component';
import { ProjectDetailData } from '@shared/components/project-detail/project-detail.types';
import { PartnerService, PartnerProjectDetails } from '../../services/partner.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';
import { TabloEditorDebugService, DebugLogEntry } from './tablo-editor-debug.service';

type EditorTab = 'commands' | 'settings' | 'debug';

@Component({
  selector: 'app-project-tablo-editor',
  standalone: true,
  imports: [LucideAngularModule, ProjectDetailHeaderComponent, MatTooltipModule],
  providers: [TabloEditorDebugService],
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

  /** Projekt személyei (diákok + tanárok) */
  readonly persons = signal<TabloPersonItem[]>([]);

  /** Debug log (delegálva a debug service-nek) */
  readonly debugLogs = this.debugService.debugLogs;

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
      } else {
        this.error.set(result.error || 'Nevek rendezése sikertelen.');
      }
    } finally {
      this.arrangingNames.set(false);
    }
  }

  getSizePixels(size: TabloSize): string {
    const dims = this.ps.parseSizeValue(size.value);
    if (!dims) return '';
    const w = Math.round(dims.widthCm * 200 / 2.54);
    const h = Math.round(dims.heightCm * 200 / 2.54);
    return `${w}×${h} px`;
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
}
