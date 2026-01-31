# Osztály Hírek - Angular UX Patterns

> Verzió: 1.0
> Dátum: 2025-01-19
> Cél: Natív app-szerű élmény webes technológiákkal

---

## 🎯 Élmény Célok

| Cél | Megoldás |
|-----|----------|
| Azonnali feedback | Optimistic UI |
| Gyors betöltés | Lazy image loading |
| Smooth navigáció | View Transitions API |
| Natív érzés | Haptic feedback |

---

## 1. Optimistic UI Pattern

### Mi ez?
A UI **azonnal** reagál a user akcióra, nem várja meg az API választ.

### Példa: Like gomb

```
HAGYOMÁNYOS (lassú):
User klikk → Spinner → API hívás → Várakozás → UI frissül
                       [~~~~500ms~~~~]

OPTIMISTIC (azonnali):
User klikk → UI AZONNAL frissül → API hívás háttérben
             ↓
             Ha hiba → Rollback + Toast
```

### Implementáció

```typescript
// news.service.ts
@Injectable({ providedIn: 'root' })
export class NewsService {
  private readonly _feed = signal<FeedItem[]>([]);

  /**
   * Optimistic like toggle
   * 1. Azonnal frissíti a UI-t
   * 2. Háttérben hívja az API-t
   * 3. Hiba esetén visszaállítja (rollback)
   */
  toggleLike(postId: number): void {
    // 1. Mentjük a régi állapotot (rollback-hez)
    const previousState = this._feed();

    // 2. AZONNAL frissítjük a UI-t
    this._feed.update(items =>
      items.map(item => {
        if (item.type === 'forum_post' && item.post?.id === postId) {
          const isLiked = !item.post.isLikedByMe;
          return {
            ...item,
            post: {
              ...item.post,
              isLikedByMe: isLiked,
              likesCount: isLiked
                ? item.post.likesCount + 1
                : item.post.likesCount - 1
            }
          };
        }
        return item;
      })
    );

    // 3. Háttérben API hívás
    this.http.post(`/api/v1/forum/posts/${postId}/like`, {}).pipe(
      catchError(err => {
        // 4. HIBA → Rollback
        this._feed.set(previousState);

        // 5. User értesítése
        this.toast.error('Nem sikerült. Próbáld újra!');

        return throwError(() => err);
      })
    ).subscribe();
  }
}
```

### Feed Card Component

