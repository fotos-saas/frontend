import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SamplesService, Sample, ProjectInfo } from './services/samples.service';
import { forkJoin } from 'rxjs';
import { LoggerService } from '../../core/services/logger.service';
import { SamplesLightboxComponent, SampleLightboxItem } from '../../shared/components/samples-lightbox';

/**
 * Samples Component - Mintaképek oldal
 *
 * Megjeleníti a tabló projekt mintaképeit grid-ben,
 * lightbox-szerű nagyítással.
 *
 * Lazy-loaded standalone komponens.
 */
@Component({
    selector: 'app-samples',
    standalone: true,
    imports: [
        SamplesLightboxComponent,
        DatePipe,
    ],
    templateUrl: './samples.component.html',
    styleUrls: ['./samples.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SamplesComponent implements OnInit {
  /** Mintaképek listája */
  samples: Sample[] = [];

  /** Projekt info */
  projectInfo: ProjectInfo | null = null;

  /** Betöltés állapot */
  loading = true;

  /** Hibaüzenet */
  error: string | null = null;

  /** Kiválasztott kép indexe (null ha nincs lightbox nyitva) */
  selectedIndex: number | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly samplesService = inject(SamplesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly logger = inject(LoggerService);

  ngOnInit(): void {
    this.loadData();
  }

  /**
   * Adatok betöltése (minták + projekt info)
   */
  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      samples: this.samplesService.getSamples(),
      projectInfo: this.samplesService.getProjectInfo()
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (responses) => {
        if (responses.samples.success) {
          this.samples = responses.samples.data;
        }
        if (responses.projectInfo.success) {
          this.projectInfo = responses.projectInfo.data;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = 'Hiba történt az adatok betöltésekor';
        this.loading = false;
        this.cdr.markForCheck();
        this.logger.error('Load error', err);
      }
    });
  }

  /**
   * TrackBy függvény a samples listához
   */
  trackBySample(index: number, sample: Sample): number {
    return sample.id;
  }

  /**
   * Mintaképek újratöltése
   */
  loadSamples(): void {
    this.loadData();
  }

  /**
   * Relatív idő formázás (X napja / X órája)
   */
  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Most' : `${diffMins} perce`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 órája' : `${diffHours} órája`;
    } else if (diffDays < 30) {
      return diffDays === 1 ? '1 napja' : `${diffDays} napja`;
    } else {
      const diffMonths = Math.floor(diffDays / 30);
      return diffMonths === 1 ? '1 hónapja' : `${diffMonths} hónapja`;
    }
  }

  /**
   * Lightbox megnyitása
   */
  openLightbox(index: number): void {
    this.selectedIndex = index;
  }

  /**
   * Lightbox bezárása
   */
  closeLightbox(): void {
    this.selectedIndex = null;
  }

  /**
   * Lightbox navigáció (közös komponens hívja)
   */
  onNavigate(index: number): void {
    this.selectedIndex = index;
  }

  /**
   * Sample → SampleLightboxItem konverzió a közös lightbox-hoz
   */
  get lightboxSamples(): SampleLightboxItem[] {
    return this.samples.map(s => ({
      id: s.id,
      url: s.url,
      thumbUrl: s.thumbUrl,
      fileName: s.fileName,
      createdAt: s.createdAt,
      description: s.description || undefined
    }));
  }

}
