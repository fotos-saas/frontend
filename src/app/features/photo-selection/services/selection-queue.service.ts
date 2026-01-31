import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, timeout, retry, timer, catchError } from 'rxjs';

import { ToastService } from '../../../core/services/toast.service';
import { LoggerService } from '../../../core/services/logger.service';
import { TabloWorkflowService } from './tablo-workflow.service';
import { WorkflowStep, AutoSaveResponse } from '../models/workflow.models';

interface PendingState {
  galleryId: number;
  photoIds: number[];
  step: WorkflowStep;
}

/**
 * Selection Queue Service - Signal-alapú mentési queue
 *
 * Működési elv:
 * 1. User kattint → `pendingState` signal frissül (MINDIG felülírja az előzőt)
 * 2. 300ms debounce után indul a mentés
 * 3. Ha közben újabb kattintás érkezik → pending frissül, mentés után újra megy
 * 4. Retry mechanizmus (2x 1s késleltetéssel)
 *
 * FONTOS: Mindig csak az UTOLSÓ állapotot küldi el!
 * Ha 10x kattintasz gyorsan, akkor is csak 1-2 request megy ki
 * (1 ha a debounce összefogja, 2 ha közben fut mentés)
 *
 * Előnyök:
 * - GARANTÁLTAN az utolsó állapot mentésre kerül
 * - Nincs felesleges request (nem queue, hanem "last wins")
 * - Retry mechanizmus (2x 1s késleltetéssel)
 * - Observable state (hasUnsaved, isSaving computed signals)
 * - Timeout védelem (15s)
 */
@Injectable()
export class SelectionQueueService {
  private readonly workflowService = inject(TabloWorkflowService);
  private readonly toast = inject(ToastService);
  private readonly logger = inject(LoggerService);
  private readonly destroyRef = inject(DestroyRef);

  /** Debounce időablak (ms) */
  private readonly DEBOUNCE_MS = 300;

  /** Maximum retry kísérletek */
  private readonly MAX_RETRIES = 2;

  /** Retry késleltetés (ms) */
  private readonly RETRY_DELAY_MS = 1000;

  /** API hívás timeout (ms) */
  private readonly TIMEOUT_MS = 15000;

  // === SIGNALS ===

  /** Mentésre váró állapot (MINDIG az utolsó, nincs queue!) */
  private readonly pendingState = signal<PendingState | null>(null);

  /** Fut-e jelenleg mentés */
  private readonly processing = signal(false);

  /** Utolsó sikeres mentés időpontja */
  private readonly lastSaved = signal<Date | null>(null);

  /** Utolsó hiba üzenet */
  private readonly lastError = signal<string | null>(null);

  /** Debounce timer ID */
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  // === COMPUTED SIGNALS ===

  /** Van-e mentetlen változás */
  readonly hasUnsaved = computed(() => this.pendingState() !== null);

  /** Mentés folyamatban */
  readonly isSaving = computed(() => this.processing());

  /** Utolsó sikeres mentés */
  readonly lastSaveTime = computed(() => this.lastSaved());

  /** Utolsó hiba */
  readonly error = computed(() => this.lastError());

  constructor() {
    // Auto-process effect: mentés befejezése után, ha van pending, újra indítjuk
    effect(() => {
      const pending = this.pendingState();
      const isProcessing = this.processing();

      // Ha van pending ÉS nincs folyamatban mentés ÉS nincs aktív debounce timer
      // → indítjuk a mentést (a debounce timer kezeli a késleltetést)
      if (pending && !isProcessing && !this.debounceTimer) {
        this.scheduleProcess();
      }
    }, { allowSignalWrites: true });
  }

