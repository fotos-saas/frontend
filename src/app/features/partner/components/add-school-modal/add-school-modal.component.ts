import { Component, output, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PsInputComponent } from '@shared/components/form';
import { PartnerService, SchoolItem, CreateSchoolRequest } from '../../services/partner.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

/**
 * Add School Modal - Új iskola hozzáadása.
 */
@Component({
  selector: 'app-add-school-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      variant="create"
      headerStyle="hero"
      theme="green"
      [icon]="ICONS.BUILDING_2"
      title="Új iskola hozzáadása"
      size="sm"
      [closable]="!submitting()"
      [isSubmitting]="submitting()"
      [errorMessage]="error()"
      (closeEvent)="close.emit()"
      (submitEvent)="onSubmit()"
    >
      <ng-container dialogBody>
        <ps-input
          label="Iskola neve"
          placeholder="pl. Petőfi Sándor Gimnázium"
          [(ngModel)]="formData.name"
          name="name"
          [required]="true"
        />

        <ps-input
          label="Város"
          placeholder="pl. Budapest"
          [(ngModel)]="formData.city"
          name="city"
        />
      </ng-container>

      <ng-container dialogFooter>
        <button type="button" class="btn btn--outline" (click)="close.emit()" [disabled]="submitting()">
          Mégse
        </button>
        <button
          type="button"
          class="btn btn--confirm"
          (click)="onSubmit()"
          [disabled]="submitting() || !formData.name"
        >
          @if (submitting()) {
            <lucide-icon [name]="ICONS.LOADER" [size]="16" class="spin" />
            Mentés...
          } @else {
            <lucide-icon [name]="ICONS.CHECK" [size]="18" />
            Iskola hozzáadása
          }
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddSchoolModalComponent {
  readonly ICONS = ICONS;

  readonly close = output<void>();
  readonly schoolCreated = output<SchoolItem>();

  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);

  submitting = signal(false);
  error = signal<string | null>(null);

  formData: CreateSchoolRequest = {
    name: '',
    city: null,
  };

  onSubmit(): void {
    if (!this.formData.name) {
      this.error.set('Az iskola neve kötelező');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    this.partnerService.createSchool(this.formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.schoolCreated.emit(response.data);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err.error?.message ?? 'Hiba történt az iskola létrehozása során');
        }
      });
  }

}
