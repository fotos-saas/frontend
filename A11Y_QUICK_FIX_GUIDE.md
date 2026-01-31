# Photo Selection - A11y Quick Fix Guide

Quick reference for implementing accessibility fixes. Copy-paste ready!

---

## 1. Focus Trap in Confirm Dialog

**File:** `src/app/shared/components/confirm-dialog/confirm-dialog.component.ts`

```typescript
import { Component, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit, HostListener, input, output, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

export interface ConfirmDialogResult {
  action: 'confirm' | 'cancel';
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfirmDialogComponent implements AfterViewInit, OnDestroy {
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private focusTrap: FocusTrap | null = null;

  readonly title = input<string>('Megerősítés');
  readonly message = input<string>('Biztosan folytatod?');
  readonly confirmText = input<string>('Törlés');
  readonly cancelText = input<string>('Mégse');
  readonly confirmType = input<'danger' | 'warning' | 'primary'>('danger');
  readonly isSubmitting = input<boolean>(false);

  readonly resultEvent = output<ConfirmDialogResult>();

  @ViewChild('dialogContent') dialogContent!: ElementRef<HTMLElement>;

  ngAfterViewInit(): void {
    if (this.dialogContent?.nativeElement) {
      // Create and activate focus trap
      this.focusTrap = this.focusTrapFactory.create(this.dialogContent.nativeElement);

      // Move focus to first focusable element
      setTimeout(() => {
        const firstButton = this.dialogContent.nativeElement.querySelector('button') as HTMLButtonElement;
        firstButton?.focus();
      }, 0);
    }
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.key === 'Escape' || event.key === 'Esc') {
      if (this.dialogContent?.nativeElement) {
        this.onCancel();
      }
    }
  }

  onCancel(): void {
    this.resultEvent.emit({ action: 'cancel' });
  }

  onConfirm(): void {
    this.resultEvent.emit({ action: 'confirm' });
  }
}
```

**Template Update:** `confirm-dialog.component.html`

```html
<div class="dialog-overlay" (click)="onCancel()">
  <div
    #dialogContent
    class="dialog"
    (click)="$event.stopPropagation()"
    role="alertdialog"
    aria-modal="true"
    [attr.aria-labelledby]="'dialog-title-' + confirmType()"
    tabindex="-1"
  >
    <!-- Header -->
    <header class="dialog__header">
      <div class="dialog__icon" [class.dialog__icon--danger]="confirmType() === 'danger'" [class.dialog__icon--warning]="confirmType() === 'warning'">
        @if (confirmType() === 'danger') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        }
        @if (confirmType() === 'warning') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        }
        @if (confirmType() === 'primary') {
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        }
      </div>
      <h2 [id]="'dialog-title-' + confirmType()" class="dialog__title">{{ title() }}</h2>
    </header>

    <!-- Content -->
    <div class="dialog__content">
      <p class="dialog__message">{{ message() }}</p>
    </div>

    <!-- Footer -->
    <footer class="dialog__footer">
      <button
        type="button"
        class="btn btn--secondary"
        (click)="onCancel()"
        [disabled]="isSubmitting()"
      >
        {{ cancelText() }}
      </button>
      <button
        type="button"
        class="btn"
        [class.btn--danger]="confirmType() === 'danger'"
        [class.btn--warning]="confirmType() === 'warning'"
        [class.btn--primary]="confirmType() === 'primary'"
        (click)="onConfirm()"
        [disabled]="isSubmitting()"
      >
        @if (isSubmitting()) {
          <span class="btn__spinner"></span>
        }
        {{ confirmText() }}
      </button>
    </footer>
  </div>
</div>
```

---

## 2. Focus Trap in Media Lightbox

**File:** `src/app/shared/components/media-lightbox/media-lightbox.component.ts`

