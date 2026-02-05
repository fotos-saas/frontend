# 🎨 UI Components Context

> Töltsd be ezt ha UI komponensen dolgozol.

## Kötelező Importok

```typescript
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { MatTooltipModule } from '@angular/material/tooltip';
```

## Komponens Sablon

```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    CommonModule,
    LucideAngularModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="my-component page-card">
      <!-- content -->
    </div>
  `
})
export class MyComponent implements OnInit, OnDestroy {
  readonly ICONS = ICONS;
  private destroy$ = new Subject<void>();

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

## Dialog Sablon

```typescript
import { createBackdropHandler } from '@shared/utils/dialog.util';

@Component({
  template: `
    <div class="dialog-backdrop"
         (mousedown)="backdropHandler.onMouseDown($event)"
         (mouseup)="backdropHandler.onMouseUp($event)">
      <div class="dialog-panel">
        <!-- content -->
      </div>
    </div>
  `
})
export class MyDialogComponent {
  @Output() close = new EventEmitter<void>();
  backdropHandler = createBackdropHandler(() => this.close.emit());
}
```

## Dialog Méretek

| Class | Max-width | Használat |
|-------|-----------|-----------|
| `dialog-panel` | 400px | Confirm, alert |
| `dialog-panel--md` | 480px | Form, QR |
| `dialog-panel--lg` | 600px | Részletes form |

## Ikon Használat

```html
<!-- ✅ Helyes -->
<lucide-icon [name]="ICONS.PLUS" [size]="18" />
<lucide-icon [name]="ICONS.TRASH" [size]="16" class="text-red-500" />

<!-- ❌ TILOS - emoji -->
<span>📱</span>
```

## Tooltip Használat

```html
<!-- ✅ Helyes -->
<button matTooltip="Mentés">
<button matTooltip="Törlés" matTooltipPosition="above">

<!-- ❌ TILOS - régi rendszer -->
<button data-tooltip="...">
```

## Animációk

```scss
// Staggered entry
@for $i from 1 through 20 {
  &:nth-child(#{$i}) {
    animation-delay: #{$i * 0.05}s;
  }
}

// Hover
&:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

// A11y - KÖTELEZŐ!
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Skeleton Loading

```html
<!-- Spinner helyett skeleton -->
<div class="skeleton-card">
  <div class="skeleton-image shimmer"></div>
  <div class="skeleton-text shimmer"></div>
</div>
```

## Meglévő Komponensek - HASZNÁLD!

| Ha ezt akarod | Használd ezt |
|---------------|--------------|
| Törlés megerősítés | `ConfirmDialogComponent` |
| Loading state | `SkeletonLoaderComponent` |
| Üres állapot | `EmptyStateComponent` |
| Fájl feltöltés | `FileUploadComponent` |
| Kép galéria | `ImageGalleryComponent` |

