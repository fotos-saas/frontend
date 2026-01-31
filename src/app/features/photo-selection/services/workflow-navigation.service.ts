import { Injectable, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { TabloWorkflowService } from './tablo-workflow.service';
import { WorkflowStep, StepData } from '../models/workflow.models';

/**
 * Workflow Navigation Service
 *
 * Workflow lépések közötti navigáció kezelése:
 * - Előző/következő lépés
 * - Lépésre ugrás
 * - Readonly megtekintés (finalized workflow)
 */
@Injectable()
export class WorkflowNavigationService {
  private readonly workflowService = inject(TabloWorkflowService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Előző lépésre navigálás
   * Backend már teljes step adatot ad vissza, nem kell külön loadStepData() hívás
   */
  previousStep(
    galleryId: number,
    callbacks: {
      onStart: () => void;
      onSuccess: (data: StepData) => void;
      onError: (message: string) => void;
    }
  ): void {
    callbacks.onStart();

    this.workflowService.previousStep(galleryId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        callbacks.onSuccess(data);
      },
      error: (err) => {
        this.logger.error('Visszalépés hiba', err);
        callbacks.onError(err.message);
        this.toast.error('Visszalépés hiba', err.message || 'Hiba a visszalépés során');
      }
    });
  }

  /**
   * Következő lépésre navigálás
   * Backend már teljes step adatot ad vissza, nem kell külön loadStepData() hívás
   */
  nextStep(
    galleryId: number,
    callbacks: {
      onStart: () => void;
      onSuccess: (data: StepData) => void;
      onError: (message: string) => void;
    }
  ): void {
    callbacks.onStart();

    this.workflowService.nextStep(galleryId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        callbacks.onSuccess(data);
      },
      error: (err) => {
        this.logger.error('Továbblépés hiba', err);
        callbacks.onError(err.message);
        this.toast.error('Továbblépés hiba', err.message || 'Hiba a továbblépés során');
      }
    });
  }

  /**
   * Konkrét lépésre ugrás
   * Backend már teljes step adatot ad vissza, nem kell külön loadStepData() hívás
   */
  moveToStep(
    galleryId: number,
    step: WorkflowStep,
    callbacks: {
      onStart: () => void;
      onSuccess: (data: StepData) => void;
      onError: (message: string) => void;
    }
  ): void {
    callbacks.onStart();

    this.workflowService.moveToStep(galleryId, step).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        callbacks.onSuccess(data);
      },
      error: (err) => {
        this.logger.error('Lépésváltás hiba', err);
        callbacks.onError(err.message);
        this.toast.error('Lépésváltás hiba', err.message || 'Hiba a lépésváltás során');
      }
    });
  }

  /**
   * Lépés readonly megtekintése (finalized workflow)
   */
  viewStepReadonly(
    galleryId: number,
    step: WorkflowStep,
    callbacks: {
      onStart: () => void;
      onSuccess: (data: StepData) => void;
      onError: (message: string) => void;
    }
  ): void {
    callbacks.onStart();

    this.workflowService.loadStepDataForViewing(galleryId, step).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        callbacks.onSuccess(data);
      },
      error: (err) => {
        this.logger.error('Lépés megtekintési hiba', err);
        callbacks.onError(err.message);
        this.toast.error('Hiba', err.message || 'Hiba a lépés betöltése során');
      }
    });
  }

  /**
   * Completed adatok újratöltése (visszatérés readonly módból)
   */
  returnToCompleted(
    galleryId: number,
    callbacks: {
      onStart: () => void;
      onSuccess: (data: StepData) => void;
      onError: (message: string) => void;
    }
  ): void {
    callbacks.onStart();

    this.workflowService.loadStepData(galleryId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (data) => {
        callbacks.onSuccess(data);
      },
      error: (err) => {
        this.logger.error('Visszatérés hiba', err);
        callbacks.onError(err.message);
      }
    });
  }
}
