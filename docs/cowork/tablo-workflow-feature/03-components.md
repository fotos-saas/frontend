# Tabló Workflow - Angular Components

> Komponensek specifikációja Angular 19 + Signals alapon

---

## 1. Komponens Hierarchia

```
TabloWorkflowModule
├── Pages (lazy loaded)
│   ├── ClaimingPage
│   │   ├── WorkflowStepperComponent
│   │   ├── PhotoSelectGridComponent
│   │   ├── InfoBannerComponent
│   │   └── WorkflowFooterComponent
│   │
│   ├── RegistrationPage (vagy Modal)
│   │   ├── RegistrationModalComponent
│   │   └── FormFieldComponent (shared)
│   │
│   ├── RetouchSelectPage
│   │   ├── WorkflowStepperComponent
│   │   ├── PhotoSelectGridComponent
│   │   ├── SelectionCounterComponent
│   │   └── WorkflowFooterComponent
│   │
│   ├── TabloSelectPage
│   │   ├── WorkflowStepperComponent
│   │   ├── PhotoSingleSelectGridComponent
│   │   ├── PreviewPanelComponent
│   │   └── WorkflowFooterComponent
│   │
│   └── CompletedPage
│       ├── CompletedSummaryComponent
│       └── UpsellBannerComponent
│
├── Shared Components
│   ├── WorkflowStepperComponent
│   ├── PhotoSelectGridComponent
│   ├── PhotoSingleSelectGridComponent
│   ├── PhotoThumbnailComponent
│   ├── WorkflowFooterComponent
│   ├── InfoBannerComponent
│   └── ConfirmModalComponent
│
└── Services
    ├── TabloWorkflowService (state management)
    ├── TabloApiService (HTTP)
    └── TabloProgressGuard (route guard)
```

---

## 2. Services

### 2.1 TabloWorkflowService (State Management)