```typescript
// feed-card.component.ts
@Component({
  selector: 'app-feed-card',
  template: `
    <article class="feed-card" (click)="onCardClick()">
      <!-- ... card content ... -->

      @if (item().type === 'forum_post') {
        <footer class="feed-card__footer">
          <button
            class="like-btn"
            [class.like-btn--liked]="item().post?.isLikedByMe"
            (click)="onLikeClick($event)"
            [attr.aria-pressed]="item().post?.isLikedByMe"
          >
            <span class="like-btn__icon" aria-hidden="true">
              {{ item().post?.isLikedByMe ? '❤️' : '🤍' }}
            </span>
            <span class="like-btn__count">
              {{ item().post?.likesCount }}
            </span>
          </button>
        </footer>
      }
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedCardComponent {
  item = input.required<FeedItem>();
  liked = output<number>();

  onLikeClick(event: Event): void {
    event.stopPropagation(); // Ne navigáljon
    this.liked.emit(this.item().post!.id);
  }
}
```

### Like Animáció (CSS)

```scss
.like-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: transform 0.1s ease;

  &:active {
    transform: scale(0.95);
  }

  &__icon {
    font-size: 1.25rem;
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &--liked &__icon {
    animation: likePopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  &__count {
    font-size: 0.875rem;
    color: var(--color-text-secondary);
    min-width: 1.5ch; // Prevent layout shift
  }
}

@keyframes likePopIn {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
```

---

## 2. Intersection Observer (Lazy Images)

### Mi ez?
Képek csak akkor töltődnek be, amikor **láthatóvá válnak** a viewportban.

### Directive

```typescript
// lazy-image.directive.ts
import { Directive, ElementRef, inject, input, OnInit, OnDestroy } from '@angular/core';

@Directive({
  selector: 'img[appLazyImage]',
  standalone: true
})
export class LazyImageDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef<HTMLImageElement>);
  private observer?: IntersectionObserver;

  /** A valódi kép URL */
  appLazyImage = input.required<string>();

  /** Placeholder amíg tölt */
  placeholder = input<string>('/assets/placeholder.svg');

  ngOnInit(): void {
    const img = this.el.nativeElement;

    // Kezdetben placeholder
    img.src = this.placeholder();
    img.classList.add('lazy-image', 'lazy-image--loading');

    // Observer setup
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage();
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: '50px', // 50px-el előbb kezd tölteni
        threshold: 0.1
      }
    );

    this.observer.observe(img);
  }

  private loadImage(): void {
    const img = this.el.nativeElement;
    const realSrc = this.appLazyImage();

    // Preload
    const preloader = new Image();
    preloader.onload = () => {
      img.src = realSrc;
      img.classList.remove('lazy-image--loading');
      img.classList.add('lazy-image--loaded');
    };
    preloader.onerror = () => {
      img.classList.remove('lazy-image--loading');
      img.classList.add('lazy-image--error');
    };
    preloader.src = realSrc;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
```

### Használat

```html
<!-- feed-card.component.html -->
@if (item().samples?.thumbnails; as thumbnails) {
  <div class="feed-card__thumbnails">
    @for (thumb of thumbnails; track thumb) {
      <img
        [appLazyImage]="thumb"
        [placeholder]="'/assets/sample-placeholder.svg'"
        alt="Minta előnézet"
        class="feed-card__thumb"
      />
    }
  </div>
}
```

### CSS

```scss
.lazy-image {
  transition: opacity 0.3s ease;

  &--loading {
    opacity: 0.5;
    filter: blur(5px);
  }

  &--loaded {
    opacity: 1;
    filter: none;
  }

  &--error {
    opacity: 0.3;
  }
}
```

---

## 3. View Transitions API (Smooth Navigation)

### Mi ez?
Modern böngésző API ami **smooth átmeneteket** ad oldalak között.

### Angular Setup

```typescript
// app.config.ts
import { provideRouter, withViewTransitions } from '@angular/router';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withViewTransitions({
        skipInitialTransition: true,
        onViewTransitionCreated: (info) => {
          // Custom logic
          console.log('Transition:', info.from, '→', info.to);
        }
      })
    )
  ]
};
```

### Feed Card → Voting Page Transition

```scss
// feed-card.component.scss
.feed-card {
  // Unique identifier for transition
  view-transition-name: feed-card;
}

// Global styles
::view-transition-old(feed-card),
::view-transition-new(feed-card) {
  animation-duration: 0.3s;
  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

::view-transition-old(feed-card) {
  animation-name: fadeOutScale;
}

::view-transition-new(feed-card) {
  animation-name: fadeInScale;
}

@keyframes fadeOutScale {
  to {
    opacity: 0;
    transform: scale(0.95);
  }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(1.05);
  }
}
```

### Programmatic Transition

```typescript
// feed-card.component.ts
onCardClick(): void {
  const item = this.item();

  // Set transition name dynamically
  if ('startViewTransition' in document) {
    (document as any).startViewTransition(() => {
      this.router.navigate([item.actionUrl]);
    });
  } else {
    // Fallback for older browsers
    this.router.navigate([item.actionUrl]);
  }
}
```

---

## 4. Haptic Feedback (Mobile)

### Mi ez?
Kis vibrálás touch interakciónál - **natív app érzés**.

### Service

```typescript
// haptic.service.ts
@Injectable({ providedIn: 'root' })
export class HapticService {
  private readonly isSupported = 'vibrate' in navigator;

  /**
   * Könnyű tap feedback
   */
  light(): void {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  /**
   * Erősebb feedback (like, success)
   */
  medium(): void {
    if (this.isSupported) {
      navigator.vibrate(20);
    }
  }

  /**
   * Error feedback (dupla vibrálás)
   */
  error(): void {
    if (this.isSupported) {
      navigator.vibrate([20, 50, 20]);
    }
  }

  /**
   * Success pattern
   */
  success(): void {
    if (this.isSupported) {
      navigator.vibrate([10, 30, 10]);
    }
  }
}
```

### Használat

```typescript
// feed-card.component.ts
export class FeedCardComponent {
  private haptic = inject(HapticService);