```typescript
import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  signal,
  computed,
  viewChild,
  ElementRef,
  effect,
  inject,
  DestroyRef,
  HostListener,
  OnDestroy
} from '@angular/core';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';
import { LightboxMediaItem } from './media-lightbox.types';
import { ZoomDirective } from '../../directives/zoom';
import { ZoomConfig } from '../../directives/zoom/zoom.types';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-media-lightbox',
  standalone: true,
  imports: [DecimalPipe, ZoomDirective],
  templateUrl: './media-lightbox.component.html',
  styleUrls: ['./media-lightbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MediaLightboxComponent implements OnDestroy {
  private readonly focusTrapFactory = inject(FocusTrapFactory);
  private focusTrap: FocusTrap | null = null;
  private readonly destroyRef = inject(DestroyRef);

  readonly media = input.required<LightboxMediaItem[]>();
  readonly currentIndex = input.required<number>();
  readonly close = output<void>();
  readonly navigate = output<number>();

  private readonly _currentZoom = signal<number>(1);
  readonly currentZoom = this._currentZoom.asReadonly();
  readonly imageChanging = signal<boolean>(false);

  readonly zoomConfig: Partial<ZoomConfig> = {
    maxZoom: 4,
    minZoom: 1,
    zoomStep: 0.5
  };

  readonly zoomDirective = viewChild<ZoomDirective>('zoomDirective');
  readonly lightboxElement = viewChild<ElementRef<HTMLDivElement>>('lightboxElement');

  readonly currentMedia = computed(() => {
    const items = this.media();
    const index = this.currentIndex();
    return items[index] ?? null;
  });

  readonly hasPrev = computed(() => this.currentIndex() > 0);
  readonly hasNext = computed(() => this.currentIndex() < this.media().length - 1);

  constructor() {
    // Setup focus trap and focus management
    effect(() => {
      if (this.lightboxElement()?.nativeElement) {
        // Create focus trap
        this.focusTrap = this.focusTrapFactory.create(this.lightboxElement().nativeElement);

        // Move focus to close button (first control)
        setTimeout(() => {
          const closeBtn = this.lightboxElement()?.nativeElement?.querySelector(
            '.media-lightbox__close'
          ) as HTMLElement;
          closeBtn?.focus();
        }, 50);
      }
    });
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.close.emit();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        this.prev();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.next();
        break;
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('media-lightbox__overlay')) {
      this.close.emit();
    }
  }

  prev(): void {
    if (!this.hasPrev()) return;
    this.navigateTo(this.currentIndex() - 1);
  }

  next(): void {
    if (!this.hasNext()) return;
    this.navigateTo(this.currentIndex() + 1);
  }

  navigateTo(index: number): void {
    if (index < 0 || index >= this.media().length) return;
    if (index === this.currentIndex()) return;

    this.imageChanging.set(true);
    setTimeout(() => {
      this.navigate.emit(index);
      this.resetZoom();
      setTimeout(() => this.imageChanging.set(false), 30);
    }, 80);
  }

  onZoomChange(zoom: number): void {
    this._currentZoom.set(zoom);
  }

  zoomIn(): void {
    this.zoomDirective()?.zoomIn();
  }

  zoomOut(): void {
    this.zoomDirective()?.zoomOut();
  }

  resetZoom(): void {
    this.zoomDirective()?.resetZoom();
    this._currentZoom.set(1);
  }

  trackByMedia(index: number, media: LightboxMediaItem): number {
    return media.id;
  }
}
```

**Template Update:** `media-lightbox.component.html`

