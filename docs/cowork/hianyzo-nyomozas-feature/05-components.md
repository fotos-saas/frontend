# Hiányzók Nyomozása v2 - Angular Komponensek

> Verzió: 1.0
> Dátum: 2025-01-19

---

## Komponens Fa

```
src/app/features/poke/
├── poke.routes.ts
├── services/
│   ├── poke.service.ts
│   ├── poke-state.service.ts
│   └── poke-websocket.service.ts
├── models/
│   ├── poke.model.ts
│   ├── missing-user.model.ts
│   └── poke-preset.model.ts
├── components/
│   ├── missing-list/
│   │   ├── missing-list.component.ts
│   │   └── missing-list.component.html
│   ├── missing-category/
│   │   ├── missing-category.component.ts
│   │   └── missing-category.component.html
│   ├── missing-user-card/
│   │   ├── missing-user-card.component.ts
│   │   └── missing-user-card.component.html
│   ├── poke-composer/
│   │   ├── poke-composer.component.ts
│   │   └── poke-composer.component.html
│   ├── preset-selector/
│   │   ├── preset-selector.component.ts
│   │   └── preset-selector.component.html
│   ├── poke-sent-list/
│   │   ├── poke-sent-list.component.ts
│   │   └── poke-sent-list.component.html
│   ├── poke-sent-card/
│   │   ├── poke-sent-card.component.ts
│   │   └── poke-sent-card.component.html
│   ├── poke-received-toast/
│   │   ├── poke-received-toast.component.ts
│   │   └── poke-received-toast.component.html
│   ├── poke-detail-modal/
│   │   ├── poke-detail-modal.component.ts
│   │   └── poke-detail-modal.component.html
│   ├── reaction-picker/
│   │   ├── reaction-picker.component.ts
│   │   └── reaction-picker.component.html
│   └── daily-limit-badge/
│       ├── daily-limit-badge.component.ts
│       └── daily-limit-badge.component.html
└── pages/
    ├── missing-page/
    │   ├── missing-page.component.ts
    │   └── missing-page.component.html
    └── poke-history-page/
        ├── poke-history-page.component.ts
        └── poke-history-page.component.html
```

---

## Routes

```typescript
// poke.routes.ts
import { Routes } from '@angular/router';

export const POKE_ROUTES: Routes = [
  {
    path: 'missing',
    loadComponent: () => import('./pages/missing-page/missing-page.component')
      .then(m => m.MissingPageComponent),
    title: 'hiányzók 👀'
  },
  {
    path: 'pokes',
    loadComponent: () => import('./pages/poke-history-page/poke-history-page.component')
      .then(m => m.PokeHistoryPageComponent),
    title: 'bökéseim 👉'
  }
];
```

---

## Models

### poke.model.ts

```typescript
export type PokeCategory = 'voting' | 'photoshoot' | 'image_selection' | 'general';
export type PokeStatus = 'sent' | 'pending' | 'resolved' | 'expired';
export type EmojiReaction = '💀' | '😭' | '🫡' | '❤️' | '👀';

export interface PokeMessage {
  emoji: string;
  text: string;
}

export interface UserSummary {
  id: number;
  name: string;
}

export interface RelatedAction {
  type: string;
  id: number;
  title: string;
  url: string;
}

export interface Poke {
  id: number;
  targetUser: UserSummary;
  fromUser?: UserSummary;
  category: PokeCategory;
  message: PokeMessage;
  sentAt: string;
  status: PokeStatus;
  reaction: EmojiReaction | null;
  reactedAt: string | null;
  resolvedAt: string | null;
  isRead?: boolean;
  relatedAction?: RelatedAction;
}

export interface CreatePokeRequest {
  targetUserId: number;
  category: PokeCategory;
  messageType: 'preset' | 'custom';
  presetKey?: string;
  customMessage?: string;
}

export interface SendReactionRequest {
  emoji: EmojiReaction;
}
```

### missing-user.model.ts