  onLikeClick(event: Event): void {
    event.stopPropagation();

    // Haptic feedback
    this.haptic.medium();

    // Emit like
    this.liked.emit(this.item().post!.id);
  }
}

// notification-bell.component.ts
onNewNotification(): void {
  this.haptic.light();
  // ... update badge
}
```

---

## 5. Pull-to-Refresh (Mobile)

### Directive

```typescript
// pull-to-refresh.directive.ts
@Directive({
  selector: '[appPullToRefresh]',
  standalone: true
})
export class PullToRefreshDirective implements OnInit, OnDestroy {
  appPullToRefresh = output<void>();

  private el = inject(ElementRef<HTMLElement>);
  private startY = 0;
  private currentY = 0;
  private isPulling = false;
  private threshold = 80; // px

  @HostListener('touchstart', ['$event'])
  onTouchStart(e: TouchEvent): void {
    if (this.el.nativeElement.scrollTop === 0) {
      this.startY = e.touches[0].clientY;
      this.isPulling = true;
    }
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(e: TouchEvent): void {
    if (!this.isPulling) return;

    this.currentY = e.touches[0].clientY;
    const pullDistance = this.currentY - this.startY;

    if (pullDistance > 0) {
      e.preventDefault();

      // Visual feedback
      const progress = Math.min(pullDistance / this.threshold, 1);
      this.updateIndicator(progress, pullDistance);
    }
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    if (!this.isPulling) return;

    const pullDistance = this.currentY - this.startY;

    if (pullDistance >= this.threshold) {
      // Trigger refresh
      this.appPullToRefresh.emit();
    }

    this.resetIndicator();
    this.isPulling = false;
  }

  private updateIndicator(progress: number, distance: number): void {
    // CSS variable for animation
    this.el.nativeElement.style.setProperty('--pull-progress', String(progress));
    this.el.nativeElement.style.setProperty('--pull-distance', `${distance}px`);
  }

  private resetIndicator(): void {
    this.el.nativeElement.style.removeProperty('--pull-progress');
    this.el.nativeElement.style.removeProperty('--pull-distance');
  }
}
```

### Használat

```html
<!-- news-feed.component.html -->
<div
  class="news-feed"
  appPullToRefresh
  (appPullToRefresh)="onRefresh()"
>
  <div class="ptr-indicator">
    <svg class="ptr-spinner"><!-- spinner --></svg>
  </div>

  @for (item of feed(); track item.id) {
    <app-feed-card [item]="item" />
  }
</div>
```

```scss
.news-feed {
  --pull-progress: 0;
  --pull-distance: 0;
}

.ptr-indicator {
  height: 0;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(var(--pull-distance) * 0.5);
  opacity: var(--pull-progress);
  transition: height 0.2s ease;

  .ptr-spinner {
    transform: rotate(calc(var(--pull-progress) * 360deg));
  }
}
```

---

## 6. Debounced Search/Filter

### Ha lesz keresés a feedben:

```typescript
// news-feed.component.ts
export class NewsFeedComponent {
  searchQuery = signal('');

  // Debounced search
  private searchSubject = new Subject<string>();

  constructor() {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(query => {
      this.newsService.searchFeed(query);
    });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
    this.searchSubject.next(value);
  }
}
```

---

## 📋 Összefoglaló Checklist

### Must Have (FÁZIS 1)
- [ ] Optimistic UI - Like gomb
- [ ] Lazy image loading - Intersection Observer
- [ ] Haptic feedback - Like, notification

### Nice to Have (FÁZIS 2)
- [ ] View Transitions - Page navigation
- [ ] Pull-to-refresh - Mobile
- [ ] Debounced search

### Prioritás Mátrix

| Feature | Élmény hatás | Komplexitás | Prioritás |
|---------|--------------|-------------|-----------|
| Optimistic UI | ⭐⭐⭐⭐⭐ | Közepes | MAGAS |
| Lazy images | ⭐⭐⭐⭐ | Alacsony | MAGAS |
| Haptic | ⭐⭐⭐ | Alacsony | KÖZEPES |
| View Transitions | ⭐⭐⭐⭐ | Közepes | KÖZEPES |
| Pull-to-refresh | ⭐⭐⭐ | Magas | ALACSONY |
