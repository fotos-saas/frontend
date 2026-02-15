import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PsInputComponent } from '@shared/components/form';
import { ICONS } from '../../../constants/icons.constants';
import { createBackdropHandler } from '../../../utils/dialog.util';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-sample-package-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dialog-backdrop"
         (mousedown)="backdropHandler.onMouseDown($event)"
         (click)="backdropHandler.onClick($event)">
      <div class="dialog-panel dialog-panel--md p-5" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ editId() ? 'Csomag szerkesztése' : 'Új minta csomag' }}
          </h3>
          <button class="close-btn" (click)="close.emit()">
            <lucide-icon [name]="ICONS.X" [size]="18" />
          </button>
        </div>

        <div>
          <ps-input
            label="Csomag neve"
            [(ngModel)]="title"
            placeholder="pl. Osztálykép minták"
          />
        </div>

        <div class="flex justify-end mt-5" style="margin: -4px; margin-top: 20px;">
          <button
            class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-sm transition-colors"
            style="margin: 4px;"
            (click)="close.emit()"
          >Mégse</button>
          <button
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            style="margin: 4px;"
            [disabled]="saving() || !title.trim()"
            (click)="save()"
          >{{ saving() ? 'Mentés...' : 'Mentés' }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .close-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #f1f5f9;
        color: #1e293b;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      * { transition-duration: 0.01ms !important; }
    }
  `],
})
export class SamplePackageDialogComponent {
  projectId = input.required<number>();
  editId = input<number | null>(null);
  initialTitle = input<string>('');
  close = output<void>();
  saved = output<void>();

  private partnerService = inject(PartnerService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;
  saving = signal(false);
  title = '';

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    this.title = this.initialTitle();
  }

  save(): void {
    if (!this.title.trim()) return;

    this.saving.set(true);
    const editId = this.editId();

    const obs = editId
      ? this.partnerService.updateSamplePackage(this.projectId(), editId, this.title.trim())
      : this.partnerService.createSamplePackage(this.projectId(), this.title.trim());

    obs.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Siker', editId ? 'Csomag módosítva.' : 'Csomag létrehozva.');
        this.saved.emit();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Hiba', 'Nem sikerült a mentés.');
      },
    });
  }
}