```typescript
import { PokeCategory } from './poke.model';

export type PokeReason = 'not_logged_in' | 'is_coordinator' | 'registered_before_you' | 'poked_today' | 'max_pokes_reached';
export type PokeStatusType = 'poked_today' | 'max_pokes_reached' | null;

export interface MissingUser {
  id: number;
  name: string;
  registeredAt: string;
  lastActiveAt: string | null;
  hasLoggedIn: boolean;
  pokeable: boolean;
  pokeStatus: PokeStatusType;
  pokeReason?: PokeReason;
  totalPokesReceived: number;
}

export interface MissingCategory {
  label: string;
  icon: string;
  count: number;
  users: MissingUser[];
}

export interface MissingResponse {
  canPoke: boolean;
  userRegisteredAt: string;
  dailyPokesUsed: number;
  dailyPokeLimit: number;
  categories: Record<PokeCategory, MissingCategory>;
}
```

### poke-preset.model.ts

```typescript
import { PokeCategory } from './poke.model';

export interface PokePreset {
  key: string;
  emoji: string;
  text: string;
}

export type PresetsResponse = Record<PokeCategory | 'general', PokePreset[]>;
```

---

## Services

### poke.service.ts

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import {
  Poke,
  CreatePokeRequest,
  SendReactionRequest,
  PokeCategory
} from '../models/poke.model';
import { MissingResponse } from '../models/missing-user.model';
import { PresetsResponse } from '../models/poke-preset.model';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Injectable({ providedIn: 'root' })
export class PokeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/v1`;

  // Missing users
  getMissingUsers(projectId: number): Observable<ApiResponse<MissingResponse>> {
    return this.http.get<ApiResponse<MissingResponse>>(
      `${this.baseUrl}/projects/${projectId}/missing`
    );
  }

  // Pokes
  sendPoke(request: CreatePokeRequest): Observable<ApiResponse<Poke>> {
    return this.http.post<ApiResponse<Poke>>(
      `${this.baseUrl}/pokes`,
      request
    );
  }

  getSentPokes(limit = 20): Observable<ApiResponse<{ pokes: Poke[]; total: number }>> {
    return this.http.get<ApiResponse<{ pokes: Poke[]; total: number }>>(
      `${this.baseUrl}/pokes/sent`,
      { params: { limit: limit.toString() } }
    );
  }

  getReceivedPokes(unreadOnly = true): Observable<ApiResponse<{ pokes: Poke[]; unreadCount: number }>> {
    return this.http.get<ApiResponse<{ pokes: Poke[]; unreadCount: number }>>(
      `${this.baseUrl}/pokes/received`,
      { params: { unreadOnly: unreadOnly.toString() } }
    );
  }

  sendReaction(pokeId: number, request: SendReactionRequest): Observable<ApiResponse<{ pokeId: number; reaction: string; reactedAt: string }>> {
    return this.http.post<ApiResponse<{ pokeId: number; reaction: string; reactedAt: string }>>(
      `${this.baseUrl}/pokes/${pokeId}/reaction`,
      request
    );
  }

  markAsRead(pokeId: number): Observable<ApiResponse<{ pokeId: number; isRead: boolean }>> {
    return this.http.post<ApiResponse<{ pokeId: number; isRead: boolean }>>(
      `${this.baseUrl}/pokes/${pokeId}/read`,
      {}
    );
  }

  // Presets
  getPresets(): Observable<ApiResponse<PresetsResponse>> {
    return this.http.get<ApiResponse<PresetsResponse>>(
      `${this.baseUrl}/pokes/presets`
    );
  }
}
```

### poke-state.service.ts

