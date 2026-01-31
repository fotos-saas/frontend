# Értesítési Központ - Angular Komponensek

> Verzió: 1.1
> Dátum: 2025-01-23
> Angular: 20+ (Signals, standalone, OnPush)

**FONTOS:** A projektben már létezik `ToastService` és `WebsocketService` - ezeket BŐVÍTJÜK, nem újakat hozunk létre!

---

## Komponens Fa

```
src/app/
├── core/
│   └── services/
│       ├── notification.service.ts
│       ├── notification-state.service.ts
│       ├── toast.service.ts
│       └── notification-websocket.service.ts
├── shared/
│   └── components/
│       ├── notification-bell/
│       │   ├── notification-bell.component.ts
│       │   └── notification-bell.component.html
│       ├── notification-dropdown/
│       │   ├── notification-dropdown.component.ts
│       │   └── notification-dropdown.component.html
│       ├── notification-item/
│       │   ├── notification-item.component.ts
│       │   └── notification-item.component.html
│       ├── toast-container/
│       │   ├── toast-container.component.ts
│       │   └── toast-container.component.html
│       ├── toast/
│       │   ├── toast.component.ts
│       │   └── toast.component.html
│       └── sticky-banner/
│           ├── sticky-banner.component.ts
│           └── sticky-banner.component.html
└── features/
    └── notifications/
        ├── notifications.routes.ts
        ├── pages/
        │   ├── notifications-page/
        │   │   ├── notifications-page.component.ts
        │   │   └── notifications-page.component.html
        │   └── notification-settings-page/
        │       ├── notification-settings-page.component.ts
        │       └── notification-settings-page.component.html
        └── components/
            ├── notification-mode-selector/
            │   ├── notification-mode-selector.component.ts
            │   └── notification-mode-selector.component.html
            ├── notification-filter-tabs/
            │   ├── notification-filter-tabs.component.ts
            │   └── notification-filter-tabs.component.html
            └── notification-category-toggles/
                ├── notification-category-toggles.component.ts
                └── notification-category-toggles.component.html
```

---

## Routes

```typescript
// features/notifications/notifications.routes.ts
import { Routes } from '@angular/router';

export const NOTIFICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/notifications-page/notifications-page.component')
      .then(m => m.NotificationsPageComponent),
    title: 'értesítések'
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/notification-settings-page/notification-settings-page.component')
      .then(m => m.NotificationSettingsPageComponent),
    title: 'értesítési beállítások'
  }
];
```

---

## Models

### notification.model.ts

```typescript
export type NotificationType =
  | 'poke_received'
  | 'poke_reaction'
  | 'vote_created'
  | 'vote_ending'
  | 'vote_closed'
  | 'mention'
  | 'reply'
  | 'announcement'
  | 'event_reminder'
  | 'samples_added';

// V1: Egyszerűsített módok
export type NotificationMode = 'normal' | 'quiet';
// V2-ben bővíthető: 'chill' | 'active' | 'all' | 'custom';

export type NotificationCategory =
  | 'votes'
  | 'pokes'
  | 'mentions'
  | 'announcements'
  | 'replies'
  | 'events'
  | 'samples'
  | 'dailyDigest';

export interface NotificationAction {
  type: 'reaction' | 'navigate' | 'dismiss';
  label?: string;
  url?: string;
  options?: string[];
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string | null;
  emoji: string;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
  actionUrl: string | null;
  metadata: Record<string, unknown>;
  actions: NotificationAction[];
}

export interface NotificationModeConfig {
  key: NotificationMode;
  emoji: string;
  label: string;
  description: string;
  maxPushPerDay: number | null;
  categories: NotificationCategory[] | null;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  mode: NotificationMode;
  categories: Record<NotificationCategory, boolean>;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}
```

### toast.model.ts

```typescript
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  callback: () => void;
}

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration: number;
  action?: ToastAction;
  createdAt: number;
}

export interface ToastOptions {
  type?: ToastType;
  duration?: number;
  action?: ToastAction;
}
```

---

## Services

### notification.service.ts

