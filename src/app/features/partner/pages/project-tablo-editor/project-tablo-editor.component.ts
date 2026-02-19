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
import { TabloSize } from '../../models/partner.models';

type EditorTab = 'commands' | 'settings';

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
      },
      error: () => this.loading.set(false),
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
      const result = await this.ps.generateAndOpenPsd(size, p ? {
        projectName: p.name,
        className: p.className,
        brandName: this.branding.brandName(),
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
}
