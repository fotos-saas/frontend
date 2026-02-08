import { signal, computed } from '@angular/core';
import {
  MonitoringPerson,
  MonitoringSummary,
  MonitoringFilter,
  PersonSelections,
  SelectionPhoto,
} from '../../../../models/gallery-monitoring.models';
import { LightboxMediaItem } from '../../../../../../shared/components/media-lightbox/media-lightbox.types';

/**
 * Gallery Monitoring State
 * Signal-based state management a monitoring tabhoz.
 */
export class GalleryMonitoringState {
  readonly loading = signal<boolean>(true);
  readonly persons = signal<MonitoringPerson[]>([]);
  readonly summary = signal<MonitoringSummary | null>(null);
  readonly searchQuery = signal<string>('');
  readonly filterStatus = signal<MonitoringFilter>('all');
  readonly exportingExcel = signal<boolean>(false);
  readonly exportingZip = signal<boolean>(false);
  readonly showDownloadDialog = signal<boolean>(false);

  /** Kinyitott személy ID (expand/collapse) */
  readonly expandedPersonId = signal<number | null>(null);

  /** Kinyitott személy kiválasztásai */
  readonly expandedSelections = signal<PersonSelections | null>(null);

  /** Kiválasztások betöltési állapota */
  readonly loadingSelections = signal<boolean>(false);

  /** Lightbox állapot */
  readonly lightboxOpen = signal<boolean>(false);
  readonly lightboxMedia = signal<LightboxMediaItem[]>([]);
  readonly lightboxIndex = signal<number>(0);

  /** Export beállítások (projekt szintű effektív értékek) */
  readonly exportSettings = signal<{
    zip_content: string;
    file_naming: string;
    always_ask: boolean;
  }>({ zip_content: 'all', file_naming: 'original', always_ask: true });

  /** Szűrt és ABC-rendezett személyek */
  readonly filteredPersons = computed<MonitoringPerson[]>(() => {
    let list = this.persons();
    const query = this.searchQuery().toLowerCase().trim();
    const filter = this.filterStatus();

    // Szöveges keresés
    if (query) {
      list = list.filter(p => p.name.toLowerCase().includes(query));
    }

    // Státusz szűrő
    switch (filter) {
      case 'finalized':
        list = list.filter(p => p.workflowStatus === 'finalized');
        break;
      case 'in_progress':
        list = list.filter(p => p.workflowStatus === 'in_progress');
        break;
      case 'not_started':
        list = list.filter(p => !p.hasOpened);
        break;
      case 'stale':
        list = list.filter(p => p.staleWarning);
        break;
    }

    // ABC sorrend
    return [...list].sort((a, b) => a.name.localeCompare(b.name, 'hu'));
  });

  setSearchQuery(query: string): void {
    this.searchQuery.set(query);
  }

  setFilter(filter: MonitoringFilter): void {
    this.filterStatus.set(filter);
  }

  setData(persons: MonitoringPerson[], summary: MonitoringSummary): void {
    this.persons.set(persons);
    this.summary.set(summary);
    this.loading.set(false);
  }

  toggleExpand(personId: number): void {
    if (this.expandedPersonId() === personId) {
      this.expandedPersonId.set(null);
      this.expandedSelections.set(null);
    } else {
      this.expandedPersonId.set(personId);
      this.expandedSelections.set(null);
      this.loadingSelections.set(true);
    }
  }

  setSelections(selections: PersonSelections): void {
    this.expandedSelections.set(selections);
    this.loadingSelections.set(false);
  }

  setSelectionsError(): void {
    this.loadingSelections.set(false);
  }

  openLightbox(photos: SelectionPhoto[], index: number): void {
    const media: LightboxMediaItem[] = photos
      .filter(p => p.thumbUrl || p.url)
      .map(p => ({
        id: p.id,
        url: p.url || p.thumbUrl || '',
        fileName: p.originalName || `photo-${p.id}`,
      }));

    if (media.length === 0) return;

    this.lightboxMedia.set(media);
    this.lightboxIndex.set(Math.min(index, media.length - 1));
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  navigateLightbox(index: number): void {
    this.lightboxIndex.set(index);
  }

  setLoading(): void {
    this.loading.set(true);
  }

  setError(): void {
    this.loading.set(false);
  }
}