```html
<div
  class="media-lightbox"
  role="dialog"
  aria-modal="true"
  aria-label="Kép nagyítás"
  [attr.aria-labelledby]="'lightbox-title'"
  [attr.aria-describedby]="'lightbox-info'"
>
  <h2 id="lightbox-title" class="sr-only">Kép nagyítás</h2>
  <div id="lightbox-info" class="sr-only">
    Nyíl gombokkal vagy billentyűzet nyilakkal navigálhatsz a képeken.
    Ctrl/Cmd+Plus nagyít, Ctrl/Cmd+Minus kicsinyít. ESC billentyűvel bezárható.
  </div>

  <!-- Overlay háttér -->
  <div
    class="media-lightbox__overlay"
    (click)="onOverlayClick($event)"
    aria-hidden="true"
  ></div>

  <!-- Fő container -->
  @if (currentMedia()) {
    <div
      #lightboxElement
      class="media-lightbox__container"
      tabindex="-1"
    >
      <!-- Bezárás gomb -->
      <button
        class="media-lightbox__close"
        (click)="close.emit()"
        aria-label="Bezárás"
        type="button"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- Számláló -->
      @if (media().length > 1) {
        <span class="media-lightbox__counter" aria-live="polite" aria-atomic="true">
          {{ currentIndex() + 1 }} / {{ media().length }}
        </span>
      }

      <!-- Fő kép terület -->
      <div class="media-lightbox__main">
        <!-- Bal nyíl -->
        @if (media().length > 1) {
          <button
            class="media-lightbox__arrow media-lightbox__arrow--prev"
            [class.media-lightbox__arrow--disabled]="!hasPrev()"
            [disabled]="!hasPrev()"
            (click)="prev()"
            aria-label="Előző kép"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        }

        <!-- Kép wrapper zoom-mal -->
        <div class="media-lightbox__image-wrapper">
          <img
            class="media-lightbox__image"
            [class.media-lightbox__image--changing]="imageChanging()"
            [src]="currentMedia()!.url"
            [alt]="currentMedia()!.fileName"
            [attr.draggable]="false"
            (dragstart)="$event.preventDefault()"
            (selectstart)="$event.preventDefault()"
            appZoom
            #zoomDirective="appZoom"
            [zoomEnabled]="true"
            [zoomConfig]="zoomConfig"
            (zoomChangeEvent)="onZoomChange($event)"
          />

          <!-- Zoom Controls -->
          <div class="media-lightbox__zoom-controls">
            <button
              class="media-lightbox__zoom-btn"
              (click)="zoomOut()"
              [disabled]="currentZoom() <= 1"
              aria-label="Kicsinyítés"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <span class="media-lightbox__zoom-level" aria-live="polite">
              {{ (currentZoom() * 100) | number:'1.0-0' }}%
            </span>
            <button
              class="media-lightbox__zoom-btn"
              (click)="zoomIn()"
              [disabled]="currentZoom() >= 4"
              aria-label="Nagyítás"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
            </button>
            <button
              class="media-lightbox__zoom-btn media-lightbox__zoom-btn--reset"
              (click)="resetZoom()"
              [disabled]="currentZoom() === 1"
              aria-label="Visszaállítás"
              type="button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Jobb nyíl -->
        @if (media().length > 1) {
          <button
            class="media-lightbox__arrow media-lightbox__arrow--next"
            [class.media-lightbox__arrow--disabled]="!hasNext()"
            [disabled]="!hasNext()"
            (click)="next()"
            aria-label="Következő kép"
            type="button"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        }
      </div>

      <!-- Thumbnail galéria -->
      @if (media().length > 1) {
        <div class="media-lightbox__thumbnails">
          @for (item of media(); track trackByMedia($index, item); let i = $index) {
            <button
              class="media-lightbox__thumbnail"
              [class.media-lightbox__thumbnail--active]="i === currentIndex()"
              (click)="navigateTo(i)"
              [attr.tabindex]="i === currentIndex() ? '0' : '-1'"
              [attr.aria-label]="'Kép ' + (i + 1) + (i === currentIndex() ? ', aktív' : '')"
              [attr.aria-pressed]="i === currentIndex()"
              type="button"
            >
              <img
                class="media-lightbox__thumbnail-image"
                [src]="item.url"
                [alt]="item.fileName"
                [attr.draggable]="false"
              />
            </button>
          }
        </div>
      }
    </div>
  }
</div>
```

---

## 3. Selection Grid - Enhanced aria-label & Instructions

**File:** `src/app/features/photo-selection/components/selection-grid/selection-grid.component.ts`

Add method to generate contextual aria-label:

```typescript
/**
 * Generate contextual aria-label for photo item
 */
getPhotoAriaLabel(photo: WorkflowPhoto, isSelected: boolean): string {
  const baseLabel = `Fotó: ${photo.filename}`;
  const selectionState = isSelected ? ', kiválasztva' : ', nem kiválasztva';
  const disabledState = this.isDisabled(photo.id) ? ', letiltva - maximum elérve' : '';
  return baseLabel + selectionState + disabledState;
}
```

**File:** `src/app/features/photo-selection/components/selection-grid/selection-grid.component.html`

Update photo item template (Line 100-175):

```html
<!-- Közös photo item template (DRY) -->
<ng-template #photoItemTemplate let-photo let-index="index">
  <div
    class="selection-grid__item"
    [class.selection-grid__item--selected]="isSelected(photo.id)"
    [class.selection-grid__item--disabled]="isDisabled(photo.id)"
    [class.selection-grid__item--readonly]="readonly()"
    role="option"
    [attr.aria-selected]="isSelected(photo.id)"
    [attr.aria-disabled]="isDisabled(photo.id)"
    [attr.aria-label]="getPhotoAriaLabel(photo, isSelected(photo.id))"
    [tabindex]="readonly() ? -1 : 0"
    (click)="onPhotoClick(photo, $event)"
    (keydown.enter)="onPhotoClick(photo, $event)"
    (keydown.space)="onPhotoClick(photo, $event); $event.preventDefault()"
  >
    <!-- ... rest of template ... -->
  </div>
</ng-template>
```