```typescript
import { Injectable, signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { PokeService } from './poke.service';
import { MissingResponse, MissingUser } from '../models/missing-user.model';
import { Poke, PokeCategory, EmojiReaction } from '../models/poke.model';
import { PresetsResponse, PokePreset } from '../models/poke-preset.model';

@Injectable({ providedIn: 'root' })
export class PokeStateService {
  private pokeService = inject(PokeService);

  // State signals
  private _missingData = signal<MissingResponse | null>(null);
  private _sentPokes = signal<Poke[]>([]);
  private _receivedPokes = signal<Poke[]>([]);
  private _presets = signal<PresetsResponse | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public readonly signals
  readonly missingData = this._missingData.asReadonly();
  readonly sentPokes = this._sentPokes.asReadonly();
  readonly receivedPokes = this._receivedPokes.asReadonly();
  readonly presets = this._presets.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly canPoke = computed(() => this._missingData()?.canPoke ?? false);
  readonly dailyPokesUsed = computed(() => this._missingData()?.dailyPokesUsed ?? 0);
  readonly dailyPokeLimit = computed(() => this._missingData()?.dailyPokeLimit ?? 5);
  readonly dailyPokesRemaining = computed(() => this.dailyPokeLimit() - this.dailyPokesUsed());

  readonly unreadCount = computed(() =>
    this._receivedPokes().filter(p => !p.isRead).length
  );

  readonly categories = computed(() => {
    const data = this._missingData();
    if (!data) return [];

    return Object.entries(data.categories).map(([key, category]) => ({
      key: key as PokeCategory,
      ...category
    }));
  });

  // Actions
  async loadMissingUsers(projectId: number): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const response = await this.pokeService.getMissingUsers(projectId).toPromise();
      if (response?.success) {
        this._missingData.set(response.data);
      }
    } catch (err: any) {
      this._error.set(err.message || 'Hiba történt');
    } finally {
      this._loading.set(false);
    }
  }

  async loadPresets(): Promise<void> {
    try {
      const response = await this.pokeService.getPresets().toPromise();
      if (response?.success) {
        this._presets.set(response.data);
      }
    } catch (err) {
      console.error('Failed to load presets', err);
    }
  }

  async sendPoke(
    targetUserId: number,
    category: PokeCategory,
    preset?: PokePreset,
    customMessage?: string
  ): Promise<Poke | null> {
    try {
      const request = preset
        ? {
            targetUserId,
            category,
            messageType: 'preset' as const,
            presetKey: preset.key
          }
        : {
            targetUserId,
            category,
            messageType: 'custom' as const,
            customMessage
          };

      const response = await this.pokeService.sendPoke(request).toPromise();

      if (response?.success) {
        // Optimistic update
        this._sentPokes.update(pokes => [response.data, ...pokes]);

        // Update daily count
        this._missingData.update(data => {
          if (!data) return data;
          return {
            ...data,
            dailyPokesUsed: data.dailyPokesUsed + 1
          };
        });

        // Mark user as poked
        this.markUserAsPoked(targetUserId, category);

        return response.data;
      }
      return null;
    } catch (err: any) {
      this._error.set(err.error?.message || 'Bökés sikertelen');
      return null;
    }
  }

  async sendReaction(pokeId: number, emoji: EmojiReaction): Promise<void> {
    try {
      const response = await this.pokeService.sendReaction(pokeId, { emoji }).toPromise();

      if (response?.success) {
        // Update local state
        this._receivedPokes.update(pokes =>
          pokes.map(p =>
            p.id === pokeId
              ? { ...p, reaction: emoji, reactedAt: response.data.reactedAt }
              : p
          )
        );
      }
    } catch (err) {
      console.error('Failed to send reaction', err);
    }
  }

  async markAsRead(pokeId: number): Promise<void> {
    try {
      await this.pokeService.markAsRead(pokeId).toPromise();

      this._receivedPokes.update(pokes =>
        pokes.map(p => p.id === pokeId ? { ...p, isRead: true } : p)
      );
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  }

  async loadSentPokes(): Promise<void> {
    try {
      const response = await this.pokeService.getSentPokes().toPromise();
      if (response?.success) {
        this._sentPokes.set(response.data.pokes);
      }
    } catch (err) {
      console.error('Failed to load sent pokes', err);
    }
  }

  async loadReceivedPokes(): Promise<void> {
    try {
      const response = await this.pokeService.getReceivedPokes().toPromise();
      if (response?.success) {
        this._receivedPokes.set(response.data.pokes);
      }
    } catch (err) {
      console.error('Failed to load received pokes', err);
    }
  }

  // WebSocket handlers
  handlePokeReceived(poke: Poke): void {
    this._receivedPokes.update(pokes => [poke, ...pokes]);
  }

  handlePokeReaction(pokeId: number, reaction: EmojiReaction, reactedAt: string): void {
    this._sentPokes.update(pokes =>
      pokes.map(p =>
        p.id === pokeId
          ? { ...p, reaction, reactedAt, status: 'pending' }
          : p
      )
    );
  }

  handlePokeResolved(pokeId: number, resolvedAt: string): void {
    this._sentPokes.update(pokes =>
      pokes.map(p =>
        p.id === pokeId
          ? { ...p, status: 'resolved', resolvedAt }
          : p
      )
    );
  }

  private markUserAsPoked(userId: number, category: PokeCategory): void {
    this._missingData.update(data => {
      if (!data) return data;

      const categoryData = data.categories[category];
      if (!categoryData) return data;

      return {
        ...data,
        categories: {
          ...data.categories,
          [category]: {
            ...categoryData,
            users: categoryData.users.map(u =>
              u.id === userId
                ? { ...u, pokeable: false, pokeStatus: 'poked_today' as const }
                : u
            )
          }
        }
      };
    });
  }
}
```