```typescript
// features/tablo-workflow/services/tablo-workflow.service.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { TabloApiService } from './tablo-api.service';
import { WorkSession, Album, Photo, TabloProgress } from '../models';

export type TabloStep = 'claiming' | 'registration' | 'retouch' | 'tablo' | 'completed';

@Injectable({
  providedIn: 'root'
})
export class TabloWorkflowService {
  private readonly api = inject(TabloApiService);
  private readonly router = inject(Router);

  // ═══════════════════════════════════════════════════════════════
  // STATE - Private writable signals
  // ═══════════════════════════════════════════════════════════════

  private _token = signal<string | null>(null);
  private _currentStep = signal<TabloStep>('claiming');
  private _workSession = signal<WorkSession | null>(null);
  private _album = signal<Album | null>(null);
  private _photos = signal<Photo[]>([]);
  private _isLoading = signal(false);
  private _error = signal<string | null>(null);

  // Selection state
  private _claimedPhotoIds = signal<Set<number>>(new Set());
  private _retouchPhotoIds = signal<Set<number>>(new Set());
  private _tabloPhotoId = signal<number | null>(null);

  // User state
  private _isRegistered = signal(false);
  private _userName = signal<string | null>(null);
  private _userEmail = signal<string | null>(null);

  // ═══════════════════════════════════════════════════════════════
  // PUBLIC READONLY SIGNALS
  // ═══════════════════════════════════════════════════════════════

  readonly token = this._token.asReadonly();
  readonly currentStep = this._currentStep.asReadonly();
  readonly workSession = this._workSession.asReadonly();
  readonly album = this._album.asReadonly();
  readonly photos = this._photos.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly claimedPhotoIds = this._claimedPhotoIds.asReadonly();
  readonly retouchPhotoIds = this._retouchPhotoIds.asReadonly();
  readonly tabloPhotoId = this._tabloPhotoId.asReadonly();

  readonly isRegistered = this._isRegistered.asReadonly();
  readonly userName = this._userName.asReadonly();

  // ═══════════════════════════════════════════════════════════════
  // COMPUTED SIGNALS
  // ═══════════════════════════════════════════════════════════════

  /** Claimed photos array for display */
  readonly claimedPhotos = computed(() => {
    const ids = this._claimedPhotoIds();
    return this._photos().filter(p => ids.has(p.id));
  });

  /** Max allowed retouch photos from session config */
  readonly maxRetouchPhotos = computed(() =>
    this._workSession()?.max_retouch_photos ?? 5
  );

  /** Current retouch selection count */
  readonly retouchCount = computed(() =>
    this._retouchPhotoIds().size
  );

  /** Can select more retouch photos? */
  readonly canSelectMoreRetouch = computed(() =>
    this._retouchPhotoIds().size < this.maxRetouchPhotos()
  );

  /** Selected tablo photo object */
  readonly selectedTabloPhoto = computed(() => {
    const id = this._tabloPhotoId();
    if (!id) return null;
    return this._photos().find(p => p.id === id) ?? null;
  });

  /** Can proceed to next step? */
  readonly canProceed = computed(() => {
    const step = this._currentStep();

    switch (step) {
      case 'claiming':
        return this._claimedPhotoIds().size > 0;
      case 'registration':
        return this._isRegistered();
      case 'retouch':
        // Must select at least 1 (no "nem kérek retust" option!)
        return this._retouchPhotoIds().size >= 1 &&
               this._retouchPhotoIds().size <= this.maxRetouchPhotos();
      case 'tablo':
        return this._tabloPhotoId() !== null;
      case 'completed':
        return false; // No next step
      default:
        return false;
    }
  });

  /** Steps for stepper component */
  readonly steps = computed(() => {
    const current = this._currentStep();
    const stepOrder: TabloStep[] = ['claiming', 'registration', 'retouch', 'tablo', 'completed'];
    const currentIndex = stepOrder.indexOf(current);

    return [
      {
        id: 'claiming',
        label: 'képek',
        emoji: '📸',
        status: this.getStepStatus('claiming', currentIndex, 0)
      },
      {
        id: 'registration',
        label: 'regisztráció',
        emoji: '✍️',
        status: this.getStepStatus('registration', currentIndex, 1)
      },
      {
        id: 'retouch',
        label: 'retusálás',
        emoji: '✨',
        status: this.getStepStatus('retouch', currentIndex, 2)
      },
      {
        id: 'tablo',
        label: 'tabló',
        emoji: '🎓',
        status: this.getStepStatus('tablo', currentIndex, 3)
      },
      {
        id: 'completed',
        label: 'kész',
        emoji: '✅',
        status: this.getStepStatus('completed', currentIndex, 4)
      },
    ];
  });

  private getStepStatus(
    step: TabloStep,
    currentIndex: number,
    stepIndex: number
  ): 'completed' | 'current' | 'pending' {
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  }

  // ═══════════════════════════════════════════════════════════════
  // ACTIONS - Public methods
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize workflow with token
   * Called by guard or page on mount
   */
  init(token: string): Observable<TabloProgress> {
    this._token.set(token);
    this._isLoading.set(true);
    this._error.set(null);

    return this.api.validateAndGetProgress(token).pipe(
      tap({
        next: (response) => {
          this._workSession.set(response.workSession);
          this._album.set(response.album);
          this._photos.set(response.photos);
          this._currentStep.set(response.progress.current_step);
          this._isRegistered.set(response.user?.is_registered ?? false);
          this._userName.set(response.user?.name ?? null);
          this._userEmail.set(response.user?.email ?? null);

          // Restore selections from progress
          if (response.progress.steps_data) {
            const data = response.progress.steps_data;
            if (data.claimed_photo_ids) {
              this._claimedPhotoIds.set(new Set(data.claimed_photo_ids));
            }
            if (data.retouch_photo_ids) {
              this._retouchPhotoIds.set(new Set(data.retouch_photo_ids));
            }
            if (data.tablo_photo_id) {
              this._tabloPhotoId.set(data.tablo_photo_id);
            }
          }

          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.message || 'Hiba történt a betöltés során');
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Toggle photo selection (for claiming and retouch steps)
   */
  togglePhotoSelection(photoId: number, mode: 'claim' | 'retouch'): void {
    if (mode === 'claim') {
      this._claimedPhotoIds.update(ids => {
        const newIds = new Set(ids);
        if (newIds.has(photoId)) {
          newIds.delete(photoId);
        } else {
          newIds.add(photoId);
        }
        return newIds;
      });
    } else if (mode === 'retouch') {
      this._retouchPhotoIds.update(ids => {
        const newIds = new Set(ids);
        if (newIds.has(photoId)) {
          newIds.delete(photoId);
        } else if (newIds.size < this.maxRetouchPhotos()) {
          newIds.add(photoId);
        }
        return newIds;
      });
    }
  }

  /**
   * Select single photo for tablo
   */
  selectTabloPhoto(photoId: number): void {
    this._tabloPhotoId.set(photoId);
  }

  /**
   * Check if photo is selected
   */
  isPhotoSelected(photoId: number, mode: 'claim' | 'retouch' | 'tablo'): boolean {
    switch (mode) {
      case 'claim':
        return this._claimedPhotoIds().has(photoId);
      case 'retouch':
        return this._retouchPhotoIds().has(photoId);
      case 'tablo':
        return this._tabloPhotoId() === photoId;
    }
  }

  /**
   * Navigate to next step
   */
  nextStep(): Observable<void> {
    const token = this._token();
    if (!token || !this.canProceed()) return new Observable(sub => sub.complete());

    const step = this._currentStep();
    this._isLoading.set(true);

    // Save current step data and advance
    return this.saveCurrentStepData(token, step).pipe(
      tap({
        next: () => {
          const nextStep = this.getNextStep(step);
          this._currentStep.set(nextStep);
          this._isLoading.set(false);

          // Navigate to next route
          this.router.navigate(['/tablo', token, this.stepToRoute(nextStep)]);
        },
        error: (err) => {
          this._error.set(err.message);
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    const step = this._currentStep();
    const prevStep = this.getPreviousStep(step);

    if (prevStep) {
      this._currentStep.set(prevStep);
      const token = this._token();
      this.router.navigate(['/tablo', token, this.stepToRoute(prevStep)]);
    }
  }

  /**
   * Complete registration
   */
  completeRegistration(data: {
    name: string;
    email: string;
    phone?: string;
  }): Observable<void> {
    const token = this._token();
    if (!token) return new Observable(sub => sub.complete());

    this._isLoading.set(true);

    return this.api.register(token, data).pipe(
      tap({
        next: () => {
          this._isRegistered.set(true);
          this._userName.set(data.name);
          this._userEmail.set(data.email);
          this._isLoading.set(false);
        },
        error: (err) => {
          this._error.set(err.message);
          this._isLoading.set(false);
        }
      })
    );
  }

  /**
   * Reset workflow state (on destroy or error)
   */
  reset(): void {
    this._token.set(null);
    this._currentStep.set('claiming');
    this._workSession.set(null);
    this._album.set(null);
    this._photos.set([]);
    this._claimedPhotoIds.set(new Set());
    this._retouchPhotoIds.set(new Set());
    this._tabloPhotoId.set(null);
    this._isLoading.set(false);
    this._error.set(null);
    this._isRegistered.set(false);
    this._userName.set(null);
    this._userEmail.set(null);
  }

  // ═══════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════

  private saveCurrentStepData(token: string, step: TabloStep): Observable<void> {
    switch (step) {
      case 'claiming':
        return this.api.saveClaim(token, [...this._claimedPhotoIds()]);
      case 'retouch':
        return this.api.saveRetouch(token, [...this._retouchPhotoIds()]);
      case 'tablo':
        const tabloId = this._tabloPhotoId();
        return tabloId ? this.api.saveTabloSelection(token, tabloId) : new Observable(s => s.complete());
      default:
        return new Observable(sub => sub.complete());
    }
  }

  private getNextStep(current: TabloStep): TabloStep {
    const order: TabloStep[] = ['claiming', 'registration', 'retouch', 'tablo', 'completed'];
    const currentIndex = order.indexOf(current);

    // Skip registration if already registered
    if (current === 'claiming' && this._isRegistered()) {
      return 'retouch';
    }

    return order[currentIndex + 1] ?? 'completed';
  }

  private getPreviousStep(current: TabloStep): TabloStep | null {
    const order: TabloStep[] = ['claiming', 'registration', 'retouch', 'tablo', 'completed'];
    const currentIndex = order.indexOf(current);

    if (currentIndex <= 0) return null;

    // Skip registration if already registered
    if (current === 'retouch' && this._isRegistered()) {
      return 'claiming';
    }

    return order[currentIndex - 1];
  }

  private stepToRoute(step: TabloStep): string {
    const routes: Record<TabloStep, string> = {
      'claiming': 'claiming',
      'registration': 'registration',
      'retouch': 'retouch',
      'tablo': 'select',
      'completed': 'completed'
    };
    return routes[step];
  }
}
```

---

### 2.2 TabloApiService (HTTP)