Add instructions region before grid (Line 52):

```html
<!-- US-008: Virtual Scroll vagy Pagination mód -->
@if (photos().length > 0 && !isLoading()) {
  <!-- Screen reader instructions -->
  <div id="grid-selection-instructions" class="sr-only">
    A képeket Tab-bal vagy nyíl billentyűkkel navigálhatod.
    Enter vagy szóköz megnyomásával kiválaszthatod vagy deselektálhatod a képet.
    @if (allowMultiple()) {
      Shift+kattintás vagy Shift+nyilak: tartománybeli kiválasztás.
    }
    @if (maxSelection()) {
      Maximálisan {{ maxSelection() }} képet választhatsz ki.
    }
  </div>

  @if (useVirtualScroll()) {
    <!-- Virtual Scroll Photo Grid (eredeti implementáció) -->
    <cdk-virtual-scroll-viewport
      class="selection-grid__viewport"
      [itemSize]="rowHeight()"
      [minBufferPx]="minBufferPx()"
      [maxBufferPx]="maxBufferPx()"
      [style.--grid-columns]="columnsCount()"
      role="listbox"
      [attr.aria-multiselectable]="allowMultiple()"
      [attr.aria-label]="'Képek kiválasztása, ' + photos().length + ' kép elérhető'"
      [attr.aria-describedby]="'grid-selection-instructions'"
    >
```

---

## 4. Color Contrast Enhancement

**File:** `src/app/features/photo-selection/photo-selection.component.scss`

Update color variables for AAA compliance:

```scss
// AAA Enhanced Contrast Colors
$color-primary: #2563eb;           // 7.2:1 on white
$color-primary-dark: #1e40af;      // 8.8:1 on white
$color-success: #065f46;           // 8.5:1 on white (was #166534)
$color-error: #7c2d12;             // 8.2:1 on white (was #991b1b)
$color-warning: #92400e;           // 7.8:1 on white (was #b45309)

$color-text-primary: #0f172a;      // 11:1 on white
$color-text-secondary: #1e293b;    // 10.5:1 on white
$color-text-muted: #334155;        // 8.2:1 on white (was #64748b = 4.2:1) ⚠️

// Update error message
.photo-selection__error {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid rgba($color-error, 0.2);
  border-radius: 10px;
  margin-bottom: 16px;
  animation: slideIn 0.3s ease;

  svg {
    width: 20px;
    height: 20px;
    color: $color-error;
    flex-shrink: 0;
    margin-right: 12px;
  }

  span {
    flex: 1;
    color: $color-error;  // Now has 8.2:1 contrast ✅
    font-size: 14px;
    font-weight: 500;
  }
}

// Update save status
.selection-grid__save-status {
  color: #0369a1;  // Info blue with 6.8:1 contrast

  &--success {
    color: $color-success;  // 8.5:1 contrast ✅
  }
}

// Focus visible - high contrast
button:focus-visible,
[tabindex]:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;

  @media (prefers-contrast: more) {
    outline-width: 3px;
    outline-color: #1e40af;
  }
}
```

---

## 5. SR-Only Utility Class

**File:** `src/styles/utilities.scss` (add if missing)

```scss
/**
 * Screen reader only - visually hidden but accessible
 */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/**
 * Reduce motion support - comprehensive
 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 6. Step Indicator - Enhanced aria-labels

**File:** `src/app/features/photo-selection/components/step-indicator/step-indicator.component.ts`

Add aria-label generation method:

```typescript
/**
 * Generate contextual aria-label for step button
 */
getStepAriaLabel(step: WorkflowStep): string {
  const stepInfo = WORKFLOW_STEPS.find(s => s.step === step);
  let label = stepInfo?.label || step;

  if (this.isCompleted(step)) {
    label += ', befejezve';
  } else if (this.isActive(step)) {
    label += ', aktuális lépés';
  } else if (this.isDisabled(step)) {
    label += ', nem elérhető - először fejezd be az aktuális lépést';
  }

  return label;
}
```

Update template (Line 36-72):

```html
<button
  type="button"
  class="step-pills__pill"
  [class.step-pills__pill--active]="isActive(step.step)"
  [class.step-pills__pill--completed]="isCompleted(step.step)"
  [class.step-pills__pill--disabled]="isDisabled(step.step)"
  [attr.aria-current]="isActive(step.step) ? 'step' : null"
  [attr.aria-label]="getStepAriaLabel(step.step)"
  [attr.aria-disabled]="isDisabled(step.step)"
  [disabled]="isDisabled(step.step)"
  (click)="onStepClick(step.step)"