### poke-websocket.service.ts

```typescript
import { Injectable, inject, OnDestroy } from '@angular/core';
import { EchoService } from '@core/services/echo.service';
import { AuthService } from '@core/services/auth.service';
import { PokeStateService } from './poke-state.service';
import { Poke, EmojiReaction } from '../models/poke.model';

@Injectable({ providedIn: 'root' })
export class PokeWebSocketService implements OnDestroy {
  private echoService = inject(EchoService);
  private authService = inject(AuthService);
  private pokeState = inject(PokeStateService);

  private channel: any;

  connect(): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId) return;

    this.channel = this.echoService.private(`user.${userId}.pokes`);

    // Új bökés érkezett
    this.channel.listen('poke.received', (event: { data: Poke }) => {
      this.pokeState.handlePokeReceived(event.data);
    });

    // Reakció érkezett a bökésemre
    this.channel.listen('poke.reaction', (event: {
      data: { pokeId: number; reaction: EmojiReaction; reactedAt: string }
    }) => {
      this.pokeState.handlePokeReaction(
        event.data.pokeId,
        event.data.reaction,
        event.data.reactedAt
      );
    });

    // Bököttje megcsinálta a feladatot
    this.channel.listen('poke.resolved', (event: {
      data: { pokeId: number; resolvedAt: string }
    }) => {
      this.pokeState.handlePokeResolved(
        event.data.pokeId,
        event.data.resolvedAt
      );
    });
  }

  disconnect(): void {
    if (this.channel) {
      this.echoService.leave(this.channel);
      this.channel = null;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
```

---

## Komponensek

### 1. MissingPageComponent

Fő oldal a hiányzók listájával.

