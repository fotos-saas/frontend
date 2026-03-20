import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailFolder, EmailLabel } from '../../../models/email-client.models';
import { EmailClientService } from '../../../services/email-client.service';
import { ToastService } from '../../../../../core/services/toast.service';

@Component({
  selector: 'app-email-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <div class="sidebar-content">
      <!-- Mappák -->
      <div class="sidebar-section">
        <h3 class="section-title">Mappák</h3>
        @for (folder of folders(); track folder.path) {
          <button
            class="sidebar-item"
            [class.active]="activeFolder() === folder.path && !activeLabel()"
            (click)="folderSelect.emit(folder.path)"
          >
            <lucide-icon [name]="folder.icon" [size]="16" />
            <span class="item-label">{{ folder.name }}</span>
            @if (folder.unread_count > 0) {
              <span class="badge">{{ folder.unread_count }}</span>
            }
          </button>
        }
      </div>

      <!-- Címkék -->
      <div class="sidebar-section">
        <div class="section-header">
          <h3 class="section-title">Címkék</h3>
          @if (!showLabelForm()) {
            <button class="add-btn" (click)="showLabelForm.set(true)">
              <lucide-icon [name]="ICONS.PLUS" [size]="14" />
            </button>
          }
        </div>

        @if (showLabelForm()) {
          <div class="label-form">
            <input
              class="label-input"
              placeholder="Címke neve"
              maxlength="50"
              #labelInput
              (keydown.enter)="createLabel(labelInput.value, colorInput.value); labelInput.value = ''"
              (keydown.escape)="showLabelForm.set(false)"
            />
            <input type="color" class="color-input" value="#6366f1" #colorInput />
            <button class="save-btn" (click)="createLabel(labelInput.value, colorInput.value); labelInput.value = ''">
              <lucide-icon [name]="ICONS.CHECK" [size]="14" />
            </button>
            <button class="cancel-btn" (click)="showLabelForm.set(false)">
              <lucide-icon [name]="ICONS.X_CIRCLE" [size]="14" />
            </button>
          </div>
        }

        @for (label of labels(); track label.id) {
          <button
            class="sidebar-item"
            [class.active]="activeLabel() === label.id"
            (click)="labelSelect.emit(label.id)"
          >
            <span class="label-dot" [style.background-color]="label.color"></span>
            <span class="item-label">{{ label.name }}</span>
            @if (label.email_count) {
              <span class="badge badge--muted">{{ label.email_count }}</span>
            }
          </button>
        }

        @if (labels().length === 0 && !showLabelForm()) {
          <p class="empty-text">Még nincs címke</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .sidebar-content {
      padding: 12px 0;
    }

    .sidebar-section {
      margin-bottom: 16px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-tertiary, #9ca3af);
      padding: 4px 12px 6px;
      margin: 0;
    }

    .section-header .section-title {
      padding-left: 0;
    }

    .add-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      color: var(--text-tertiary, #9ca3af);

      &:hover {
        background: var(--bg-hover, #f3f4f6);
        color: var(--text-primary, #111827);
      }
    }

    .sidebar-item {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 6px 12px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      transition: background 0.15s;
      text-align: left;

      &:hover {
        background: var(--bg-hover, #f3f4f6);
      }

      &.active {
        background: var(--primary-50, #eef2ff);
        color: var(--primary-700, #4338ca);
        font-weight: 500;
      }
    }

    .item-label {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .badge {
      font-size: 11px;
      font-weight: 600;
      padding: 1px 6px;
      border-radius: 10px;
      background: var(--primary-600, #4f46e5);
      color: #fff;
      min-width: 18px;
      text-align: center;
    }

    .badge--muted {
      background: var(--bg-hover, #e5e7eb);
      color: var(--text-tertiary, #9ca3af);
    }

    .label-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .label-form {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 12px;
    }

    .label-input {
      flex: 1;
      padding: 4px 8px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 4px;
      font-size: 12px;
      outline: none;
      min-width: 0;

      &:focus {
        border-color: var(--primary-500, #6366f1);
      }
    }

    .color-input {
      width: 24px;
      height: 24px;
      padding: 0;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .save-btn, .cancel-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border: none;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
    }

    .save-btn {
      color: var(--success-600, #16a34a);
      &:hover { background: var(--success-50, #f0fdf4); }
    }

    .cancel-btn {
      color: var(--text-tertiary, #9ca3af);
      &:hover { background: var(--bg-hover, #f3f4f6); }
    }

    .empty-text {
      font-size: 12px;
      color: var(--text-tertiary, #9ca3af);
      padding: 4px 12px;
      margin: 0;
    }
  `],
})
export class EmailSidebarComponent {
  private readonly emailClientService = inject(EmailClientService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly folders = input.required<EmailFolder[]>();
  readonly labels = input.required<EmailLabel[]>();
  readonly activeFolder = input.required<string>();
  readonly activeLabel = input.required<number | null>();

  readonly folderSelect = output<string>();
  readonly labelSelect = output<number>();
  readonly labelCreated = output<EmailLabel>();
  readonly labelUpdated = output<EmailLabel>();
  readonly labelDeleted = output<number>();

  readonly showLabelForm = signal(false);

  createLabel(name: string, color: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;

    this.emailClientService.createLabel({ name: trimmed, color }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (data) => {
        this.labelCreated.emit(data.label);
        this.showLabelForm.set(false);
        this.toast.success('Siker', 'Címke létrehozva');
      },
      error: () => this.toast.error('Hiba', 'Nem sikerült létrehozni a címkét.'),
    });
  }
}