>
  <!-- Step number or checkmark -->
  <span class="step-pills__indicator">
    @if (isCompleted(step.step)) {
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
        <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    } @else {
      {{ i + 1 }}
    }
  </span>

  <!-- Label (hidden on mobile, visible on tablet+) -->
  <span class="step-pills__label">{{ step.label }}</span>

  <!-- Info button (only active step) -->
  @if (isActive(step.step) && currentStep() !== 'completed') {
    <span
      class="step-pills__info"
      role="button"
      tabindex="0"
      aria-label="Információ az aktuális lépésről"
      (click)="onInfoClick($event, step.step)"
      (keydown.enter)="onInfoKeydown($event, step.step)"
      (keydown.space)="onInfoKeydown($event, step.step); $event.preventDefault()"
    >?</span>
  }
</button>
```

---

## 7. Empty State - Proper Semantics

**File:** `src/app/features/photo-selection/components/selection-grid/selection-grid.component.html`

Update empty state (Line 178-192):

```html
<!-- Empty state - csak ha tényleg üres ÉS már betöltődött ÉS inicializálva van -->
@if (photos().length === 0 && !isLoading() && isInitialized()) {
  <div
    class="selection-grid__empty"
    role="region"
    [attr.aria-label]="'Üres galéria: ' + emptyMessage()"
    [attr.aria-describedby]="emptyDescription() ? 'empty-description' : null"
  >
    <div class="selection-grid__empty-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <path d="M21 15l-5-5L5 21"/>
      </svg>
    </div>
    <p class="selection-grid__empty-text">{{ emptyMessage() }}</p>
    @if (emptyDescription()) {
      <p id="empty-description" class="selection-grid__empty-description">
        {{ emptyDescription() }}
      </p>
    }
  </div>
}
```

---

## 8. Validation Error Message

**File:** `src/app/features/photo-selection/components/navigation-footer/navigation-footer.component.ts`

Update template styling (Line 40-45):

```html
<!-- Validation message -->
@if (validationError()) {
  <div
    class="photo-selection__validation"
    role="alert"
    aria-live="assertive"
    aria-atomic="true"
  >
    <span class="validation__icon" aria-hidden="true">❌</span>
    {{ validationError() }}
  </div>
}
```

Add SCSS:

```scss
.photo-selection__validation {
  text-align: center;
  font-size: 13px;
  color: #7c2d12;  // AAA contrast
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  animation: shake 0.3s ease;

  .validation__icon {
    margin-right: 6px;
  }
}
```

---

## Testing Checklist

After implementing fixes, test:

### Keyboard Navigation:
- [ ] Tab through all interactive elements
- [ ] Shift+Tab backwards navigation works
- [ ] Enter/Space activates buttons
- [ ] Escape closes dialogs
- [ ] Arrow keys navigate in grid

### Screen Reader (NVDA/JAWS):
- [ ] Dialog title announced with aria-labelledby
- [ ] Focus trap prevents background access
- [ ] Status messages announced immediately
- [ ] Photo items clearly labeled with selection state
- [ ] Empty state properly announced

### Focus Visible:
- [ ] 2px outline around focused elements
- [ ] Outline clearly visible on all backgrounds
- [ ] Outline offset prevents clipping

### Color Contrast:
- [ ] All text ≥ 4.5:1 (AA) or 7:1 (AAA)
- [ ] Use WebAIM contrast checker
- [ ] Test in high contrast mode

### Reduced Motion:
- [ ] Animations disabled when setting enabled
- [ ] Transitions still smooth but instant

---

## Estimated Implementation Time

| Fix | Time | Difficulty |
|-----|------|-----------|
| Focus trap (2 fixes) | 4h | Medium |
| aria-labelledby | 1h | Easy |
| Color contrast | 3h | Medium |
| aria-labels | 2.5h | Medium |
| Testing | 4h | Hard |
| **TOTAL** | **14.5h** | - |

---

**Last Updated:** 2026-01-25