  /**
   * Új állapot beállítása (MINDIG felülírja az előzőt - "last wins")
   *
   * Ha 10x gyorsan kattintasz:
   * - pendingState MINDIG az utolsó állapotra frissül
   * - debounce timer MINDIG újraindul
   * - Végül csak 1 request megy ki az utolsó állapottal
   */
  enqueue(galleryId: number, photoIds: number[], step: WorkflowStep): void {
    // MINDIG felülírjuk a pending state-et (last wins!)
    this.pendingState.set({ galleryId, photoIds, step });

    // Debounce timer újraindítása
    this.scheduleProcess();

    this.logger.debug(`[SelectionQueue] Pending state frissítve, photoIds: ${photoIds.length}`);
  }

  /**
   * Debounce timer kezelése
   */
  private scheduleProcess(): void {
    // Ha van aktív timer, töröljük (újraindítjuk a debounce-t)
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Ha már fut mentés, nem indítunk timert (az effect majd újraindítja)
    if (this.processing()) {
      this.debounceTimer = null;
      return;
    }

    // Új timer indítása
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      this.processNext();
    }, this.DEBOUNCE_MS);
  }

  /**
   * Reset (komponens destroy-kor)
   */
  reset(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.pendingState.set(null);
    this.processing.set(false);
    this.lastError.set(null);
    this.logger.debug('[SelectionQueue] Reset');
  }

  /**
   * Pending state feldolgozása
   */
  private async processNext(): Promise<void> {
    const pending = this.pendingState();
    if (!pending || this.processing()) {
      return;
    }

    // Pending törlése ÉS processing beállítása
    this.pendingState.set(null);
    this.processing.set(true);
    this.lastError.set(null);

    try {
      await this.executeSave(pending);

      // Sikeres mentés
      this.lastSaved.set(new Date());
      this.logger.debug('[SelectionQueue] Mentés sikeres');

    } catch (err) {
      this.lastError.set((err as Error).message || 'Ismeretlen hiba');
      this.logger.error('[SelectionQueue] Mentési hiba (retry után is)', err);
      this.toast.error(
        'Mentési hiba',
        'A kiválasztás mentése nem sikerült. Kérjük, próbáld újra.'
      );
    } finally {
      this.processing.set(false);
      // Ha közben jött új pending, az effect újraindítja
    }
  }

  /**
   * Mentés végrehajtása step szerint (retry + timeout)
   */
  private async executeSave(state: PendingState): Promise<void> {
    const { galleryId, photoIds, step } = state;

    switch (step) {
      case 'claiming':
        await this.executeWithRetry(
          this.workflowService.saveClaimingSelection(galleryId, photoIds)
        );
        break;

      case 'retouch':
        await this.executeWithRetry(
          this.workflowService.autoSaveRetouchSelection(galleryId, photoIds)
        );
        break;

      case 'tablo':
        if (photoIds.length === 1) {
          await this.executeWithRetry(
            this.workflowService.autoSaveTabloSelection(galleryId, photoIds[0])
          );
        } else if (photoIds.length === 0) {
          // Tablókép törlés - null-t küldünk
          await this.executeWithRetry(
            this.workflowService.clearTabloSelection(galleryId)
          );
        }
        // Tablo step-nél pontosan 0 vagy 1 kép lehet
        break;

      default:
        // Egyéb step-eknél nem mentünk
        break;
    }
  }

  /**
   * Observable végrehajtása retry + timeout wrapperrel
   */
  private async executeWithRetry<T>(source$: import('rxjs').Observable<T>): Promise<T> {
    const result$ = source$.pipe(
      takeUntilDestroyed(this.destroyRef),
      timeout(this.TIMEOUT_MS),
      retry({
        count: this.MAX_RETRIES,
        delay: (error, retryCount) => {
          this.logger.warn(`[SelectionQueue] Retry ${retryCount}/${this.MAX_RETRIES}`, error);
          return timer(this.RETRY_DELAY_MS);
        },
      })
    );

    const response = await firstValueFrom(result$);

    // Cascade message kezelése (AutoSaveResponse esetén)
    if (response && typeof response === 'object' && 'cascade_message' in response) {
      const cascadeMsg = (response as unknown as AutoSaveResponse).cascade_message;
      if (cascadeMsg) {
        this.toast.info('Frissítve', cascadeMsg);
      }
    }

    return response;
  }
}
