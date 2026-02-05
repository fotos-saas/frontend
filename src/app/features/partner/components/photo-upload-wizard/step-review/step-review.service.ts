import { Injectable, signal, computed, Signal } from '@angular/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import {
  UploadedPhoto,
  TabloPersonItem,
  MatchResult,
  PhotoAssignment
} from '../../../services/partner.service';
import { SampleLightboxItem } from '../../../../../shared/components/samples-lightbox';
import { PersonWithPhoto, TypeFilter } from './index';

/**
 * Step Review service - üzleti logika: szűrés, drag-drop, assignment kezelés, lightbox.
 * Komponens szintű provider (providedIn: null).
 */
@Injectable({ providedIn: null })
export class StepReviewService {

  // === Bemeneti signal-ek (komponens állítja be) ===
  private _persons = signal<TabloPersonItem[]>([]);
  private _matchResult = signal<MatchResult | null>(null);
  private _uploadedPhotos = signal<UploadedPhoto[]>([]);
  private _assignments = signal<PhotoAssignment[]>([]);
  private _unassignedPhotos = signal<UploadedPhoto[]>([]);

  readonly searchQuery = signal('');
  readonly typeFilter = signal<TypeFilter>('student');

  // Lightbox állapot
  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);

  // === Setter-ek (input binding-hoz) ===

  setPersons(v: TabloPersonItem[]): void { this._persons.set(v); }
  setMatchResult(v: MatchResult | null): void { this._matchResult.set(v); }
  setUploadedPhotos(v: UploadedPhoto[]): void { this._uploadedPhotos.set(v); }
  setAssignments(v: PhotoAssignment[]): void { this._assignments.set(v); }
  setUnassignedPhotos(v: UploadedPhoto[]): void { this._unassignedPhotos.set(v); }

  // === Computed-ek ===

  readonly personsWithPhotos = computed<PersonWithPhoto[]>(() => {
    return this._persons().map(person => {
      const assignment = this._assignments().find(a => a.personId === person.id);
      const assignedPhoto = assignment
        ? this._uploadedPhotos().find(p => p.mediaId === assignment.mediaId) ?? null
        : null;

      const match = this._matchResult()?.matches.find(m =>
        m.name === person.name && m.mediaId === assignment?.mediaId
      );

      return {
        ...person,
        assignedPhoto,
        matchConfidence: match?.confidence ?? null,
        hasExistingPhoto: person.hasPhoto
      };
    });
  });

  readonly filteredPersonsWithPhotos = computed(() => {
    return this.applyFilters(this.personsWithPhotos());
  });

  readonly pairedPersons = computed(() => {
    return this.applyFilters(this.personsWithPhotos())
      .filter(p => p.assignedPhoto || p.hasExistingPhoto);
  });

  readonly missingPersonsList = computed(() => {
    return this.applyFilters(this.personsWithPhotos())
      .filter(p => !p.assignedPhoto && !p.hasExistingPhoto);
  });

  readonly allDropListIds = computed(() => {
    const pairedIds = this.pairedPersons().map(p => `person-${p.id}`);
    const missingIds = this.missingPersonsList().map(p => `person-${p.id}`);
    return [...pairedIds, ...missingIds, 'unassigned-list'];
  });

  readonly lightboxItems = computed<SampleLightboxItem[]>(() => {
    return this._uploadedPhotos().map(photo => ({
      id: photo.mediaId,
      url: photo.fullUrl,
      thumbUrl: photo.thumbUrl,
      fileName: photo.filename,
      createdAt: new Date().toISOString()
    }));
  });

  readonly studentStats = computed(() => {
    const students = this.personsWithPhotos().filter(p => p.type === 'student');
    return {
      total: students.length,
      assigned: students.filter(s => s.assignedPhoto || s.hasExistingPhoto).length
    };
  });

  readonly teacherStats = computed(() => {
    const teachers = this.personsWithPhotos().filter(p => p.type === 'teacher');
    return {
      total: teachers.length,
      assigned: teachers.filter(t => t.assignedPhoto || t.hasExistingPhoto).length
    };
  });

  readonly assignedCount = computed(() => {
    return this.filteredPersonsWithPhotos()
      .filter(p => p.assignedPhoto || p.hasExistingPhoto).length;
  });

  readonly missingCount = computed(() => {
    return this.filteredPersonsWithPhotos()
      .filter(p => !p.assignedPhoto && !p.hasExistingPhoto).length;
  });

  readonly unassignedPhotos: Signal<UploadedPhoto[]> = this._unassignedPhotos.asReadonly();

  // === Szűrés ===

  private applyFilters(persons: PersonWithPhoto[]): PersonWithPhoto[] {
    let result = persons;

    const typeF = this.typeFilter();
    if (typeF !== 'all') {
      result = result.filter(p => p.type === typeF);
    }

    const query = this.searchQuery().trim().toLowerCase();
    if (query) {
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    return result;
  }

  // === Drag & Drop ===

  onDropOnPersonCard(event: CdkDragDrop<unknown>, targetPerson: PersonWithPhoto): PhotoAssignment[] | null {
    const draggedItem = event.item.data;

    if (this.isUploadedPhoto(draggedItem)) {
      return this.assignPhotoToPerson(draggedItem.mediaId, targetPerson.id);
    }

    if (this.isPersonWithPhoto(draggedItem) && draggedItem.assignedPhoto) {
      return this.swapAssignments(draggedItem, targetPerson);
    }

    return null;
  }

  onDropOnUnassigned(event: CdkDragDrop<unknown>): PhotoAssignment[] | null {
    if (event.previousContainer === event.container) return null;

    const draggedItem = event.item.data;
    if (this.isPersonWithPhoto(draggedItem) && draggedItem.assignedPhoto) {
      return this.removeAssignment(draggedItem);
    }

    return null;
  }

  private assignPhotoToPerson(mediaId: number, personId: number): PhotoAssignment[] {
    const newAssignments = this._assignments().filter(a =>
      a.personId !== personId && a.mediaId !== mediaId
    );
    newAssignments.push({ personId, mediaId });
    return newAssignments;
  }

  private swapAssignments(sourcePerson: PersonWithPhoto, targetPerson: PersonWithPhoto): PhotoAssignment[] | null {
    if (!sourcePerson.assignedPhoto) return null;

    const sourceMediaId = sourcePerson.assignedPhoto.mediaId;
    const targetMediaId = targetPerson.assignedPhoto?.mediaId;

    const newAssignments = this._assignments().filter(a =>
      a.personId !== sourcePerson.id && a.personId !== targetPerson.id
    );

    newAssignments.push({ personId: targetPerson.id, mediaId: sourceMediaId });

    if (targetMediaId) {
      newAssignments.push({ personId: sourcePerson.id, mediaId: targetMediaId });
    }

    return newAssignments;
  }

  removeAssignment(person: PersonWithPhoto): PhotoAssignment[] {
    return this._assignments().filter(a => a.personId !== person.id);
  }

  // === Type Guards ===

  private isUploadedPhoto(item: unknown): item is UploadedPhoto {
    return !!item && typeof item === 'object' &&
      'mediaId' in item && 'thumbUrl' in item && !('name' in item);
  }

  private isPersonWithPhoto(item: unknown): item is PersonWithPhoto {
    return !!item && typeof item === 'object' &&
      'id' in item && 'name' in item && 'assignedPhoto' in item;
  }

  // === Lightbox ===

  openLightbox(photo: UploadedPhoto): void {
    const index = this._uploadedPhotos().findIndex(p => p.mediaId === photo.mediaId);
    if (index >= 0) {
      this.lightboxIndex.set(index);
      this.lightboxOpen.set(true);
    }
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  onLightboxNavigate(index: number): void {
    this.lightboxIndex.set(index);
  }
}