```typescript
// missing-page.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeStateService } from '../../services/poke-state.service';
import { PokeWebSocketService } from '../../services/poke-websocket.service';
import { ProjectService } from '@core/services/project.service';
import { MissingCategoryComponent } from '../../components/missing-category/missing-category.component';
import { DailyLimitBadgeComponent } from '../../components/daily-limit-badge/daily-limit-badge.component';

@Component({
  selector: 'app-missing-page',
  standalone: true,
  imports: [CommonModule, MissingCategoryComponent, DailyLimitBadgeComponent],
  template: `
    <div class="min-h-screen bg-gray-50 pb-20">
      <!-- Header -->
      <div class="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold">hiányzók 👀</h1>
          <app-daily-limit-badge />
        </div>
      </div>

      <!-- Loading -->
      @if (pokeState.loading()) {
        <div class="flex justify-center py-12">
          <div class="animate-spin h-8 w-8 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      }

      <!-- Error -->
      @if (pokeState.error()) {
        <div class="mx-4 mt-4 p-4 bg-red-50 text-red-700 rounded-xl">
          {{ pokeState.error() }}
        </div>
      }

      <!-- Categories -->
      @if (!pokeState.loading()) {
        <div class="p-4 space-y-6">
          @for (category of pokeState.categories(); track category.key) {
            <app-missing-category
              [category]="category"
              [canPoke]="pokeState.canPoke()"
            />
          } @empty {
            <div class="text-center py-12 text-gray-500">
              <span class="text-4xl">🎉</span>
              <p class="mt-2">mindenki megcsinálta!</p>
            </div>
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingPageComponent implements OnInit {
  protected pokeState = inject(PokeStateService);
  private pokeWs = inject(PokeWebSocketService);
  private projectService = inject(ProjectService);

  ngOnInit(): void {
    const projectId = this.projectService.currentProjectId();
    if (projectId) {
      this.pokeState.loadMissingUsers(projectId);
      this.pokeState.loadPresets();
    }

    this.pokeWs.connect();
  }
}
```

### 2. MissingCategoryComponent

Egy kategória (pl. szavazás) accordionnal.

```typescript
// missing-category.component.ts
import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MissingUserCardComponent } from '../missing-user-card/missing-user-card.component';
import { PokeCategory } from '../../models/poke.model';
import { MissingUser } from '../../models/missing-user.model';

@Component({
  selector: 'app-missing-category',
  standalone: true,
  imports: [CommonModule, MissingUserCardComponent],
  template: `
    <div class="bg-white rounded-2xl shadow-sm overflow-hidden">
      <!-- Header (clickable) -->
      <button
        (click)="toggleExpanded()"
        class="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <span class="text-2xl">{{ category().icon }}</span>
          <div class="text-left">
            <h3 class="font-medium">{{ category().label }}</h3>
            <p class="text-sm text-gray-500">{{ category().count }} hiányzik</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-sm font-medium">
            {{ category().count }}
          </span>
          <svg
            class="w-5 h-5 text-gray-400 transition-transform"
            [class.rotate-180]="expanded()"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <!-- Users list (expandable) -->
      @if (expanded()) {
        <div class="border-t divide-y">
          @for (user of category().users; track user.id) {
            <app-missing-user-card
              [user]="user"
              [categoryKey]="category().key"
              [canPoke]="canPoke()"
            />
          }
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingCategoryComponent {
  category = input.required<{
    key: PokeCategory;
    icon: string;
    label: string;
    count: number;
    users: MissingUser[];
  }>();
  canPoke = input(false);

  expanded = signal(true);

  toggleExpanded(): void {
    this.expanded.update(v => !v);
  }
}
```

### 3. MissingUserCardComponent

Egy hiányzó user kártyája bökés gombbal.

```typescript
// missing-user-card.component.ts
import { Component, input, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeComposerComponent } from '../poke-composer/poke-composer.component';
import { MissingUser } from '../../models/missing-user.model';
import { PokeCategory } from '../../models/poke.model';

@Component({
  selector: 'app-missing-user-card',
  standalone: true,
  imports: [CommonModule, PokeComposerComponent],
  template: `
    <div class="px-4 py-3">
      <div class="flex items-center justify-between">
        <!-- User info -->
        <div class="flex items-center gap-3">
          <!-- Avatar placeholder -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-medium">
            {{ user().name.charAt(0) }}
          </div>

          <div>
            <p class="font-medium">{{ user().name }}</p>

            <!-- Status badges -->
            @if (!user().hasLoggedIn) {
              <span class="text-xs text-gray-400">még nem lépett be</span>
            } @else if (user().lastActiveAt) {
              <span class="text-xs text-gray-400">
                utoljára: {{ formatLastActive(user().lastActiveAt) }}
              </span>
            }
          </div>
        </div>

        <!-- Poke button -->
        <div>
          @if (user().pokeable && canPoke()) {
            <button
              (click)="showComposer.set(true)"
              class="px-4 py-2 bg-blue-500 text-white rounded-full text-sm font-medium hover:bg-blue-600 active:scale-95 transition-all"
            >
              👉 bökj
            </button>
          } @else if (user().pokeStatus === 'poked_today') {
            <span class="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm">
              ✓ bökve ma
            </span>
          } @else if (user().pokeStatus === 'max_pokes_reached') {
            <span class="px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-sm">
              3x bökve
            </span>
          } @else if (!user().hasLoggedIn) {
            <span class="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-full text-sm">
              nincs push
            </span>
          }
        </div>
      </div>

      <!-- Composer (when open) -->
      @if (showComposer()) {
        <app-poke-composer
          [targetUser]="user()"
          [category]="categoryKey()"
          (closed)="showComposer.set(false)"
          (sent)="onPokeSent()"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MissingUserCardComponent {
  user = input.required<MissingUser>();
  categoryKey = input.required<PokeCategory>();
  canPoke = input(false);

  showComposer = signal(false);

  formatLastActive(date: string | null): string {
    if (!date) return '';

    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'most';
    if (diffHours < 24) return `${diffHours} órája`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} napja`;

    return d.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' });
  }

  onPokeSent(): void {
    this.showComposer.set(false);
  }
}
```

### 4. PokeComposerComponent

Bökés üzenet összeállítása.

```typescript
// poke-composer.component.ts
import {
  Component,
  input,
  output,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PokeStateService } from '../../services/poke-state.service';
import { PresetSelectorComponent } from '../preset-selector/preset-selector.component';
import { MissingUser } from '../../models/missing-user.model';
import { PokeCategory } from '../../models/poke.model';
import { PokePreset } from '../../models/poke-preset.model';

@Component({
  selector: 'app-poke-composer',
  standalone: true,
  imports: [CommonModule, FormsModule, PresetSelectorComponent],
  template: `
    <div class="mt-3 p-4 bg-gray-50 rounded-xl animate-fade-in">
      <!-- Mode tabs -->
      <div class="flex gap-2 mb-3">
        <button
          (click)="mode.set('preset')"
          class="flex-1 py-2 text-sm rounded-lg transition-colors"
          [class]="mode() === 'preset' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'"
        >
          gyors üzik
        </button>
        <button
          (click)="mode.set('custom')"
          class="flex-1 py-2 text-sm rounded-lg transition-colors"
          [class]="mode() === 'custom' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600'"
        >
          saját üzi
        </button>
      </div>

      <!-- Preset mode -->
      @if (mode() === 'preset') {
        <app-preset-selector
          [category]="category()"
          [selectedPreset]="selectedPreset()"
          (selected)="selectedPreset.set($event)"
        />
      }

      <!-- Custom mode -->
      @if (mode() === 'custom') {
        <div class="space-y-2">
          <textarea
            [(ngModel)]="customMessage"
            placeholder="max 60 karakter..."
            maxlength="60"
            rows="2"
            class="w-full px-3 py-2 border rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          ></textarea>
          <div class="text-right text-xs text-gray-400">
            {{ customMessage().length }}/60
          </div>
        </div>
      }

      <!-- Preview -->
      @if (previewMessage()) {
        <div class="mt-3 p-3 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <p class="text-sm text-gray-500 mb-1">előnézet:</p>
          <p class="text-lg">
            {{ previewMessage()?.emoji }} "{{ previewMessage()?.text }}"
          </p>
        </div>
      }

      <!-- Actions -->
      <div class="flex gap-2 mt-4">
        <button
          (click)="closed.emit()"
          class="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-medium"
        >
          mégse
        </button>
        <button
          (click)="send()"
          [disabled]="!canSend() || sending()"
          class="flex-1 py-2.5 bg-blue-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          @if (sending()) {
            <span class="inline-block animate-spin">⏳</span>
          } @else {
            👉 küldés
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes fade-in {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fade-in 0.2s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokeComposerComponent {
  targetUser = input.required<MissingUser>();
  category = input.required<PokeCategory>();

  closed = output<void>();
  sent = output<void>();

  private pokeState = inject(PokeStateService);

  mode = signal<'preset' | 'custom'>('preset');
  selectedPreset = signal<PokePreset | null>(null);
  customMessage = signal('');
  sending = signal(false);

  previewMessage = computed(() => {
    if (this.mode() === 'preset' && this.selectedPreset()) {
      return this.selectedPreset();
    }
    if (this.mode() === 'custom' && this.customMessage().trim()) {
      return { emoji: '💬', text: this.customMessage().trim() };
    }
    return null;
  });

  canSend = computed(() => {
    if (this.mode() === 'preset') {
      return this.selectedPreset() !== null;
    }
    return this.customMessage().trim().length > 0;
  });

  async send(): Promise<void> {
    if (!this.canSend() || this.sending()) return;

    this.sending.set(true);

    const result = await this.pokeState.sendPoke(
      this.targetUser().id,
      this.category(),
      this.mode() === 'preset' ? this.selectedPreset()! : undefined,
      this.mode() === 'custom' ? this.customMessage() : undefined
    );

    this.sending.set(false);

    if (result) {
      this.sent.emit();
    }
  }
}
```

### 5. PresetSelectorComponent

Előre megírt üzenet választó.

```typescript
// preset-selector.component.ts
import { Component, input, output, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeStateService } from '../../services/poke-state.service';
import { PokeCategory } from '../../models/poke.model';
import { PokePreset } from '../../models/poke-preset.model';

@Component({
  selector: 'app-preset-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="grid grid-cols-2 gap-2">
      @for (preset of categoryPresets(); track preset.key) {
        <button
          (click)="selected.emit(preset)"
          class="p-3 rounded-xl text-left transition-all"
          [class]="selectedPreset()?.key === preset.key
            ? 'bg-blue-100 border-2 border-blue-500'
            : 'bg-white border-2 border-transparent hover:border-gray-200'"
        >
          <span class="text-xl">{{ preset.emoji }}</span>
          <p class="text-sm mt-1 line-clamp-2">{{ preset.text }}</p>
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PresetSelectorComponent {
  category = input.required<PokeCategory>();
  selectedPreset = input<PokePreset | null>(null);

  selected = output<PokePreset>();

  private pokeState = inject(PokeStateService);

  categoryPresets = computed(() => {
    const presets = this.pokeState.presets();
    if (!presets) return [];

    return presets[this.category()] || presets['general'] || [];
  });
}
```

### 6. ReactionPickerComponent

Emoji reakció választó (kapott bökéshez).

```typescript
// reaction-picker.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EmojiReaction } from '../../models/poke.model';

@Component({
  selector: 'app-reaction-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex gap-2 justify-center">
      @for (emoji of reactions; track emoji) {
        <button
          (click)="selected.emit(emoji)"
          class="w-12 h-12 text-2xl rounded-full transition-all hover:scale-110 active:scale-95"
          [class]="currentReaction() === emoji
            ? 'bg-blue-100 ring-2 ring-blue-500'
            : 'bg-gray-100 hover:bg-gray-200'"
          [disabled]="currentReaction() !== null"
        >
          {{ emoji }}
        </button>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReactionPickerComponent {
  currentReaction = input<EmojiReaction | null>(null);
  selected = output<EmojiReaction>();

  reactions: EmojiReaction[] = ['💀', '😭', '🫡', '❤️', '👀'];
}
```

### 7. DailyLimitBadgeComponent

Napi limit megjelenítése.

```typescript
// daily-limit-badge.component.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeStateService } from '../../services/poke-state.service';

@Component({
  selector: 'app-daily-limit-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
      <span class="text-sm">👉</span>
      <span class="text-sm font-medium">
        {{ pokeState.dailyPokesRemaining() }}/{{ pokeState.dailyPokeLimit() }}
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DailyLimitBadgeComponent {
  protected pokeState = inject(PokeStateService);
}
```

### 8. PokeReceivedToastComponent

Kapott bökés toast (a tetején jelenik meg).

```typescript
// poke-received-toast.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Poke } from '../../models/poke.model';
import { ReactionPickerComponent } from '../reaction-picker/reaction-picker.component';

@Component({
  selector: 'app-poke-received-toast',
  standalone: true,
  imports: [CommonModule, ReactionPickerComponent],
  template: `
    <div
      class="fixed top-0 left-0 right-0 z-50 p-4 animate-slide-down"
      (click)="clicked.emit()"
    >
      <div class="bg-white rounded-2xl shadow-lg p-4 max-w-md mx-auto">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <span class="text-2xl">👉</span>
          <div class="flex-1">
            <p class="font-medium">{{ poke().fromUser?.name }}</p>
            <p class="text-lg">
              {{ poke().message.emoji }} "{{ poke().message.text }}"
            </p>
          </div>
        </div>

        <!-- Quick reactions -->
        <div class="mt-3">
          <app-reaction-picker
            [currentReaction]="poke().reaction"
            (selected)="reactionSelected.emit($event)"
          />
        </div>

        <!-- Go to action button -->
        @if (poke().relatedAction) {
          <button
            (click)="actionClicked.emit(poke().relatedAction!.url)"
            class="w-full mt-3 py-2.5 bg-blue-500 text-white rounded-xl font-medium"
          >
            {{ getActionLabel(poke().relatedAction!.type) }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-down {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-slide-down {
      animation: slide-down 0.3s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PokeReceivedToastComponent {
  poke = input.required<Poke>();

  clicked = output<void>();
  reactionSelected = output<string>();
  actionClicked = output<string>();

  getActionLabel(type: string): string {
    const labels: Record<string, string> = {
      voting: 'megnézem a szavazást',
      photoshoot: 'megnézem a fotózást',
      image_selection: 'megnézem a képválasztást'
    };
    return labels[type] || 'megnézem';
  }
}
```

---

## Összegzés

| Komponens | Leírás |
|-----------|--------|
| `MissingPageComponent` | Fő oldal, kategóriák listája |
| `MissingCategoryComponent` | Accordion egy kategóriához |
| `MissingUserCardComponent` | User kártya bökés gombbal |
| `PokeComposerComponent` | Üzenet összeállító modal |
| `PresetSelectorComponent` | Gyors üzenet választó |
| `ReactionPickerComponent` | Emoji reakció választó |
| `DailyLimitBadgeComponent` | Napi limit badge |
| `PokeReceivedToastComponent` | Kapott bökés toast |
| `PokeSentCardComponent` | Küldött bökés kártya |
| `PokeDetailModalComponent` | Bökés részletek |

---

## Checklist

### Services
- [ ] PokeService (HTTP)
- [ ] PokeStateService (state management)
- [ ] PokeWebSocketService (real-time)

### Components
- [ ] MissingPageComponent
- [ ] MissingCategoryComponent
- [ ] MissingUserCardComponent
- [ ] PokeComposerComponent
- [ ] PresetSelectorComponent
- [ ] ReactionPickerComponent
- [ ] DailyLimitBadgeComponent
- [ ] PokeReceivedToastComponent
- [ ] PokeSentCardComponent
- [ ] PokeDetailModalComponent

### Routes
- [ ] /missing
- [ ] /pokes

### Models
- [ ] Poke model
- [ ] MissingUser model
- [ ] PokePreset model
