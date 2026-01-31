import { Injectable, signal, computed } from '@angular/core';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface ToastConfig {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  action?: ToastAction;
}

export interface Toast extends ToastConfig {
  id: number;
  visible: boolean;
}

/**
 * Toast Service
 *
 * Toast értesítések megjelenítése.
 * Támogatja:
 * - Singleton toast (1 toast egyszerre) - backward compatible
 * - Toast queue (max 3 toast egyszerre)
 * - Action gombok (undo, custom action)
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  /** Aktuális toast (backward compatible - singleton toast) */
  toast = signal<Toast | null>(null);

  /** Toast queue (max 3 toast egyszerre) */
  private _toastQueue = signal<Toast[]>([]);

  /** Látható toast-ok (max 3) */
  readonly visibleToasts = computed(() =>
    this._toastQueue().slice(0, 3)
  );

  private idCounter = 0;
  private hideTimeout: ReturnType<typeof setTimeout> | null = null;
  private queueTimeouts = new Map<number, ReturnType<typeof setTimeout>>();

  /**
   * Toast megjelenítése
   */
  show(config: ToastConfig): void {
    // Előző toast törlése
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    const toast: Toast = {
      ...config,
      id: ++this.idCounter,
      visible: true,
      duration: config.duration ?? 2500
    };

    this.toast.set(toast);

    // Auto-hide
    if (toast.duration && toast.duration > 0) {
      this.hideTimeout = setTimeout(() => {
        this.hide();
      }, toast.duration);
    }
  }

  /**
   * Toast elrejtése
   */
  hide(): void {
    const current = this.toast();
    if (current) {
      this.toast.set({ ...current, visible: false });
      // Kis késleltetés az animációhoz
      setTimeout(() => {
        this.toast.set(null);
      }, 300);
    }
  }

  /**
   * Sikeres toast
   */
  success(title: string, message: string, duration?: number): void {
    this.show({ type: 'success', title, message, duration });
  }

  /**
   * Hiba toast
   */
  error(title: string, message: string, duration?: number): void {
    this.show({ type: 'error', title, message, duration: duration ?? 4000 });
  }

  /**
   * Info toast
   */
  info(title: string, message: string, duration?: number): void {
    this.show({ type: 'info', title, message, duration });
  }

  /**
   * Warning toast
   */
  warning(title: string, message: string, duration?: number): void {
    this.show({ type: 'warning', title, message, duration });
  }

  /**
   * Toast megjelenítése Undo gombbal
   * @param title Toast címe
   * @param message Toast üzenete
   * @param undoCallback Undo gomb callback
   * @param duration Megjelenítési idő (ms), default: 5000
   */
  showWithUndo(
    title: string,
    message: string,
    undoCallback: () => void,
    duration?: number
  ): void {
    this.showWithAction(
      title,
      message,
      {
        label: 'Visszavonás',
        callback: undoCallback
      },
      duration ?? 5000
    );
  }

  /**
   * Toast megjelenítése egyedi action gombbal
   * @param title Toast címe
   * @param message Toast üzenete
   * @param action Action gomb konfigurációja
   * @param duration Megjelenítési idő (ms), default: 4000
   */
  showWithAction(
    title: string,
    message: string,
    action: ToastAction,
    duration?: number
  ): void {
    this.addToQueue({
      type: 'info',
      title,
      message,
      action,
      duration: duration ?? 4000
    });
  }

  /**
   * Toast hozzáadása a queue-hoz (többszörös toast-okhoz)
   */
  addToQueue(config: ToastConfig): void {
    const toast: Toast = {
      ...config,
      id: ++this.idCounter,
      visible: true,
      duration: config.duration ?? 2500
    };

    // Hozzáadás a queue-hoz
    this._toastQueue.update(queue => [...queue, toast]);

    // Auto-hide beállítása
    if (toast.duration && toast.duration > 0) {
      const timeout = setTimeout(() => {
        this.removeFromQueue(toast.id);
      }, toast.duration);

      this.queueTimeouts.set(toast.id, timeout);
    }
  }

  /**
   * Toast eltávolítása a queue-ból ID alapján
   */
  removeFromQueue(id: number): void {
    // Timeout törlése
    const timeout = this.queueTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.queueTimeouts.delete(id);
    }

    // Toast elrejtése (visible: false)
    this._toastQueue.update(queue =>
      queue.map(toast =>
        toast.id === id ? { ...toast, visible: false } : toast
      )
    );

    // Teljes eltávolítás kis késleltetés után (animációhoz)
    setTimeout(() => {
      this._toastQueue.update(queue =>
        queue.filter(toast => toast.id !== id)
      );
    }, 300);
  }

  /**
   * Összes toast törlése (queue és singleton)
   */
  dismissAll(): void {
    // Singleton toast törlése
    this.hide();

    // Queue-ban lévő toast-ok törlése
    const queue = this._toastQueue();
    queue.forEach(toast => {
      const timeout = this.queueTimeouts.get(toast.id);
      if (timeout) {
        clearTimeout(timeout);
        this.queueTimeouts.delete(toast.id);
      }
    });

    // Összes toast elrejtése
    this._toastQueue.update(queue =>
      queue.map(toast => ({ ...toast, visible: false }))
    );

    // Teljes törlés kis késleltetés után
    setTimeout(() => {
      this._toastQueue.set([]);
    }, 300);
  }
}
