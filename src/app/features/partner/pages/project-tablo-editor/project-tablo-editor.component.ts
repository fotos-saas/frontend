import { Component, ChangeDetectionStrategy, inject, signal, OnInit, DestroyRef, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { ProjectDetailHeaderComponent } from '@shared/components/project-detail/project-detail-header/project-detail-header.component';
import { ProjectDetailData } from '@shared/components/project-detail/project-detail.types';
import { PartnerService, PartnerProjectDetails } from '../../services/partner.service';
import { PhotoshopService } from '../../services/photoshop.service';
import { BrandingService } from '../../services/branding.service';
import { TabloSize, TabloPersonItem } from '../../models/partner.models';

type EditorTab = 'commands' | 'settings' | 'debug';

interface DebugLogEntry {
  time: string;
  step: string;
  detail: string;
  status: 'ok' | 'warn' | 'error' | 'info';
}

@Component({
  selector: 'app-project-tablo-editor',
  standalone: true,
  imports: [LucideAngularModule, ProjectDetailHeaderComponent],
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

  /** PSD generálás */
  readonly tabloSizes = signal<TabloSize[]>([]);
  readonly selectedSize = signal<TabloSize | null>(null);
  readonly loadingSizes = signal(false);
  readonly generating = signal(false);

  /** Projekt személyei (diákok + tanárok) */
  readonly persons = signal<TabloPersonItem[]>([]);

  /** Debug log */
  readonly debugLogs = signal<DebugLogEntry[]>([]);

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
      }));

      const result = await this.ps.generateAndOpenPsd(size, p ? {
        projectName: p.name,
        className: p.className,
        brandName: this.branding.brandName(),
        persons: personsData.length > 0 ? personsData : undefined,
      } : undefined);
      if (result.success) {
        this.successMessage.set(`PSD generálva és megnyitva: ${size.label}`);
      } else {
        this.error.set(result.error || 'PSD generálás sikertelen.');
      }
    } finally {
      this.generating.set(false);
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
    const time = new Date().toLocaleTimeString('hu-HU', { hour12: false });
    this.debugLogs.update(logs => [...logs, { time, step, detail, status }]);
  }

  clearDebugLogs(): void {
    this.debugLogs.set([]);
  }

  async generatePsdDebug(): Promise<void> {
    this.clearDebugLogs();
    this.generating.set(true);

    const size = this.selectedSize();
    if (!size) {
      this.addLog('Méret', 'Nincs méret kiválasztva!', 'error');
      this.generating.set(false);
      return;
    }

    try {
      // 1. Méret
      const dims = this.ps.parseSizeValue(size.value);
      if (dims) {
        this.addLog('Méret', `${size.label} (${size.value}) → ${dims.widthCm}×${dims.heightCm} cm`, 'ok');
      } else {
        this.addLog('Méret', `Érvénytelen: ${size.value}`, 'error');
        return;
      }

      // 2. Projekt
      const p = this.project();
      if (p) {
        this.addLog('Projekt', `${p.name} / ${p.className || '–'}  (id: ${p.id})`, 'ok');
      } else {
        this.addLog('Projekt', 'Nincs projekt betöltve!', 'error');
      }

      // 3. WorkDir
      const workDir = this.ps.workDir();
      if (workDir) {
        this.addLog('WorkDir', workDir, 'ok');
      } else {
        this.addLog('WorkDir', 'Nincs beállítva — Downloads mappába generál', 'warn');
      }

      // 4. Személyek
      const allPersons = this.persons();
      const students = allPersons.filter(pe => pe.type === 'student');
      const teachers = allPersons.filter(pe => pe.type === 'teacher');
      if (allPersons.length > 0) {
        const names = allPersons.slice(0, 3).map(pe => pe.name).join(', ');
        const suffix = allPersons.length > 3 ? ` …+${allPersons.length - 3}` : '';
        this.addLog('Személyek betöltve', `${allPersons.length} fő (${students.length} diák, ${teachers.length} tanár) — ${names}${suffix}`, 'ok');
      } else {
        this.addLog('Személyek betöltve', '0 fő — ÜRES!', 'warn');
      }

      // 5. Persons tömb
      const personsData = allPersons.map(person => ({
        id: person.id,
        name: person.name,
        type: person.type,
      }));
      this.addLog('Persons tömb', `length=${personsData.length} | ${JSON.stringify(personsData.slice(0, 2))}${personsData.length > 2 ? '…' : ''}`, 'info');

      // 6. IPC paraméterek
      const brandName = this.branding.brandName();
      const partnerDir = brandName ? this.ps.sanitizeName(brandName) : 'photostack';
      const year = new Date().getFullYear().toString();
      let outputPath: string;
      if (p && workDir) {
        const folderName = this.ps.sanitizeName(
          p.className ? `${p.name}-${p.className}` : p.name,
        );
        outputPath = `${workDir}/${partnerDir}/${year}/${folderName}/${folderName}.psd`;
      } else {
        outputPath = `(Downloads)/PhotoStack/${size.value}.psd`;
      }
      this.addLog('IPC params', `widthCm=${dims.widthCm}, heightCm=${dims.heightCm}, dpi=200, persons=${personsData.length}, outputPath=${outputPath}`, 'info');

      // 7. IPC generatePsd hívás
      this.addLog('IPC generatePsd', 'Hívás indítva...', 'info');
      const context = p ? {
        projectName: p.name,
        className: p.className,
        brandName,
        persons: personsData.length > 0 ? personsData : undefined,
      } : undefined;

      const result = await this.ps.generateAndOpenPsd(size, context);

      // 8. IPC eredmény
      if (result.success) {
        this.addLog('IPC eredmény', `Sikeres! outputPath=${result.outputPath}`, 'ok');
      } else {
        this.addLog('IPC eredmény', `HIBA: ${result.error}`, 'error');
      }

      // 9. Végeredmény
      if (result.success) {
        this.addLog('Végeredmény', 'PSD generálva és megnyitva!', 'ok');
      } else {
        this.addLog('Végeredmény', 'Sikertelen — lásd fenti hibát', 'error');
      }
    } catch (err) {
      this.addLog('Váratlan hiba', String(err), 'error');
    } finally {
      this.generating.set(false);
    }
  }
}
