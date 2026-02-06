import { Component, ChangeDetectionStrategy, input, signal, inject, DestroyRef, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { PartnerService, SamplePackage, SampleVersion } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';
import { SamplePackageDialogComponent } from '../sample-package-dialog/sample-package-dialog.component';
import { SampleVersionDialogComponent } from '../sample-version-dialog/sample-version-dialog.component';

@Component({
  selector: 'app-project-samples-tab',
  standalone: true,
  imports: [
    DatePipe, LucideAngularModule, MatTooltipModule,
    SamplePackageDialogComponent, SampleVersionDialogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-samples-tab.component.html',
  styleUrl: './project-samples-tab.component.scss',
})
export class ProjectSamplesTabComponent implements OnInit {
  projectId = input.required<number>();

  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  loading = signal(true);
  packages = signal<SamplePackage[]>([]);
  expandedIds = signal<Set<number>>(new Set());

  // Package dialog
  showPackageDialog = signal(false);
  editingPackageId = signal<number | null>(null);
  editingPackageTitle = signal('');

  // Version dialog
  showVersionDialog = signal(false);
  versionDialogPackageId = signal<number>(0);
  editingVersion = signal<SampleVersion | null>(null);

  // Delete states
  showDeletePackageConfirm = signal(false);
  deletingPackage = signal<SamplePackage | null>(null);
  showDeleteVersionConfirm = signal(false);
  deletingVersion = signal<{ packageId: number; version: SampleVersion } | null>(null);
  deleting = signal(false);

  ngOnInit(): void {
    this.loadPackages();
  }

  loadPackages(): void {
    this.loading.set(true);
    this.partnerService.getSamplePackages(this.projectId()).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        this.packages.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Hiba', 'Nem sikerült a minták betöltése.');
      },
    });
  }

  isExpanded(id: number): boolean {
    return this.expandedIds().has(id);
  }

  toggleExpand(id: number): void {
    const ids = new Set(this.expandedIds());
    if (ids.has(id)) {
      ids.delete(id);
    } else {
      ids.add(id);
    }
    this.expandedIds.set(ids);
  }

  // Package CRUD
  openNewPackageDialog(): void {
    this.editingPackageId.set(null);
    this.editingPackageTitle.set('');
    this.showPackageDialog.set(true);
  }

  openEditPackageDialog(pkg: SamplePackage): void {
    this.editingPackageId.set(pkg.id);
    this.editingPackageTitle.set(pkg.title);
    this.showPackageDialog.set(true);
  }

  closePackageDialog(): void {
    this.showPackageDialog.set(false);
  }

  onPackageSaved(): void {
    this.closePackageDialog();
    this.loadPackages();
  }

  confirmDeletePackage(pkg: SamplePackage): void {
    this.deletingPackage.set(pkg);
    this.showDeletePackageConfirm.set(true);
  }

  cancelDeletePackage(): void {
    this.showDeletePackageConfirm.set(false);
    this.deletingPackage.set(null);
  }

  deletePackage(): void {
    const pkg = this.deletingPackage();
    if (!pkg) return;

    this.deleting.set(true);
    this.partnerService.deleteSamplePackage(this.projectId(), pkg.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toast.success('Siker', 'Csomag törölve.');
        this.cancelDeletePackage();
        this.loadPackages();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('Hiba', 'Nem sikerült a törlés.');
      },
    });
  }

  // Version CRUD
  openNewVersionDialog(packageId: number): void {
    this.versionDialogPackageId.set(packageId);
    this.editingVersion.set(null);
    this.showVersionDialog.set(true);
  }

  openEditVersionDialog(packageId: number, version: SampleVersion): void {
    this.versionDialogPackageId.set(packageId);
    this.editingVersion.set(version);
    this.showVersionDialog.set(true);
  }

  closeVersionDialog(): void {
    this.showVersionDialog.set(false);
  }

  onVersionSaved(): void {
    this.closeVersionDialog();
    this.loadPackages();
  }

  confirmDeleteVersion(packageId: number, version: SampleVersion): void {
    this.deletingVersion.set({ packageId, version });
    this.showDeleteVersionConfirm.set(true);
  }

  cancelDeleteVersion(): void {
    this.showDeleteVersionConfirm.set(false);
    this.deletingVersion.set(null);
  }

  deleteVersion(): void {
    const data = this.deletingVersion();
    if (!data) return;

    this.deleting.set(true);
    this.partnerService.deleteSampleVersion(this.projectId(), data.packageId, data.version.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toast.success('Siker', 'Verzió törölve.');
        this.cancelDeleteVersion();
        this.loadPackages();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('Hiba', 'Nem sikerült a törlés.');
      },
    });
  }
}
