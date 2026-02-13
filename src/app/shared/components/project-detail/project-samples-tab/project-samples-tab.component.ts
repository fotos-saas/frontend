import { Component, ChangeDetectionStrategy, input, signal, computed, inject, DestroyRef, OnInit, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ICONS } from '../../../constants/icons.constants';
import { InfoBoxComponent } from '../../../components/info-box';
import { PartnerService, SamplePackage, SampleVersion } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

/** Típusok a szülőnek emitált event-ekhez */
export interface PackageDialogRequest {
  editId: number | null;
  initialTitle: string;
}

export interface VersionDialogRequest {
  packageId: number | null;
  editVersion: SampleVersion | null;
}

export interface DeleteVersionRequest {
  packageId: number;
  version: SampleVersion;
}

@Component({
  selector: 'app-project-samples-tab',
  standalone: true,
  imports: [DatePipe, FormsModule, LucideAngularModule, MatTooltipModule, InfoBoxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './project-samples-tab.component.html',
  styleUrl: './project-samples-tab.component.scss',
})
export class ProjectSamplesTabComponent implements OnInit {
  projectId = input.required<number>();

  /** Output event-ek - a szülő kezeli a dialógusokat page-card-on kívül */
  readonly packageDialogRequested = output<PackageDialogRequest>();
  readonly versionDialogRequested = output<VersionDialogRequest>();
  readonly deletePackageRequested = output<SamplePackage>();
  readonly deleteVersionRequested = output<DeleteVersionRequest>();

  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  loading = signal(true);
  packages = signal<SamplePackage[]>([]);
  searchQuery = signal('');
  deleting = signal(false);

  filteredPackages = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const sorted = [...this.packages()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (!q) return sorted;
    return sorted.filter(pkg =>
      pkg.title.toLowerCase().includes(q) ||
      pkg.versions.some(v => v.description?.toLowerCase().includes(q))
    );
  });

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

  // Új minta: packageId=null → a verzió dialógus mentéskor hozza létre a csomagot
  addNewSample(): void {
    this.versionDialogRequested.emit({ packageId: null, editVersion: null });
  }

  openEditPackageDialog(pkg: SamplePackage): void {
    this.packageDialogRequested.emit({ editId: pkg.id, initialTitle: pkg.title });
  }

  confirmDeletePackage(pkg: SamplePackage): void {
    this.deletePackageRequested.emit(pkg);
  }

  /** A szülő hívja confirm után */
  executeDeletePackage(pkg: SamplePackage): void {
    this.deleting.set(true);
    this.partnerService.deleteSamplePackage(this.projectId(), pkg.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toast.success('Siker', 'Csomag törölve.');
        this.loadPackages();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('Hiba', 'Nem sikerült a törlés.');
      },
    });
  }

  // Version CRUD - output event-ek a szülőnek
  openNewVersionDialog(packageId: number): void {
    this.versionDialogRequested.emit({ packageId, editVersion: null });
  }

  openEditVersionDialog(packageId: number, version: SampleVersion): void {
    this.versionDialogRequested.emit({ packageId, editVersion: version });
  }

  confirmDeleteVersion(packageId: number, version: SampleVersion): void {
    this.deleteVersionRequested.emit({ packageId, version });
  }

  /** A szülő hívja confirm után */
  executeDeleteVersion(packageId: number, versionId: number): void {
    this.deleting.set(true);
    this.partnerService.deleteSampleVersion(this.projectId(), packageId, versionId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.deleting.set(false);
        this.toast.success('Siker', 'Verzió törölve.');
        this.loadPackages();
      },
      error: () => {
        this.deleting.set(false);
        this.toast.error('Hiba', 'Nem sikerült a törlés.');
      },
    });
  }

  /** A szülő hívja, ha a package/version dialog-ban mentés történt */
  onDialogSaved(): void {
    this.loadPackages();
  }
}
