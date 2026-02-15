import { Component, ChangeDetectionStrategy, input, output, signal, inject, DestroyRef, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PsInputComponent } from '@shared/components/form';
import { ICONS } from '../../../constants/icons.constants';
import { DialogWrapperComponent } from '../../dialog-wrapper/dialog-wrapper.component';
import { PartnerService } from '../../../../features/partner/services/partner.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-sample-package-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, DialogWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-dialog-wrapper
      [variant]="editId() ? 'edit' : 'create'"
      headerStyle="flat"
      theme="blue"
      [icon]="ICONS.PACKAGE"
      [title]="editId() ? 'Csomag szerkesztése' : 'Új minta csomag'"
      size="md"
      [isSubmitting]="saving()"
      (closeEvent)="close.emit()"
      (submitEvent)="save()"
      (backdropClickEvent)="close.emit()">
      <div dialogBody>
        <ps-input
          label="Csomag neve"
          [(ngModel)]="title"
          placeholder="pl. Osztálykép minták"
        />
      </div>

      <div dialogFooter>
        <button class="btn btn--outline" (click)="close.emit()">
          Mégse
        </button>
        <button
          class="btn btn--primary"
          [disabled]="saving() || !title.trim()"
          (click)="save()">
          @if (saving()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
          }
          Mentés
        </button>
      </div>
    </app-dialog-wrapper>
  `,
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