```typescript
// features/tablo-workflow/services/tablo-api.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { TabloProgress, WorkSession, Album, Photo, User } from '../models';

interface ValidateResponse {
  workSession: WorkSession;
  album: Album;
  photos: Photo[];
  progress: TabloProgress;
  user: User | null;
}

@Injectable({
  providedIn: 'root'
})
export class TabloApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/tablo`;

  /**
   * Validate token and get full progress state
   */
  validateAndGetProgress(token: string): Observable<ValidateResponse> {
    return this.http.get<ValidateResponse>(`${this.baseUrl}/validate/${token}`);
  }

  /**
   * Save claimed photo IDs
   */
  saveClaim(token: string, photoIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/progress/${token}/claim`, {
      photo_ids: photoIds
    });
  }

  /**
   * Register user (guest -> registered)
   */
  register(token: string, data: {
    name: string;
    email: string;
    phone?: string;
  }): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/progress/${token}/register`, data);
  }

  /**
   * Save retouch photo selections
   */
  saveRetouch(token: string, photoIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/progress/${token}/retouch`, {
      photo_ids: photoIds
    });
  }

  /**
   * Save tablo photo selection
   */
  saveTabloSelection(token: string, photoId: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/progress/${token}/tablo`, {
      photo_id: photoId
    });
  }

  /**
   * Complete workflow
   */
  complete(token: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/progress/${token}/complete`, {});
  }
}
```

---

### 2.3 TabloProgressGuard

```typescript
// features/tablo-workflow/guards/tablo-progress.guard.ts
import { inject } from '@angular/core';
import {
  CanActivateFn,
  ActivatedRouteSnapshot,
  Router
} from '@angular/router';
import { TabloWorkflowService, TabloStep } from '../services/tablo-workflow.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const tabloProgressGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const service = inject(TabloWorkflowService);
  const router = inject(Router);

  const token = route.paramMap.get('token');
  if (!token) {
    router.navigate(['/error'], { queryParams: { code: 'invalid_token' } });
    return of(false);
  }

  // If not initialized, initialize first
  if (!service.token()) {
    return service.init(token).pipe(
      map(() => {
        // Check if user should be on this step
        const requestedStep = routeToStep(route.routeConfig?.path ?? '');
        const currentStep = service.currentStep();

        if (!canAccessStep(requestedStep, currentStep)) {
          // Redirect to correct step
          router.navigate(['/tablo', token, stepToRoute(currentStep)]);
          return false;
        }

        return true;
      }),
      catchError((err) => {
        console.error('Tablo init error:', err);
        router.navigate(['/error'], {
          queryParams: {
            code: 'session_error',
            message: err.message
          }
        });
        return of(false);
      })
    );
  }

  // Already initialized, just check step access
  const requestedStep = routeToStep(route.routeConfig?.path ?? '');
  const currentStep = service.currentStep();

  if (!canAccessStep(requestedStep, currentStep)) {
    router.navigate(['/tablo', token, stepToRoute(currentStep)]);
    return false;
  }

  return true;
};

// Helper functions
function routeToStep(route: string): TabloStep {
  const map: Record<string, TabloStep> = {
    'claiming': 'claiming',
    'registration': 'registration',
    'retouch': 'retouch',
    'select': 'tablo',
    'completed': 'completed'
  };
  return map[route] ?? 'claiming';
}

function stepToRoute(step: TabloStep): string {
  const map: Record<TabloStep, string> = {
    'claiming': 'claiming',
    'registration': 'registration',
    'retouch': 'retouch',
    'tablo': 'select',
    'completed': 'completed'
  };
  return map[step];
}

function canAccessStep(requested: TabloStep, current: TabloStep): boolean {
  const order: TabloStep[] = ['claiming', 'registration', 'retouch', 'tablo', 'completed'];
  const requestedIndex = order.indexOf(requested);
  const currentIndex = order.indexOf(current);

  // Can only access current or previous steps
  return requestedIndex <= currentIndex;
}
```

---

## 3. Models

```typescript
// features/tablo-workflow/models/index.ts

export interface WorkSession {
  id: number;
  name: string;
  max_retouch_photos: number;
  is_tablo_mode: boolean;
  album_id: number;
}

export interface Album {
  id: number;
  name: string;
  photo_count: number;
}

export interface Photo {
  id: number;
  album_id: number;
  filename: string;
  thumbnail_url: string;
  preview_url: string;
  full_url: string;
  width: number;
  height: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_registered: boolean;
}

export interface TabloProgress {
  id: number;
  work_session_id: number;
  user_id: number | null;
  current_step: TabloStep;
  steps_data: {
    claimed_photo_ids?: number[];
    retouch_photo_ids?: number[];
    tablo_photo_id?: number;
  } | null;
  completed_at: string | null;
}

export type TabloStep = 'claiming' | 'registration' | 'retouch' | 'tablo' | 'completed';

export interface WorkflowStepInfo {
  id: TabloStep;
  label: string;
  emoji: string;
  status: 'completed' | 'current' | 'pending';
}
```

---

## 4. Shared Components

### 4.1 WorkflowStepperComponent

```typescript
// features/tablo-workflow/components/workflow-stepper/workflow-stepper.component.ts
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkflowStepInfo } from '../../models';

@Component({
  selector: 'app-workflow-stepper',
  standalone: true,
  imports: [CommonModule],
  template: `
    <nav
      class="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
      aria-label="Workflow lépések"
    >
      @for (step of steps(); track step.id; let i = $index; let last = $last) {
        <div class="flex items-center">
          <!-- Step indicator -->
          <div
            class="flex items-center gap-1.5 px-2 py-1 rounded-full transition-all duration-200"
            [class.bg-blue-100]="step.status === 'current'"
            [class.text-blue-700]="step.status === 'current'"
            [class.bg-green-100]="step.status === 'completed'"
            [class.text-green-700]="step.status === 'completed'"
            [class.bg-gray-100]="step.status === 'pending'"
            [class.text-gray-400]="step.status === 'pending'"
            [attr.aria-current]="step.status === 'current' ? 'step' : null"
          >
            <!-- Emoji / Checkmark -->
            <span class="text-base">
              @if (step.status === 'completed') {
                ✓
              } @else {
                {{ step.emoji }}
              }
            </span>

            <!-- Label (hidden on small screens, show on md+) -->
            <span class="hidden sm:inline text-xs font-medium lowercase">
              {{ step.label }}
            </span>
          </div>

          <!-- Connector line -->
          @if (!last) {
            <div
              class="w-6 sm:w-8 lg:w-12 h-0.5 mx-1"
              [class.bg-green-300]="step.status === 'completed'"
              [class.bg-gray-200]="step.status !== 'completed'"
            ></div>
          }
        </div>
      }
    </nav>
  `,
  styles: [`
    :host {
      display: block;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowStepperComponent {
  readonly steps = input.required<WorkflowStepInfo[]>();
}
```

---

### 4.2 PhotoSelectGridComponent (Multi-select)

```typescript
// features/tablo-workflow/components/photo-select-grid/photo-select-grid.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../models';
import { PhotoThumbnailComponent } from '../photo-thumbnail/photo-thumbnail.component';

@Component({
  selector: 'app-photo-select-grid',
  standalone: true,
  imports: [CommonModule, PhotoThumbnailComponent],
  template: `
    <div
      class="grid gap-2 sm:gap-3"
      [class.grid-cols-3]="true"
      [class.sm:grid-cols-4]="true"
      [class.md:grid-cols-5]="true"
      [class.lg:grid-cols-6]="true"
    >
      @for (photo of photos(); track photo.id) {
        <app-photo-thumbnail
          [photo]="photo"
          [selected]="isSelected()(photo.id)"
          [disabled]="isDisabled()(photo.id)"
          [selectionMode]="'multi'"
          (toggle)="onPhotoToggle(photo.id)"
        />
      } @empty {
        <div class="col-span-full text-center py-12 text-gray-500">
          <span class="text-4xl mb-2 block">📷</span>
          <p class="text-sm">nincsenek képek</p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoSelectGridComponent {
  // Inputs
  readonly photos = input.required<Photo[]>();
  readonly selectedIds = input.required<Set<number>>();
  readonly maxSelectable = input<number | null>(null);

  // Outputs
  readonly photoToggle = output<number>();

  // Computed
  readonly isSelected = computed(() => {
    const ids = this.selectedIds();
    return (photoId: number) => ids.has(photoId);
  });

  readonly isDisabled = computed(() => {
    const max = this.maxSelectable();
    const selectedIds = this.selectedIds();

    return (photoId: number) => {
      // Not disabled if no max limit
      if (max === null) return false;
      // Not disabled if already selected
      if (selectedIds.has(photoId)) return false;
      // Disabled if at max capacity
      return selectedIds.size >= max;
    };
  });

  onPhotoToggle(photoId: number): void {
    this.photoToggle.emit(photoId);
  }
}
```

---

### 4.3 PhotoSingleSelectGridComponent (Single select for tablo)

```typescript
// features/tablo-workflow/components/photo-single-select-grid/photo-single-select-grid.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../models';
import { PhotoThumbnailComponent } from '../photo-thumbnail/photo-thumbnail.component';

@Component({
  selector: 'app-photo-single-select-grid',
  standalone: true,
  imports: [CommonModule, PhotoThumbnailComponent],
  template: `
    <div
      class="grid gap-2 sm:gap-3"
      [class.grid-cols-3]="true"
      [class.sm:grid-cols-4]="true"
      [class.md:grid-cols-5]="true"
      [class.lg:grid-cols-6]="true"
    >
      @for (photo of photos(); track photo.id) {
        <app-photo-thumbnail
          [photo]="photo"
          [selected]="selectedId() === photo.id"
          [disabled]="false"
          [selectionMode]="'single'"
          (toggle)="onPhotoSelect(photo.id)"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoSingleSelectGridComponent {
  readonly photos = input.required<Photo[]>();
  readonly selectedId = input.required<number | null>();

  readonly photoSelect = output<number>();

  onPhotoSelect(photoId: number): void {
    this.photoSelect.emit(photoId);
  }
}
```

---

### 4.4 PhotoThumbnailComponent

```typescript
// features/tablo-workflow/components/photo-thumbnail/photo-thumbnail.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../models';

@Component({
  selector: 'app-photo-thumbnail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="relative aspect-[3/4] rounded-lg overflow-hidden
             focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
             transition-all duration-150"
      [class.ring-2]="selected()"
      [class.ring-blue-500]="selected()"
      [class.ring-offset-2]="selected()"
      [class.opacity-50]="disabled()"
      [class.cursor-not-allowed]="disabled()"
      [class.hover:scale-[1.02]]="!disabled()"
      [disabled]="disabled()"
      (click)="onToggle()"
    >
      <!-- Image -->
      <img
        [src]="photo().thumbnail_url"
        [alt]="'Fotó ' + photo().id"
        class="w-full h-full object-cover"
        loading="lazy"
      />

      <!-- Selection indicator -->
      <div
        class="absolute top-2 right-2 w-6 h-6 rounded-full
               flex items-center justify-center
               transition-all duration-150"
        [class.bg-blue-500]="selected()"
        [class.text-white]="selected()"
        [class.bg-white/80]="!selected()"
        [class.text-gray-400]="!selected()"
        [class.border-2]="!selected()"
        [class.border-gray-300]="!selected()"
      >
        @if (selectionMode() === 'multi') {
          @if (selected()) {
            <span class="text-sm font-bold">✓</span>
          }
        } @else {
          <!-- Radio style for single select -->
          @if (selected()) {
            <div class="w-2.5 h-2.5 rounded-full bg-white"></div>
          }
        }
      </div>

      <!-- Disabled overlay -->
      @if (disabled()) {
        <div class="absolute inset-0 bg-gray-200/60 flex items-center justify-center">
          <span class="text-2xl">🔒</span>
        </div>
      }
    </button>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhotoThumbnailComponent {
  readonly photo = input.required<Photo>();
  readonly selected = input<boolean>(false);
  readonly disabled = input<boolean>(false);
  readonly selectionMode = input<'multi' | 'single'>('multi');

  readonly toggle = output<void>();

  onToggle(): void {
    if (!this.disabled()) {
      this.toggle.emit();
    }
  }
}
```

---

### 4.5 WorkflowFooterComponent

```typescript
// features/tablo-workflow/components/workflow-footer/workflow-footer.component.ts
import {
  Component,
  input,
  output,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-workflow-footer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <footer
      class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200
             px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]
             shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
    >
      <div class="max-w-lg mx-auto flex items-center gap-3">
        <!-- Back button -->
        @if (showBack()) {
          <button
            type="button"
            class="flex-shrink-0 px-4 py-2.5 rounded-full
                   text-gray-700 bg-gray-100 hover:bg-gray-200
                   text-sm font-medium transition-colors"
            (click)="back.emit()"
          >
            ← vissza
          </button>
        }

        <!-- Info text (selection counter, etc) -->
        @if (infoText()) {
          <span class="flex-1 text-xs text-gray-500 text-center truncate">
            {{ infoText() }}
          </span>
        } @else {
          <span class="flex-1"></span>
        }

        <!-- Next button -->
        <button
          type="button"
          class="flex-shrink-0 px-6 py-2.5 rounded-full
                 text-white font-medium text-sm
                 transition-all duration-150"
          [class.bg-blue-600]="canProceed()"
          [class.hover:bg-blue-700]="canProceed()"
          [class.bg-gray-300]="!canProceed()"
          [class.cursor-not-allowed]="!canProceed()"
          [disabled]="!canProceed() || isLoading()"
          (click)="next.emit()"
        >
          @if (isLoading()) {
            <span class="inline-flex items-center gap-2">
              <span class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              mentés...
            </span>
          } @else {
            {{ nextLabel() }}
          }
        </button>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowFooterComponent {
  // Inputs
  readonly showBack = input<boolean>(true);
  readonly canProceed = input<boolean>(false);
  readonly isLoading = input<boolean>(false);
  readonly nextLabel = input<string>('tovább →');
  readonly infoText = input<string | null>(null);

  // Outputs
  readonly back = output<void>();
  readonly next = output<void>();
}
```

---

### 4.6 InfoBannerComponent

```typescript
// features/tablo-workflow/components/info-banner/info-banner.component.ts
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

type BannerType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-info-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="rounded-xl px-4 py-3 flex items-start gap-3"
      [class.bg-blue-50]="type() === 'info'"
      [class.text-blue-800]="type() === 'info'"
      [class.bg-green-50]="type() === 'success'"
      [class.text-green-800]="type() === 'success'"
      [class.bg-amber-50]="type() === 'warning'"
      [class.text-amber-800]="type() === 'warning'"
      [class.bg-red-50]="type() === 'error'"
      [class.text-red-800]="type() === 'error'"
      role="alert"
    >
      <span class="text-xl flex-shrink-0">{{ emoji() }}</span>
      <div class="flex-1 min-w-0">
        @if (title()) {
          <p class="font-medium text-sm">{{ title() }}</p>
        }
        <p class="text-sm opacity-90">
          <ng-content></ng-content>
        </p>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBannerComponent {
  readonly type = input<BannerType>('info');
  readonly emoji = input<string>('💡');
  readonly title = input<string | null>(null);
}
```

---

### 4.7 SelectionCounterComponent

```typescript
// features/tablo-workflow/components/selection-counter/selection-counter.component.ts
import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-selection-counter',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg">
      <span class="text-sm text-gray-600">kiválasztva:</span>
      <div class="flex items-center gap-2">
        <!-- Progress dots -->
        <div class="flex gap-1">
          @for (i of maxArray(); track i) {
            <div
              class="w-2 h-2 rounded-full transition-colors"
              [class.bg-blue-500]="i < current()"
              [class.bg-gray-300]="i >= current()"
            ></div>
          }
        </div>

        <!-- Counter text -->
        <span
          class="text-sm font-medium tabular-nums"
          [class.text-blue-600]="current() > 0"
          [class.text-gray-500]="current() === 0"
        >
          {{ current() }} / {{ max() }}
        </span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectionCounterComponent {
  readonly current = input.required<number>();
  readonly max = input.required<number>();

  readonly maxArray = computed(() =>
    Array.from({ length: this.max() }, (_, i) => i)
  );
}
```

---

### 4.8 PreviewPanelComponent

```typescript
// features/tablo-workflow/components/preview-panel/preview-panel.component.ts
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../models';

@Component({
  selector: 'app-preview-panel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4
             border border-blue-100"
    >
      @if (photo()) {
        <div class="space-y-3">
          <!-- Title -->
          <div class="flex items-center gap-2 text-blue-700">
            <span class="text-lg">🎓</span>
            <span class="text-sm font-medium">tablóképed</span>
          </div>

          <!-- Preview image -->
          <div class="aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-white">
            <img
              [src]="photo()!.preview_url"
              [alt]="'Kiválasztott tablókép'"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Confirmation badge -->
          <div class="flex items-center justify-center gap-2 py-2
                      bg-green-100 rounded-lg text-green-700">
            <span>✓</span>
            <span class="text-sm font-medium">ez a kép fog a tablóra kerülni</span>
          </div>
        </div>
      } @else {
        <!-- Empty state -->
        <div class="aspect-[3/4] flex flex-col items-center justify-center
                    bg-white/50 rounded-xl border-2 border-dashed border-blue-200">
          <span class="text-4xl mb-2 opacity-50">🎓</span>
          <p class="text-sm text-blue-600/70 text-center px-4">
            válassz egy képet<br/>a tablódhoz
          </p>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreviewPanelComponent {
  readonly photo = input.required<Photo | null>();
}
```

---

### 4.9 RegistrationModalComponent

```typescript
// features/tablo-workflow/components/registration-modal/registration-modal.component.ts
import {
  Component,
  input,
  output,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';

export interface RegistrationData {
  name: string;
  email: string;
  phone?: string;
}

@Component({
  selector: 'app-registration-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
        (click)="onBackdropClick($event)"
      >
        <!-- Modal -->
        <div
          class="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl
                 max-h-[90vh] overflow-y-auto
                 animate-slide-up sm:animate-scale-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reg-modal-title"
        >
          <!-- Header -->
          <div class="sticky top-0 bg-white px-6 py-4 border-b border-gray-100">
            <h2 id="reg-modal-title" class="text-lg font-semibold text-gray-900">
              ✍️ regisztráció
            </h2>
            <p class="text-sm text-gray-500 mt-1">
              kérlek add meg az adataidat
            </p>
          </div>

          <!-- Form -->
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1">
                neved *
              </label>
              <input
                type="text"
                id="name"
                formControlName="name"
                class="w-full px-4 py-3 rounded-xl border border-gray-200
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       outline-none transition-all"
                placeholder="Kovács Anna"
              />
              @if (form.controls['name'].touched && form.controls['name'].errors) {
                <p class="mt-1 text-xs text-red-500">a név megadása kötelező</p>
              }
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
                e-mail címed *
              </label>
              <input
                type="email"
                id="email"
                formControlName="email"
                class="w-full px-4 py-3 rounded-xl border border-gray-200
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       outline-none transition-all"
                placeholder="anna@example.com"
              />
              @if (form.controls['email'].touched && form.controls['email'].errors) {
                <p class="mt-1 text-xs text-red-500">
                  @if (form.controls['email'].errors['required']) {
                    az e-mail megadása kötelező
                  } @else {
                    érvénytelen e-mail cím
                  }
                </p>
              }
            </div>

            <!-- Phone (optional) -->
            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
                telefonszám
                <span class="text-gray-400 font-normal">(opcionális)</span>
              </label>
              <input
                type="tel"
                id="phone"
                formControlName="phone"
                class="w-full px-4 py-3 rounded-xl border border-gray-200
                       focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
                       outline-none transition-all"
                placeholder="+36 30 123 4567"
              />
            </div>

            <!-- Privacy notice -->
            <p class="text-xs text-gray-500">
              🔒 az adataidat biztonságosan tároljuk és csak a tablófolyamathoz használjuk.
            </p>

            <!-- Actions -->
            <div class="flex gap-3 pt-2">
              <button
                type="button"
                class="flex-1 px-4 py-3 rounded-xl bg-gray-100 text-gray-700
                       hover:bg-gray-200 font-medium transition-colors"
                (click)="close.emit()"
              >
                mégse
              </button>
              <button
                type="submit"
                class="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white
                       hover:bg-blue-700 font-medium transition-colors
                       disabled:bg-gray-300 disabled:cursor-not-allowed"
                [disabled]="!form.valid || isSubmitting()"
              >
                @if (isSubmitting()) {
                  <span class="inline-flex items-center gap-2">
                    <span class="w-4 h-4 border-2 border-white/30 border-t-white
                                 rounded-full animate-spin"></span>
                    mentés...
                  </span>
                } @else {
                  tovább →
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slide-up {
      from {
        transform: translateY(100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    @keyframes scale-in {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .animate-slide-up {
      animation: slide-up 0.2s ease-out;
    }

    .animate-scale-in {
      animation: scale-in 0.15s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly isSubmitting = input<boolean>(false);

  readonly close = output<void>();
  readonly submit = output<RegistrationData>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['']
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close.emit();
    }
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.submit.emit(this.form.value as RegistrationData);
    }
  }
}
```

---

### 4.10 ConfirmModalComponent

```typescript
// features/tablo-workflow/components/confirm-modal/confirm-modal.component.ts
import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Photo } from '../../models';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        (click)="onBackdropClick($event)"
      >
        <!-- Modal -->
        <div
          class="w-full max-w-sm bg-white rounded-2xl overflow-hidden
                 animate-scale-in"
          role="dialog"
          aria-modal="true"
        >
          <!-- Photo preview -->
          @if (photo()) {
            <div class="aspect-[4/5] bg-gray-100">
              <img
                [src]="photo()!.preview_url"
                alt="Kiválasztott kép"
                class="w-full h-full object-cover"
              />
            </div>
          }

          <!-- Content -->
          <div class="p-5 text-center">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {{ title() }}
            </h3>
            <p class="text-sm text-gray-600 mb-4">
              {{ message() }}
            </p>

            <!-- Actions -->
            <div class="flex gap-3">
              <button
                type="button"
                class="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700
                       hover:bg-gray-200 font-medium text-sm transition-colors"
                (click)="cancel.emit()"
              >
                {{ cancelLabel() }}
              </button>
              <button
                type="button"
                class="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white
                       hover:bg-blue-700 font-medium text-sm transition-colors"
                (click)="confirm.emit()"
              >
                {{ confirmLabel() }}
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes scale-in {
      from {
        transform: scale(0.95);
        opacity: 0;
      }
      to {
        transform: scale(1);
        opacity: 1;
      }
    }

    .animate-scale-in {
      animation: scale-in 0.15s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly photo = input<Photo | null>(null);
  readonly title = input<string>('megerősítés');
  readonly message = input<string>('biztos vagy benne?');
  readonly confirmLabel = input<string>('igen');
  readonly cancelLabel = input<string>('mégse');

  readonly confirm = output<void>();
  readonly cancel = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }
}
```

---

## 5. Pages

### 5.1 ClaimingPage

```typescript
// features/tablo-workflow/pages/claiming/claiming.page.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabloWorkflowService } from '../../services/tablo-workflow.service';
import { WorkflowStepperComponent } from '../../components/workflow-stepper/workflow-stepper.component';
import { PhotoSelectGridComponent } from '../../components/photo-select-grid/photo-select-grid.component';
import { InfoBannerComponent } from '../../components/info-banner/info-banner.component';
import { WorkflowFooterComponent } from '../../components/workflow-footer/workflow-footer.component';

@Component({
  selector: 'app-claiming-page',
  standalone: true,
  imports: [
    CommonModule,
    WorkflowStepperComponent,
    PhotoSelectGridComponent,
    InfoBannerComponent,
    WorkflowFooterComponent
  ],
  template: `
    <!-- Stepper -->
    <app-workflow-stepper [steps]="workflow.steps()" />

    <!-- Content -->
    <div class="p-4 pb-24 space-y-4">
      <!-- Info banner -->
      <app-info-banner emoji="👋" title="üdv!">
        jelöld meg a rólad készült képeket. kattints a fotókra!
      </app-info-banner>

      <!-- Photo grid -->
      <app-photo-select-grid
        [photos]="workflow.photos()"
        [selectedIds]="workflow.claimedPhotoIds()"
        [maxSelectable]="null"
        (photoToggle)="onPhotoToggle($event)"
      />
    </div>

    <!-- Footer -->
    <app-workflow-footer
      [showBack]="false"
      [canProceed]="workflow.canProceed()"
      [isLoading]="workflow.isLoading()"
      [infoText]="selectionInfo"
      nextLabel="tovább →"
      (next)="onNext()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClaimingPage {
  protected readonly workflow = inject(TabloWorkflowService);

  get selectionInfo(): string {
    const count = this.workflow.claimedPhotoIds().size;
    return count === 0
      ? 'válassz legalább 1 képet'
      : `${count} kép kiválasztva`;
  }

  onPhotoToggle(photoId: number): void {
    this.workflow.togglePhotoSelection(photoId, 'claim');
  }

  onNext(): void {
    this.workflow.nextStep().subscribe();
  }
}
```

---

### 5.2 RetouchSelectPage

```typescript
// features/tablo-workflow/pages/retouch-select/retouch-select.page.ts
import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabloWorkflowService } from '../../services/tablo-workflow.service';
import { WorkflowStepperComponent } from '../../components/workflow-stepper/workflow-stepper.component';
import { PhotoSelectGridComponent } from '../../components/photo-select-grid/photo-select-grid.component';
import { InfoBannerComponent } from '../../components/info-banner/info-banner.component';
import { SelectionCounterComponent } from '../../components/selection-counter/selection-counter.component';
import { WorkflowFooterComponent } from '../../components/workflow-footer/workflow-footer.component';

@Component({
  selector: 'app-retouch-select-page',
  standalone: true,
  imports: [
    CommonModule,
    WorkflowStepperComponent,
    PhotoSelectGridComponent,
    InfoBannerComponent,
    SelectionCounterComponent,
    WorkflowFooterComponent
  ],
  template: `
    <!-- Stepper -->
    <app-workflow-stepper [steps]="workflow.steps()" />

    <!-- Content -->
    <div class="p-4 pb-24 space-y-4">
      <!-- Info banner -->
      <app-info-banner emoji="✨" title="retusálás">
        válaszd ki mely képeket szeretnéd retusáltatni!
        maximum {{ workflow.maxRetouchPhotos() }} képet választhatsz.
      </app-info-banner>

      <!-- Selection counter -->
      <app-selection-counter
        [current]="workflow.retouchCount()"
        [max]="workflow.maxRetouchPhotos()"
      />

      <!-- Photo grid (only claimed photos) -->
      <app-photo-select-grid
        [photos]="workflow.claimedPhotos()"
        [selectedIds]="workflow.retouchPhotoIds()"
        [maxSelectable]="workflow.maxRetouchPhotos()"
        (photoToggle)="onPhotoToggle($event)"
      />
    </div>

    <!-- Footer -->
    <app-workflow-footer
      [showBack]="true"
      [canProceed]="workflow.canProceed()"
      [isLoading]="workflow.isLoading()"
      [infoText]="selectionInfo()"
      nextLabel="tovább →"
      (back)="onBack()"
      (next)="onNext()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RetouchSelectPage {
  protected readonly workflow = inject(TabloWorkflowService);

  readonly selectionInfo = computed(() => {
    const count = this.workflow.retouchCount();
    const max = this.workflow.maxRetouchPhotos();

    if (count === 0) return 'válassz legalább 1 képet';
    if (count >= max) return 'elérted a maximumot';
    return `${count} / ${max} kiválasztva`;
  });

  onPhotoToggle(photoId: number): void {
    this.workflow.togglePhotoSelection(photoId, 'retouch');
  }

  onBack(): void {
    this.workflow.previousStep();
  }

  onNext(): void {
    this.workflow.nextStep().subscribe();
  }
}
```

---

### 5.3 TabloSelectPage

```typescript
// features/tablo-workflow/pages/tablo-select/tablo-select.page.ts
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabloWorkflowService } from '../../services/tablo-workflow.service';
import { WorkflowStepperComponent } from '../../components/workflow-stepper/workflow-stepper.component';
import { PhotoSingleSelectGridComponent } from '../../components/photo-single-select-grid/photo-single-select-grid.component';
import { PreviewPanelComponent } from '../../components/preview-panel/preview-panel.component';
import { InfoBannerComponent } from '../../components/info-banner/info-banner.component';
import { WorkflowFooterComponent } from '../../components/workflow-footer/workflow-footer.component';
import { ConfirmModalComponent } from '../../components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-tablo-select-page',
  standalone: true,
  imports: [
    CommonModule,
    WorkflowStepperComponent,
    PhotoSingleSelectGridComponent,
    PreviewPanelComponent,
    InfoBannerComponent,
    WorkflowFooterComponent,
    ConfirmModalComponent
  ],
  template: `
    <!-- Stepper -->
    <app-workflow-stepper [steps]="workflow.steps()" />

    <!-- Content -->
    <div class="p-4 pb-24">
      <!-- Desktop layout: grid + preview side by side -->
      <div class="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
        <!-- Left: Grid -->
        <div class="space-y-4">
          <app-info-banner emoji="🎓" title="tablókép">
            válaszd ki melyik kép kerüljön a tablóra. pontosan 1 képet válassz!
          </app-info-banner>

          <app-photo-single-select-grid
            [photos]="workflow.claimedPhotos()"
            [selectedId]="workflow.tabloPhotoId()"
            (photoSelect)="onPhotoSelect($event)"
          />
        </div>

        <!-- Right: Preview (desktop) -->
        <div class="hidden lg:block sticky top-20 h-fit">
          <app-preview-panel [photo]="workflow.selectedTabloPhoto()" />
        </div>
      </div>

      <!-- Mobile preview (bottom sheet style when selected) -->
      @if (workflow.selectedTabloPhoto(); as photo) {
        <div class="lg:hidden fixed bottom-20 left-4 right-4 z-30
                    bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
          <div class="flex items-center gap-3">
            <img
              [src]="photo.thumbnail_url"
              class="w-16 h-20 object-cover rounded-lg"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900">kiválasztott tablókép</p>
              <p class="text-xs text-green-600">✓ ez kerül a tablóra</p>
            </div>
          </div>
        </div>
      }
    </div>

    <!-- Footer -->
    <app-workflow-footer
      [showBack]="true"
      [canProceed]="workflow.canProceed()"
      [isLoading]="workflow.isLoading()"
      [infoText]="workflow.tabloPhotoId() ? '1 kép kiválasztva' : 'válassz 1 képet'"
      nextLabel="véglegesítés →"
      (back)="onBack()"
      (next)="onConfirmOpen()"
    />

    <!-- Confirmation modal -->
    <app-confirm-modal
      [isOpen]="showConfirm()"
      [photo]="workflow.selectedTabloPhoto()"
      title="ez a végleges tablóképed?"
      message="a kiválasztás után már nem módosítható"
      confirmLabel="igen, véglegesítem"
      cancelLabel="visszamegyek"
      (confirm)="onConfirm()"
      (cancel)="onConfirmClose()"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabloSelectPage {
  protected readonly workflow = inject(TabloWorkflowService);

  protected readonly showConfirm = signal(false);

  onPhotoSelect(photoId: number): void {
    this.workflow.selectTabloPhoto(photoId);
  }

  onBack(): void {
    this.workflow.previousStep();
  }

  onConfirmOpen(): void {
    if (this.workflow.canProceed()) {
      this.showConfirm.set(true);
    }
  }

  onConfirmClose(): void {
    this.showConfirm.set(false);
  }

  onConfirm(): void {
    this.showConfirm.set(false);
    this.workflow.nextStep().subscribe();
  }
}
```

---

### 5.4 CompletedPage

```typescript
// features/tablo-workflow/pages/completed/completed.page.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TabloWorkflowService } from '../../services/tablo-workflow.service';
import { WorkflowStepperComponent } from '../../components/workflow-stepper/workflow-stepper.component';

@Component({
  selector: 'app-completed-page',
  standalone: true,
  imports: [CommonModule, RouterLink, WorkflowStepperComponent],
  template: `
    <!-- Stepper -->
    <app-workflow-stepper [steps]="workflow.steps()" />

    <!-- Content -->
    <div class="p-4 min-h-[60vh] flex flex-col items-center justify-center">
      <!-- Success animation -->
      <div class="text-6xl mb-4 animate-bounce">🎉</div>

      <h1 class="text-2xl font-bold text-gray-900 mb-2">köszönjük!</h1>
      <p class="text-gray-600 text-center max-w-sm mb-8">
        sikeresen kiválasztottad a tablóképedet és a retusálandó fotókat.
        értesítünk, amikor minden elkészül!
      </p>

      <!-- Summary card -->
      <div class="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-5 mb-6">
        <h2 class="text-sm font-medium text-gray-500 mb-4">összefoglaló</h2>

        <!-- Tablo photo -->
        @if (workflow.selectedTabloPhoto(); as photo) {
          <div class="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <img
              [src]="photo.thumbnail_url"
              class="w-16 h-20 object-cover rounded-lg"
            />
            <div>
              <p class="text-sm font-medium text-gray-900">tablókép</p>
              <p class="text-xs text-green-600">✓ kiválasztva</p>
            </div>
          </div>
        }

        <!-- Stats -->
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-gray-600">retusálandó képek:</span>
            <span class="font-medium">{{ workflow.retouchPhotoIds().size }} db</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">összes kijelölt kép:</span>
            <span class="font-medium">{{ workflow.claimedPhotoIds().size }} db</span>
          </div>
        </div>
      </div>

      <!-- CTA: Order photos -->
      <div class="w-full max-w-sm bg-gradient-to-r from-purple-500 to-indigo-600
                  rounded-2xl p-5 text-white">
        <div class="flex items-center gap-3 mb-3">
          <span class="text-3xl">🛒</span>
          <div>
            <p class="font-medium">szeretnél képet rendelni?</p>
            <p class="text-sm text-white/80">nyomtatott fotók, ajándékok</p>
          </div>
        </div>
        <a
          [routerLink]="['/gallery']"
          class="block w-full py-3 bg-white text-indigo-600 rounded-xl
                 text-center font-medium hover:bg-gray-50 transition-colors"
        >
          megnézem a webshopot →
        </a>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompletedPage {
  protected readonly workflow = inject(TabloWorkflowService);
}
```

---

## 6. Routing Configuration

```typescript
// features/tablo-workflow/tablo-workflow.routes.ts
import { Routes } from '@angular/router';
import { tabloProgressGuard } from './guards/tablo-progress.guard';

export const TABLO_WORKFLOW_ROUTES: Routes = [
  {
    path: 'tablo/:token',
    canActivate: [tabloProgressGuard],
    children: [
      {
        path: '',
        redirectTo: 'claiming',
        pathMatch: 'full'
      },
      {
        path: 'claiming',
        loadComponent: () =>
          import('./pages/claiming/claiming.page').then(m => m.ClaimingPage)
      },
      {
        path: 'registration',
        loadComponent: () =>
          import('./pages/registration/registration.page').then(m => m.RegistrationPage)
      },
      {
        path: 'retouch',
        loadComponent: () =>
          import('./pages/retouch-select/retouch-select.page').then(m => m.RetouchSelectPage)
      },
      {
        path: 'select',
        loadComponent: () =>
          import('./pages/tablo-select/tablo-select.page').then(m => m.TabloSelectPage)
      },
      {
        path: 'completed',
        loadComponent: () =>
          import('./pages/completed/completed.page').then(m => m.CompletedPage)
      },
    ]
  }
];
```

---

## 7. File Structure Summary

```
src/app/features/tablo-workflow/
├── components/
│   ├── workflow-stepper/
│   │   └── workflow-stepper.component.ts
│   ├── photo-select-grid/
│   │   └── photo-select-grid.component.ts
│   ├── photo-single-select-grid/
│   │   └── photo-single-select-grid.component.ts
│   ├── photo-thumbnail/
│   │   └── photo-thumbnail.component.ts
│   ├── workflow-footer/
│   │   └── workflow-footer.component.ts
│   ├── info-banner/
│   │   └── info-banner.component.ts
│   ├── selection-counter/
│   │   └── selection-counter.component.ts
│   ├── preview-panel/
│   │   └── preview-panel.component.ts
│   ├── registration-modal/
│   │   └── registration-modal.component.ts
│   └── confirm-modal/
│       └── confirm-modal.component.ts
├── guards/
│   └── tablo-progress.guard.ts
├── models/
│   └── index.ts
├── pages/
│   ├── claiming/
│   │   └── claiming.page.ts
│   ├── registration/
│   │   └── registration.page.ts
│   ├── retouch-select/
│   │   └── retouch-select.page.ts
│   ├── tablo-select/
│   │   └── tablo-select.page.ts
│   └── completed/
│       └── completed.page.ts
├── services/
│   ├── tablo-workflow.service.ts
│   └── tablo-api.service.ts
└── tablo-workflow.routes.ts
```

---

## 8. Key Design Decisions

### 8.1 Signals over BehaviorSubject
- Modern Angular 19 pattern
- Better performance with OnPush
- Cleaner computed values

### 8.2 Standalone Components
- No NgModules
- Lazy loading per page
- Smaller bundle sizes

### 8.3 Single Service for State
- `TabloWorkflowService` manages ALL state
- Pages just inject and use
- Easy to test and debug

### 8.4 Set for Selection IDs
- O(1) lookup for `has()`
- Natural for toggle operations
- Easy to serialize with `[...set]`

### 8.5 Guard for Step Navigation
- Prevents direct URL access to wrong step
- Auto-redirects to current step
- Initializes service if needed

---

## 9. Testing Strategy

```typescript
// Example test for TabloWorkflowService
describe('TabloWorkflowService', () => {
  let service: TabloWorkflowService;
  let apiSpy: jasmine.SpyObj<TabloApiService>;

  beforeEach(() => {
    apiSpy = jasmine.createSpyObj('TabloApiService', ['validateAndGetProgress', 'saveClaim']);

    TestBed.configureTestingModule({
      providers: [
        TabloWorkflowService,
        { provide: TabloApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(TabloWorkflowService);
  });

  it('should toggle photo selection for claim', () => {
    service.togglePhotoSelection(1, 'claim');
    expect(service.claimedPhotoIds().has(1)).toBeTrue();

    service.togglePhotoSelection(1, 'claim');
    expect(service.claimedPhotoIds().has(1)).toBeFalse();
  });

  it('should enforce max retouch limit', () => {
    // Mock workSession with max_retouch_photos = 2
    // service.init() would set this

    service.togglePhotoSelection(1, 'retouch');
    service.togglePhotoSelection(2, 'retouch');
    service.togglePhotoSelection(3, 'retouch'); // Should not add

    expect(service.retouchPhotoIds().size).toBe(2);
  });

  it('should compute canProceed correctly', () => {
    // claiming step: needs at least 1 photo
    expect(service.canProceed()).toBeFalse();

    service.togglePhotoSelection(1, 'claim');
    expect(service.canProceed()).toBeTrue();
  });
});
```