HTTP service az API hívásokhoz.

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  Notification,
  NotificationSettings,
  NotificationMode,
  NotificationModeConfig
} from '../models/notification.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface NotificationsResponse {
  notifications: Notification[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1`;

  // Notifications
  getNotifications(options?: {
    filter?: string;
    unreadOnly?: boolean;
    cursor?: string;
    limit?: number;
  }): Observable<ApiResponse<NotificationsResponse>> {
    let params = new HttpParams();

    if (options?.filter) params = params.set('filter', options.filter);
    if (options?.unreadOnly) params = params.set('unread_only', 'true');
    if (options?.cursor) params = params.set('cursor', options.cursor);
    if (options?.limit) params = params.set('limit', options.limit.toString());

    return this.http.get<ApiResponse<NotificationsResponse>>(
      `${this.baseUrl}/notifications`,
      { params }
    );
  }

  getUnreadCount(): Observable<ApiResponse<{ count: number }>> {
    return this.http.get<ApiResponse<{ count: number }>>(
      `${this.baseUrl}/notifications/unread-count`
    );
  }

  markAsRead(id: number): Observable<ApiResponse<{ id: number; isRead: boolean; readAt: string }>> {
    return this.http.post<ApiResponse<{ id: number; isRead: boolean; readAt: string }>>(
      `${this.baseUrl}/notifications/${id}/read`,
      {}
    );
  }

  markAllAsRead(filter?: string): Observable<ApiResponse<{ markedCount: number; readAt: string }>> {
    return this.http.post<ApiResponse<{ markedCount: number; readAt: string }>>(
      `${this.baseUrl}/notifications/read-all`,
      filter ? { filter } : {}
    );
  }

  deleteNotification(id: number): Observable<ApiResponse<{ deleted: boolean }>> {
    return this.http.delete<ApiResponse<{ deleted: boolean }>>(
      `${this.baseUrl}/notifications/${id}`
    );
  }

  // Settings
  getSettings(): Observable<ApiResponse<NotificationSettings>> {
    return this.http.get<ApiResponse<NotificationSettings>>(
      `${this.baseUrl}/user/notification-settings`
    );
  }

  updateSettings(settings: Partial<NotificationSettings>): Observable<ApiResponse<{ updated: boolean; settings: NotificationSettings }>> {
    return this.http.put<ApiResponse<{ updated: boolean; settings: NotificationSettings }>>(
      `${this.baseUrl}/user/notification-settings`,
      settings
    );
  }

  // Mode
  getMode(): Observable<ApiResponse<{ mode: NotificationMode; modes: Record<NotificationMode, NotificationModeConfig> }>> {
    return this.http.get<ApiResponse<{ mode: NotificationMode; modes: Record<NotificationMode, NotificationModeConfig> }>>(
      `${this.baseUrl}/user/notification-mode`
    );
  }

  setMode(mode: NotificationMode): Observable<ApiResponse<{ mode: NotificationMode; appliedCategories: string[]; maxPushPerDay: number }>> {
    return this.http.put<ApiResponse<{ mode: NotificationMode; appliedCategories: string[]; maxPushPerDay: number }>>(
      `${this.baseUrl}/user/notification-mode`,
      { mode }
    );
  }
}
```

### notification-state.service.ts

Signals-alapú state management.

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { NotificationService } from './notification.service';
import {
  Notification,
  NotificationSettings,
  NotificationMode,
  NotificationModeConfig
} from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationStateService {
  private notificationService = inject(NotificationService);

  // State signals
  private _notifications = signal<Notification[]>([]);
  private _unreadCount = signal(0);
  private _settings = signal<NotificationSettings | null>(null);
  private _currentMode = signal<NotificationMode>('active');
  private _modes = signal<Record<NotificationMode, NotificationModeConfig> | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  private _hasMore = signal(true);
  private _cursor = signal<string | null>(null);

  // Public readonly signals
  readonly notifications = this._notifications.asReadonly();
  readonly unreadCount = this._unreadCount.asReadonly();
  readonly settings = this._settings.asReadonly();
  readonly currentMode = this._currentMode.asReadonly();
  readonly modes = this._modes.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly hasMore = this._hasMore.asReadonly();

  // Computed
  readonly hasBadge = computed(() => this._unreadCount() > 0);
  readonly badgeText = computed(() => {
    const count = this._unreadCount();
    if (count === 0) return null;
    if (count > 9) return '9+';
    return count.toString();
  });

  readonly currentModeConfig = computed(() => {
    const modes = this._modes();
    const current = this._currentMode();
    return modes?.[current] ?? null;
  });

  // Dropdown notifications (first 10)
  readonly dropdownNotifications = computed(() =>
    this._notifications().slice(0, 10)
  );

  // Grouped by date
  readonly groupedNotifications = computed(() => {
    const notifications = this._notifications();
    const groups: { label: string; notifications: Notification[] }[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let currentGroup: { label: string; notifications: Notification[] } | null = null;

    for (const notif of notifications) {
      const date = new Date(notif.createdAt);
      date.setHours(0, 0, 0, 0);

      let label: string;
      if (date.getTime() === today.getTime()) {
        label = 'ma';
      } else if (date.getTime() === yesterday.getTime()) {
        label = 'tegnap';
      } else {
        label = date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
      }

      if (!currentGroup || currentGroup.label !== label) {
        currentGroup = { label, notifications: [] };
        groups.push(currentGroup);
      }

      currentGroup.notifications.push(notif);
    }

    return groups;
  });

  // Actions
  async loadUnreadCount(): Promise<void> {
    try {
      const response = await this.notificationService.getUnreadCount().toPromise();
      if (response?.success) {
        this._unreadCount.set(response.data.count);
      }
    } catch (err) {
      console.error('Failed to load unread count', err);
    }
  }

  async loadNotifications(filter?: string, reset = false): Promise<void> {
    if (this._loading()) return;

    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.notificationService.getNotifications({
        filter,
        cursor: reset ? undefined : this._cursor() ?? undefined,
        limit: 20
      }).toPromise();

      if (response?.success) {
        const newNotifications = response.data.notifications;

        if (reset) {
          this._notifications.set(newNotifications);
        } else {
          this._notifications.update(existing => [...existing, ...newNotifications]);
        }

        this._cursor.set(response.data.meta.nextCursor);
        this._hasMore.set(response.data.meta.hasMore);
      }
    } catch (err: any) {
      this._error.set(err.message || 'Hiba történt');
    } finally {
      this._loading.set(false);
    }
  }

  async markAsRead(id: number): Promise<void> {
    // Optimistic update
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
      )
    );
    this._unreadCount.update(count => Math.max(0, count - 1));

    try {
      await this.notificationService.markAsRead(id).toPromise();
    } catch (err) {
      // Rollback
      this._notifications.update(notifications =>
        notifications.map(n =>
          n.id === id ? { ...n, isRead: false, readAt: null } : n
        )
      );
      this._unreadCount.update(count => count + 1);
    }
  }

  async markAllAsRead(filter?: string): Promise<void> {
    // Optimistic update
    const previousNotifications = this._notifications();
    const previousCount = this._unreadCount();

    this._notifications.update(notifications =>
      notifications.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
    this._unreadCount.set(0);

    try {
      await this.notificationService.markAllAsRead(filter).toPromise();
    } catch (err) {
      // Rollback
      this._notifications.set(previousNotifications);
      this._unreadCount.set(previousCount);
    }
  }

  async loadSettings(): Promise<void> {
    try {
      const response = await this.notificationService.getSettings().toPromise();
      if (response?.success) {
        this._settings.set(response.data);
      }
    } catch (err) {
      console.error('Failed to load settings', err);
    }
  }

  async updateSettings(settings: Partial<NotificationSettings>): Promise<boolean> {
    try {
      const response = await this.notificationService.updateSettings(settings).toPromise();
      if (response?.success) {
        this._settings.set(response.data.settings);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to update settings', err);
      return false;
    }
  }

  async loadMode(): Promise<void> {
    try {
      const response = await this.notificationService.getMode().toPromise();
      if (response?.success) {
        this._currentMode.set(response.data.mode);
        this._modes.set(response.data.modes);
      }
    } catch (err) {
      console.error('Failed to load mode', err);
    }
  }

  async setMode(mode: NotificationMode): Promise<boolean> {
    const previousMode = this._currentMode();

    // Optimistic update
    this._currentMode.set(mode);

    try {
      const response = await this.notificationService.setMode(mode).toPromise();
      return response?.success ?? false;
    } catch (err) {
      // Rollback
      this._currentMode.set(previousMode);
      return false;
    }
  }

  // WebSocket handlers
  handleNewNotification(notification: Notification): void {
    this._notifications.update(notifications => [notification, ...notifications]);
    this._unreadCount.update(count => count + 1);
  }

  handleNotificationRead(id: number, readAt: string): void {
    this._notifications.update(notifications =>
      notifications.map(n =>
        n.id === id ? { ...n, isRead: true, readAt } : n
      )
    );
  }

  handleUnreadCountUpdate(count: number): void {
    this._unreadCount.set(count);
  }

  // Reset (filter change)
  resetNotifications(): void {
    this._notifications.set([]);
    this._cursor.set(null);
    this._hasMore.set(true);
  }
}
```

### toast.service.ts - BŐVÍTÉS

**FONTOS:** A `ToastService` már létezik a projektben (`core/services/toast.service.ts`)!

Jelenlegi állapot:
```typescript
// Meglévő ToastService - csak 1 toast egyszerre
export class ToastService {
  toast = signal<Toast | null>(null);
  success(message: string): void;
  error(title: string, message?: string): void;
  info(message: string): void;
}
```

**BŐVÍTENDŐ funkcionalitás** (hozzáadandó a meglévő service-hez):

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { Toast, ToastOptions, ToastType } from '../models/toast.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  // MEGLÉVŐ (egyszeri toast)
  toast = signal<Toast | null>(null);

  // ÚJ: Toast queue (több toast kezelése)
  private _toastQueue = signal<Toast[]>([]);
  readonly visibleToasts = computed(() => this._toastQueue().slice(0, 3)); // Max 3

  private generateId(): string {
    return Math.random().toString(36).substring(2, 9);
  }

  // ÚJ: Általános show metódus
  show(message: string, options?: ToastOptions): string {
    const id = this.generateId();

    const toast: Toast = {
      id,
      type: options?.type ?? 'info',
      message,
      duration: options?.duration ?? (options?.type === 'error' ? 5000 : 3000),
      action: options?.action,
      createdAt: Date.now()
    };

    this._toastQueue.update(toasts => [toast, ...toasts]);

    if (toast.duration > 0) {
      setTimeout(() => this.dismiss(id), toast.duration);
    }

    return id;
  }

  // MEGLÉVŐ (módosítás nélkül - 2 paraméter mindenhol!)
  success(title: string, message: string, duration?: number): void { ... }
  error(title: string, message: string, duration?: number): void { ... }
  info(title: string, message: string, duration?: number): void { ... }

  // ÚJ: warning típus
  warning(message: string, options?: Omit<ToastOptions, 'type'>): string {
    return this.show(message, { ...options, type: 'warning' });
  }

  // ÚJ: dismiss metódusok
  dismiss(id: string): void {
    this._toastQueue.update(toasts => toasts.filter(t => t.id !== id));
  }

  dismissAll(): void {
    this._toastQueue.set([]);
  }

  // ÚJ: Snackbar with undo action
  showWithUndo(message: string, onUndo: () => void, duration = 5000): string {
    return this.show(message, {
      type: 'success',
      duration,
      action: {
        label: 'vissza',
        callback: () => {
          onUndo();
        }
      }
    });
  }
}
```

### notification-websocket.service.ts

WebSocket real-time handling.

**FONTOS:** A `WebsocketService` már létezik a projektben (`core/services/websocket.service.ts`)!
Ez a service a meglévő WebsocketService-t használja wrapper-ként.

```typescript
import { Injectable, inject, OnDestroy } from '@angular/core';
import { WebsocketService } from '@core/services/websocket.service'; // MEGLÉVŐ!
import { AuthService } from '@core/services/auth.service';
import { NotificationStateService } from './notification-state.service';
import { ToastService } from './toast.service';
import { Notification } from '../models/notification.model';

interface WsNotificationNew {
  data: Notification & {
    showToast: boolean;
    playSound: boolean;
    vibrate: number[] | null;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationWebSocketService implements OnDestroy {
  // MEGLÉVŐ WebsocketService használata
  private websocketService = inject(WebsocketService);
  private authService = inject(AuthService);
  private notificationState = inject(NotificationStateService);
  private toastService = inject(ToastService);

  private channelName: string | null = null;

  connect(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    // A meglévő WebsocketService.private() metódusát használjuk
    this.channelName = `user.${userId}.notifications`;
    const channel = this.websocketService.private(this.channelName);

    if (!channel) {
      console.warn('[NotificationWebSocket] Failed to create private channel');
      return;
    }

    // Új értesítés
    channel.listen('notification.new', (event: WsNotificationNew) => {
      const { showToast, playSound, vibrate, ...notification } = event.data;

      // Update state
      this.notificationState.handleNewNotification(notification);

      // Show toast if needed
      if (showToast) {
        // A meglévő ToastService 2 paramétert vár: title, message
        this.toastService.info(`${notification.emoji} ${notification.title}`, notification.message || '');
      }

      // Haptic feedback
      if (vibrate && navigator.vibrate) {
        navigator.vibrate(vibrate);
      }

      // Bell animation trigger
      this.triggerBellAnimation();
    });

    // Notification read (from another device)
    channel.listen('notification.read', (event: { data: { id: number; readAt: string } }) => {
      this.notificationState.handleNotificationRead(event.data.id, event.data.readAt);
    });

    // All read
    channel.listen('notification.read_all', () => {
      this.notificationState.loadNotifications(undefined, true);
    });

    // Unread count update
    channel.listen('unread_count.updated', (event: { data: { count: number } }) => {
      this.notificationState.handleUnreadCountUpdate(event.data.count);
    });
  }

  disconnect(): void {
    if (this.channelName) {
      this.websocketService.leave(this.channelName);
      this.channelName = null;
    }
  }

  private triggerBellAnimation(): void {
    // Emit event for bell component
    window.dispatchEvent(new CustomEvent('notification:bell-ring'));
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
```

---

## Components

### 1. NotificationBellComponent

Bell icon a navbar-ban.

```typescript
// shared/components/notification-bell/notification-bell.component.ts
import {
  Component,
  inject,
  signal,
  OnInit,
  OnDestroy,
  HostListener,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStateService } from '@core/services/notification-state.service';
import { NotificationWebSocketService } from '@core/services/notification-websocket.service';
import { NotificationDropdownComponent } from '../notification-dropdown/notification-dropdown.component';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, NotificationDropdownComponent],
  template: `
    <div class="relative">
      <!-- Bell Button -->
      <button
        (click)="toggleDropdown()"
        class="relative p-2 rounded-full transition-all"
        [class]="isOpen() ? 'bg-gray-100' : 'hover:bg-gray-100'"
        [attr.aria-expanded]="isOpen()"
        aria-label="Értesítések"
      >
        <!-- Bell Icon -->
        <span
          class="text-xl"
          [class.animate-bell-ring]="isRinging()"
        >
          🔔
        </span>

        <!-- Badge -->
        @if (state.hasBadge()) {
          <span
            class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 text-xs font-semibold text-white bg-red-500 rounded-full flex items-center justify-center border-2 border-white animate-badge-pop"
          >
            {{ state.badgeText() }}
          </span>
        }
      </button>

      <!-- Dropdown -->
      @if (isOpen()) {
        <app-notification-dropdown
          (closed)="closeDropdown()"
          (markAllRead)="onMarkAllRead()"
        />
      }
    </div>
  `,
  styles: [`
    @keyframes bell-ring {
      0%, 100% { transform: rotate(0deg); }
      10% { transform: rotate(15deg); }
      20% { transform: rotate(-15deg); }
      30% { transform: rotate(10deg); }
      40% { transform: rotate(-10deg); }
      50% { transform: rotate(5deg); }
      60% { transform: rotate(-5deg); }
      70% { transform: rotate(0deg); }
    }

    @keyframes badge-pop {
      0% { transform: scale(0); }
      50% { transform: scale(1.3); }
      100% { transform: scale(1); }
    }

    .animate-bell-ring {
      animation: bell-ring 0.8s ease-in-out;
    }

    .animate-badge-pop {
      animation: badge-pop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  protected state = inject(NotificationStateService);
  private wsService = inject(NotificationWebSocketService);
  private elementRef = inject(ElementRef);

  isOpen = signal(false);
  isRinging = signal(false);

  private bellRingHandler = () => {
    this.isRinging.set(true);
    setTimeout(() => this.isRinging.set(false), 800);
  };

  ngOnInit(): void {
    this.state.loadUnreadCount();
    this.wsService.connect();

    window.addEventListener('notification:bell-ring', this.bellRingHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('notification:bell-ring', this.bellRingHandler);
  }

  toggleDropdown(): void {
    this.isOpen.update(v => !v);

    if (this.isOpen()) {
      this.state.loadNotifications(undefined, true);
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  onMarkAllRead(): void {
    this.state.markAllAsRead();
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress(): void {
    this.closeDropdown();
  }
}
```

### 2. NotificationDropdownComponent

Dropdown lista.

```typescript
// shared/components/notification-dropdown/notification-dropdown.component.ts
import {
  Component,
  inject,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationStateService } from '@core/services/notification-state.service';
import { NotificationItemComponent } from '../notification-item/notification-item.component';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationItemComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="absolute top-full right-0 mt-2 w-[380px] max-h-[480px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-dropdown-open"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 class="font-semibold text-gray-900">értesítések</h3>
        @if (state.unreadCount() > 0) {
          <button
            (click)="markAllRead.emit()"
            class="text-sm text-blue-600 hover:underline"
          >
            mind ✓
          </button>
        }
      </div>

      <!-- Content -->
      <div class="overflow-y-auto max-h-[360px]">
        @if (state.loading() && state.notifications().length === 0) {
          <div class="flex justify-center py-8">
            <div class="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        } @else if (state.notifications().length === 0) {
          <!-- Empty state -->
          <div class="py-12 text-center">
            <span class="text-4xl">🔔</span>
            <p class="mt-2 text-gray-500">még nincs értesítésed</p>
            <p class="text-sm text-gray-400">majd szólunk ha történik valami!</p>
          </div>
        } @else {
          @for (group of state.groupedNotifications(); track group.label) {
            <!-- Date divider -->
            <div class="flex items-center px-4 py-2 text-xs text-gray-400 font-medium">
              <span class="flex-1 h-px bg-gray-200"></span>
              <span class="px-2">{{ group.label }}</span>
              <span class="flex-1 h-px bg-gray-200"></span>
            </div>

            @for (notification of group.notifications; track notification.id) {
              <app-notification-item
                [notification]="notification"
                (clicked)="onItemClick(notification)"
                (reactionSent)="onReactionSent($event)"
              />
            }
          }
        }
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-100">
        <a
          routerLink="/notifications"
          (click)="closed.emit()"
          class="block px-4 py-3 text-center text-sm font-medium text-blue-600 hover:bg-gray-50 transition-colors"
        >
          összes értesítés →
        </a>
      </div>
    </div>
  `,
  styles: [`
    @keyframes dropdown-open {
      0% {
        opacity: 0;
        transform: scale(0.95) translateY(-8px);
      }
      100% {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .animate-dropdown-open {
      animation: dropdown-open 0.2s ease-out forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationDropdownComponent {
  protected state = inject(NotificationStateService);

  closed = output<void>();
  markAllRead = output<void>();

  onItemClick(notification: any): void {
    if (!notification.isRead) {
      this.state.markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      this.closed.emit();
      // Navigation handled by router
    }
  }

  onReactionSent(event: { notificationId: number; emoji: string }): void {
    // Handle reaction (call poke service)
    console.log('Reaction sent', event);
  }
}
```

### 3. NotificationItemComponent

Egyetlen értesítés item.

```typescript
// shared/components/notification-item/notification-item.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Notification } from '@core/models/notification.model';

@Component({
  selector: 'app-notification-item',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      (click)="clicked.emit()"
      class="px-4 py-3 cursor-pointer transition-colors border-l-3"
      [class]="notification().isRead
        ? 'bg-white border-transparent hover:bg-gray-50'
        : 'bg-blue-50 border-blue-500 hover:bg-blue-100'"
    >
      <div class="flex gap-3">
        <!-- Emoji icon -->
        <span class="text-2xl flex-shrink-0">{{ notification().emoji }}</span>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <!-- Title + Time -->
          <div class="flex items-start justify-between gap-2">
            <p
              class="text-sm"
              [class.font-medium]="!notification().isRead"
            >
              {{ notification().title }}
            </p>
            <span class="text-xs text-gray-400 flex-shrink-0">
              {{ formatTime(notification().createdAt) }}
            </span>
          </div>

          <!-- Message -->
          @if (notification().message) {
            <p class="text-sm text-gray-600 mt-0.5 line-clamp-2">
              {{ notification().message }}
            </p>
          }

          <!-- Actions -->
          @if (notification().actions?.length) {
            <div class="flex items-center gap-2 mt-2">
              @for (action of notification().actions; track action.type) {
                @if (action.type === 'reaction' && action.options) {
                  <!-- Reaction buttons -->
                  <div class="flex gap-1">
                    @for (emoji of action.options; track emoji) {
                      <button
                        (click)="onReactionClick($event, emoji)"
                        class="w-9 h-8 text-lg bg-gray-100 hover:bg-gray-200 rounded-lg transition-all active:scale-90"
                      >
                        {{ emoji }}
                      </button>
                    }
                  </div>
                } @else if (action.type === 'navigate' && action.url) {
                  <!-- Navigate button -->
                  <a
                    [routerLink]="action.url"
                    (click)="$event.stopPropagation()"
                    class="px-3 py-1.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    {{ action.label }} →
                  </a>
                }
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationItemComponent {
  notification = input.required<Notification>();

  clicked = output<void>();
  reactionSent = output<{ notificationId: number; emoji: string }>();

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'most';
    if (diffMins < 60) return `${diffMins}p`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}ó`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}n`;

    return date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  onReactionClick(event: Event, emoji: string): void {
    event.stopPropagation();
    this.reactionSent.emit({
      notificationId: this.notification().id,
      emoji
    });
  }
}
```

### 4. ToastContainerComponent

Toast-ok megjelenítése.

```typescript
// shared/components/toast-container/toast-container.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '@core/services/toast.service';
import { ToastComponent } from '../toast/toast.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastComponent],
  template: `
    <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      @for (toast of toastService.visibleToasts(); track toast.id) {
        <app-toast
          [toast]="toast"
          (dismissed)="toastService.dismiss(toast.id)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastContainerComponent {
  protected toastService = inject(ToastService);
}
```

### 5. ToastComponent

Egyetlen toast.

```typescript
// shared/components/toast/toast.component.ts
import {
  Component,
  input,
  output,
  signal,
  OnInit,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '@core/models/toast.model';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="min-w-[300px] max-w-md px-4 py-3 rounded-xl shadow-lg animate-toast-in"
      [class]="getToastClasses()"
      [class.animate-toast-out]="isLeaving()"
    >
      <div class="flex items-center gap-3">
        <!-- Icon -->
        <span class="text-lg">{{ getIcon() }}</span>

        <!-- Message -->
        <span class="flex-1 text-sm font-medium">{{ toast().message }}</span>

        <!-- Action -->
        @if (toast().action) {
          <button
            (click)="onActionClick()"
            class="text-sm font-medium hover:underline"
          >
            {{ toast().action!.label }}
          </button>
        }
      </div>

      <!-- Progress bar -->
      @if (toast().duration > 0) {
        <div class="mt-2 h-0.5 bg-current opacity-20 rounded-full overflow-hidden">
          <div
            class="h-full bg-current opacity-50"
            [style.width.%]="progress()"
            [style.transition]="'width ' + toast().duration + 'ms linear'"
          ></div>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      0% {
        opacity: 0;
        transform: translateY(100%);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes toast-out {
      0% {
        opacity: 1;
        transform: translateY(0);
      }
      100% {
        opacity: 0;
        transform: translateY(100%);
      }
    }

    .animate-toast-in {
      animation: toast-in 0.3s ease-out forwards;
    }

    .animate-toast-out {
      animation: toast-out 0.2s ease-in forwards;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ToastComponent implements OnInit {
  toast = input.required<Toast>();
  dismissed = output<void>();

  progress = signal(100);
  isLeaving = signal(false);

  ngOnInit(): void {
    // Start progress animation
    requestAnimationFrame(() => {
      this.progress.set(0);
    });
  }

  getToastClasses(): string {
    const typeClasses: Record<string, string> = {
      success: 'bg-green-100 text-green-800 border-l-4 border-green-500',
      error: 'bg-red-100 text-red-800 border-l-4 border-red-500',
      warning: 'bg-amber-100 text-amber-800 border-l-4 border-amber-500',
      info: 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
    };
    return typeClasses[this.toast().type] || typeClasses.info;
  }

  getIcon(): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✗',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[this.toast().type] || icons.info;
  }

  onActionClick(): void {
    this.toast().action?.callback();
    this.dismiss();
  }

  dismiss(): void {
    this.isLeaving.set(true);
    setTimeout(() => this.dismissed.emit(), 200);
  }
}
```

### 6. StickyBannerComponent - V2-BEN

> **MEGJEGYZÉS:** Ez a komponens a V2 scope-ba került.

Sticky warning banner (V2).

```typescript
// V2-ben: shared/components/sticky-banner/sticky-banner.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export type BannerLevel = 'warning' | 'info' | 'success';

@Component({
  selector: 'app-sticky-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="sticky top-0 z-40 px-4 py-3 flex items-center justify-center gap-4"
      [class]="getBannerClasses()"
    >
      <!-- Icon -->
      <span class="text-lg">{{ getIcon() }}</span>

      <!-- Message -->
      <span class="text-sm font-medium">{{ message() }}</span>

      <!-- Action -->
      @if (actionUrl()) {
        <a
          [routerLink]="actionUrl()"
          class="px-3 py-1 text-sm font-medium rounded-lg transition-colors"
          [class]="getActionClasses()"
        >
          {{ actionLabel() }}
        </a>
      }

      <!-- Dismiss -->
      @if (dismissable()) {
        <button
          (click)="dismissed.emit()"
          class="ml-auto p-1 hover:opacity-70 transition-opacity"
        >
          ✕
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StickyBannerComponent {
  level = input<BannerLevel>('warning');
  message = input.required<string>();
  actionUrl = input<string | null>(null);
  actionLabel = input('megnézem');
  dismissable = input(true);

  dismissed = output<void>();

  getBannerClasses(): string {
    const classes: Record<BannerLevel, string> = {
      warning: 'bg-amber-100 text-amber-800 border-b border-amber-300',
      info: 'bg-blue-100 text-blue-800 border-b border-blue-300',
      success: 'bg-green-100 text-green-800 border-b border-green-300'
    };
    return classes[this.level()];
  }

  getActionClasses(): string {
    const classes: Record<BannerLevel, string> = {
      warning: 'bg-amber-200 hover:bg-amber-300 text-amber-900',
      info: 'bg-blue-200 hover:bg-blue-300 text-blue-900',
      success: 'bg-green-200 hover:bg-green-300 text-green-900'
    };
    return classes[this.level()];
  }

  getIcon(): string {
    const icons: Record<BannerLevel, string> = {
      warning: '⚠️',
      info: 'ℹ️',
      success: '✓'
    };
    return icons[this.level()];
  }
}
```

### 7. NotificationModeSelectorComponent

Mode választó (settings page).

```typescript
// features/notifications/components/notification-mode-selector.component.ts
import {
  Component,
  inject,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationStateService } from '@core/services/notification-state.service';
import { ToastService } from '@core/services/toast.service';
import { NotificationMode } from '@core/models/notification.model';

@Component({
  selector: 'app-notification-mode-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-2xl shadow-sm p-4">
      <h3 class="font-semibold text-gray-900 mb-4">🔔 értesítési mód</h3>

      <!-- Mode buttons -->
      <div class="flex gap-2 mb-4">
        @for (mode of modes(); track mode.key) {
          <button
            (click)="selectMode(mode.key)"
            class="flex-1 py-4 rounded-xl border-2 transition-all text-center"
            [class]="state.currentMode() === mode.key
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300'"
          >
            <span class="text-2xl block">{{ mode.emoji }}</span>
            <span class="text-sm font-medium mt-1 block">{{ mode.label }}</span>
          </button>
        }
      </div>

      <!-- Current mode description -->
      @if (state.currentModeConfig()) {
        <div class="p-3 bg-gray-50 rounded-xl">
          <p class="font-medium text-gray-900">
            {{ state.currentModeConfig()!.emoji }} {{ state.currentModeConfig()!.label }} mód:
          </p>
          <p class="text-sm text-gray-600 mt-1">
            {{ state.currentModeConfig()!.description }}
          </p>
          @if (state.currentModeConfig()!.maxPushPerDay) {
            <p class="text-xs text-gray-500 mt-1">
              max {{ state.currentModeConfig()!.maxPushPerDay }} push/nap
            </p>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationModeSelectorComponent {
  protected state = inject(NotificationStateService);
  private toastService = inject(ToastService);

  // V1: Egyszerűsített, 2 mód
  modes = signal([
    { key: 'normal' as NotificationMode, emoji: '🔔', label: 'normál' },
    { key: 'quiet' as NotificationMode, emoji: '🔕', label: 'csendes' }
    // V2-ben bővíthető: chill, active, all
  ]);

  async selectMode(mode: NotificationMode): Promise<void> {
    if (mode === this.state.currentMode()) return;

    const success = await this.state.setMode(mode);

    if (success) {
      const modeConfig = this.modes().find(m => m.key === mode);
      this.toastService.success(`${modeConfig?.emoji} ${modeConfig?.label} mód bekapcsolva`);
    } else {
      this.toastService.error('Hiba történt');
    }
  }
}
```

---

## Összefoglaló

| Komponens | Típus | Leírás |
|-----------|-------|--------|
| `NotificationBellComponent` | Shared | Bell icon + badge navbar-ban |
| `NotificationDropdownComponent` | Shared | Dropdown lista |
| `NotificationItemComponent` | Shared | Egyetlen értesítés |
| `ToastContainerComponent` | Shared | Toast-ok container |
| `ToastComponent` | Shared | Egyetlen toast |
| `StickyBannerComponent` | Shared | Sticky warning banner |
| `NotificationsPageComponent` | Page | Összes értesítés oldal |
| `NotificationSettingsPageComponent` | Page | Beállítások oldal |
| `NotificationModeSelectorComponent` | Feature | Mode választó |
| `NotificationFilterTabsComponent` | Feature | Szűrő tab-ok |
| `NotificationCategoryTogglesComponent` | Feature | Kategória toggle-ök |

---

## Checklist

### Services
- [ ] NotificationService (HTTP) - ÚJ
- [ ] NotificationStateService (Signals) - ÚJ
- [ ] ToastService - **BŐVÍTÉS** (már létezik!)
- [ ] NotificationWebSocketService - ÚJ (WebsocketService wrapper)

### Shared Components
- [ ] NotificationBellComponent
- [ ] NotificationDropdownComponent
- [ ] NotificationItemComponent
- [ ] ToastContainerComponent
- [ ] ToastComponent
- [ ] ~~StickyBannerComponent~~ - **V2-ben**

### Feature Components
- [ ] NotificationsPageComponent
- [ ] NotificationSettingsPageComponent
- [ ] NotificationModeSelectorComponent (V1: 2 mód)
- [ ] NotificationFilterTabsComponent
- [ ] ~~NotificationCategoryTogglesComponent~~ - **V2-ben** (custom mode-hoz)

### Routes
- [ ] /notifications
- [ ] /notifications/settings
