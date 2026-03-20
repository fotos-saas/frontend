import { DestroyRef, inject, signal, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { LoggerService } from '../../core/services/logger.service';

export interface ResourceLoader {
  loading: WritableSignal<boolean>;
  load: <T>(source$: Observable<T>, setter: (data: T) => void, errorMsg: string) => void;
}

/**
 * Kompozíciós utility az ismétlődő load pattern kiváltására.
 *
 * Használat (injection context-ben, pl. field initializer):
 * ```ts
 * private rl = createResourceLoader();
 * readonly loading = this.rl.loading;
 * ```
 */
export function createResourceLoader(destroyRef?: DestroyRef): ResourceLoader {
  const dr = destroyRef ?? inject(DestroyRef);
  const logger = inject(LoggerService);
  const loading = signal(true);

  return {
    loading,
    load: <T>(source$: Observable<T>, setter: (data: T) => void, errorMsg: string) => {
      loading.set(true);
      source$.pipe(takeUntilDestroyed(dr)).subscribe({
        next: (data) => {
          setter(data);
          loading.set(false);
        },
        error: (err) => {
          logger.error(errorMsg, err);
          loading.set(false);
        },
      });
    },
  };
}
