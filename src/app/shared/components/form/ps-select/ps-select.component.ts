import {
  Component,
  ChangeDetectionStrategy,
  forwardRef,
  input,
  signal,
  computed,
  ElementRef,
  inject,
  Renderer2,
  DestroyRef,
  ViewContainerRef,
  TemplateRef,
  viewChild,
  EmbeddedViewRef,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgClass } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PsFormFieldBase } from '../form-field-base';
import { PsSelectOption } from '../form.types';

@Component({
  selector: 'ps-select',
  standalone: true,
  imports: [NgClass, LucideAngularModule],
  templateUrl: './ps-select.component.html',
  styleUrl: './ps-select.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PsSelectComponent),
      multi: true,
    },
  ],
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(window:resize)': 'onWindowResize()',
    '(window:scroll)': 'onWindowScroll()',
  },
})
export class PsSelectComponent extends PsFormFieldBase<string | number> {
  readonly ICONS = ICONS;

  readonly options = input.required<PsSelectOption[]>();
  readonly emptyLabel = input('Válassz...');
  readonly variant = input<'dropdown' | 'cards'>('dropdown');
  readonly direction = input<'horizontal' | 'vertical'>('horizontal');
  readonly overlayClass = input<string>('');

  private readonly hostEl = inject(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  readonly dropdownTpl = viewChild<TemplateRef<unknown>>('dropdownTpl');

  readonly value = signal<string | number>('');
  readonly isOpen = signal(false);
  readonly highlightedIndex = signal(-1);
  readonly isFlipped = signal(false);

  readonly selectedLabel = computed(() => {
    const v = this.value();
    if (!v && v !== 0) return '';
    const opt = this.options().find(o => String(o.id) === String(v));
    return opt?.label ?? '';
  });

  readonly chevronSize = computed(() => this.size() === 'xs' ? 14 : 18);

  readonly enabledOptions = computed(() =>
    this.options().filter(o => !o.disabled)
  );

  // Overlay state
  private overlayEl: HTMLElement | null = null;
  private embeddedViewRef: EmbeddedViewRef<unknown> | null = null;
  private readonly vcr = inject(ViewContainerRef);
  private scrollListeners: (() => void)[] = [];

  constructor() {
    super();
    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  writeValue(val: string | number): void {
    this.value.set(val ?? '');
  }

  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (
      !this.hostEl.nativeElement.contains(target) &&
      (!this.overlayEl || !this.overlayEl.contains(target))
    ) {
      this.close();
    }
  }

  onWindowResize(): void {
    if (this.isOpen()) {
      this.updateOverlayPosition();
    }
  }

  onWindowScroll(): void {
    if (this.isOpen()) {
      this.updateOverlayPosition();
    }
  }

  toggle(): void {
    if (this.isDisabled()) return;
    this.isOpen() ? this.close() : this.open();
  }

  open(): void {
    if (this.isDisabled()) return;
    this.isOpen.set(true);
    const idx = this.options().findIndex(o => String(o.id) === String(this.value()));
    this.highlightedIndex.set(idx);

    // Microtask: megvárjuk a CD-t, utána overlay létrehozás
    Promise.resolve().then(() => this.createOverlay());
  }

  close(): void {
    this.isOpen.set(false);
    this.highlightedIndex.set(-1);
    this.isFlipped.set(false);
    this.destroyOverlay();
  }

  selectOption(option: PsSelectOption): void {
    if (option.disabled) return;
    const val = String(option.id);
    this.value.set(val);
    this.onChange(val);
    this.onTouched();
    if (this.variant() === 'dropdown') {
      this.close();
    }
  }

  isSelected(option: PsSelectOption): boolean {
    return String(option.id) === String(this.value());
  }

  onKeydown(event: KeyboardEvent): void {
    const opts = this.options();
    const total = opts.length;

    if (!this.isOpen()) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        this.open();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveHighlight(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveHighlight(-1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        const idx = this.highlightedIndex();
        if (idx >= 0 && idx < total) {
          this.selectOption(opts[idx]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'Tab':
        this.close();
        break;
    }
  }

  // ── Overlay Management ──

  private createOverlay(): void {
    const tpl = this.dropdownTpl();
    if (!tpl) return;

    this.destroyOverlay();

    // Create embedded view from template
    this.embeddedViewRef = this.vcr.createEmbeddedView(tpl);
    this.embeddedViewRef.detectChanges();

    // Create overlay container
    this.overlayEl = this.renderer.createElement('div');
    this.renderer.addClass(this.overlayEl, 'ps-select-overlay');
    const extraClass = this.overlayClass();
    if (extraClass) {
      this.renderer.addClass(this.overlayEl, extraClass);
    }
    this.renderer.setStyle(this.overlayEl, 'position', 'fixed');
    this.renderer.setStyle(this.overlayEl, 'z-index', '10000');
    this.renderer.setStyle(this.overlayEl, 'pointer-events', 'auto');

    // Append view nodes to overlay
    for (const node of this.embeddedViewRef.rootNodes) {
      this.renderer.appendChild(this.overlayEl, node);
    }

    // Append to document body
    this.renderer.appendChild(document.body, this.overlayEl);

    // Position it — kétszer: egyszer most, egyszer a layout után (flip-up panelHeight kell)
    this.updateOverlayPosition();
    requestAnimationFrame(() => this.updateOverlayPosition());

    // Listen to scroll on all scrollable ancestors
    this.setupScrollListeners();
  }

  private destroyOverlay(): void {
    this.cleanupScrollListeners();

    if (this.embeddedViewRef) {
      this.embeddedViewRef.destroy();
      this.embeddedViewRef = null;
    }
    if (this.overlayEl && this.overlayEl.parentNode) {
      this.renderer.removeChild(document.body, this.overlayEl);
      this.overlayEl = null;
    }
  }

  private updateOverlayPosition(): void {
    if (!this.overlayEl) return;

    // Find the trigger button
    const trigger = this.hostEl.nativeElement.querySelector('.ps-select__trigger') as HTMLElement;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const panelEl = this.overlayEl.querySelector('.ps-dropdown') as HTMLElement;
    if (!panelEl) return;

    const panelHeight = panelEl.offsetHeight;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - triggerRect.bottom - 4;
    const spaceAbove = triggerRect.top - 4;

    const shouldFlip = panelHeight > spaceBelow && spaceAbove > spaceBelow;
    this.isFlipped.set(shouldFlip);

    // Width matches trigger
    this.renderer.setStyle(this.overlayEl, 'width', triggerRect.width + 'px');
    this.renderer.setStyle(this.overlayEl, 'left', triggerRect.left + 'px');

    if (shouldFlip) {
      // Flip-up: bottom-mal pozícionálunk a trigger tetejéhez
      this.renderer.removeStyle(this.overlayEl, 'top');
      this.renderer.setStyle(this.overlayEl, 'bottom', (viewportHeight - triggerRect.top) + 'px');
      this.renderer.addClass(panelEl, 'ps-dropdown--flip-up');
    } else {
      this.renderer.removeStyle(this.overlayEl, 'bottom');
      this.renderer.setStyle(this.overlayEl, 'top', triggerRect.bottom + 'px');
      this.renderer.removeClass(panelEl, 'ps-dropdown--flip-up');
    }
  }

  private setupScrollListeners(): void {
    let el: HTMLElement | null = this.hostEl.nativeElement.parentElement;
    while (el) {
      const style = getComputedStyle(el);
      if (style.overflow !== 'visible' || style.overflowY !== 'visible') {
        const listener = () => this.updateOverlayPosition();
        el.addEventListener('scroll', listener, { passive: true });
        const captured = el;
        this.scrollListeners.push(() => captured.removeEventListener('scroll', listener));
      }
      el = el.parentElement;
    }
  }

  private cleanupScrollListeners(): void {
    for (const cleanup of this.scrollListeners) {
      cleanup();
    }
    this.scrollListeners = [];
  }

  private moveHighlight(direction: number): void {
    const opts = this.options();
    const total = opts.length;
    let idx = this.highlightedIndex();

    for (let i = 0; i < total; i++) {
      idx = (idx + direction + total) % total;
      if (!opts[idx].disabled) {
        this.highlightedIndex.set(idx);
        return;
      }
    }
  }
}
