import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef, ElementRef, HostListener } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailLabel } from '../../../models/email-client.models';
import { EmailClientService } from '../../../services/email-client.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-label-picker-dropdown',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="label-picker-wrapper">
      <button class="picker-btn" (click)="toggleOpen()">
        <lucide-icon [name]="ICONS.TAG" [size]="16" />
      </button>

      @if (open()) {
        <div class="dropdown">
          <div class="dropdown-header">Címkék</div>
          @for (label of allLabels(); track label.id) {
            <button class="dropdown-item" (click)="toggleLabel(label)">
              <span class="label-dot" [style.background-color]="label.color"></span>
              <span class="label-name">{{ label.name }}</span>
              @if (isSelected(label.id)) {
                <lucide-icon [name]="ICONS.CHECK" [size]="14" class="check-icon" />
              }
            </button>
          }
          @if (allLabels().length === 0) {
            <p class="empty-text">Nincs címke</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .label-picker-wrapper {
      position: relative;
    }

    .picker-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      color: var(--text-tertiary, #9ca3af);

      &:hover { background: var(--bg-hover, #f3f4f6); }
    }

    .dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      width: 180px;
      background: var(--bg-primary, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 20;
      overflow: hidden;
    }

    .dropdown-header {
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary, #9ca3af);
      border-bottom: 1px solid var(--border-color, #e5e7eb);
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-primary, #111827);
      text-align: left;

      &:hover { background: var(--bg-hover, #f3f4f6); }
    }

    .label-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .label-name {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .check-icon { color: var(--primary-600, #4f46e5); }

    .empty-text {
      padding: 8px 12px;
      font-size: 12px;
      color: var(--text-tertiary, #9ca3af);
      margin: 0;
    }
  `],
})
export class LabelPickerDropdownComponent {
  private readonly emailClientService = inject(EmailClientService);
  private readonly toast = inject(ToastService);
  private readonly elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.elementRef.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly emailId = input.required<number>();
  readonly currentLabels = input.required<{ id: number; name: string; color: string }[]>();
  readonly allLabels = input.required<EmailLabel[]>();

  readonly labelsChanged = output<{ emailId: number; labels: { id: number; name: string; color: string }[] }>();

  readonly open = signal(false);

  toggleOpen(): void {
    this.open.update(v => !v);
  }

  isSelected(labelId: number): boolean {
    return this.currentLabels().some(l => l.id === labelId);
  }

  toggleLabel(label: EmailLabel): void {
    const current = this.currentLabels();
    const exists = current.some(l => l.id === label.id);
    const newIds = exists
      ? current.filter(l => l.id !== label.id).map(l => l.id)
      : [...current.map(l => l.id), label.id];

    this.emailClientService.syncLabels(this.emailId(), newIds).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.labelsChanged.emit({ emailId: this.emailId(), labels: data.labels });
      },
      error: () => this.toast.error('Hiba', 'Nem sikerült frissíteni a címkéket.'),
    });
  }
}
