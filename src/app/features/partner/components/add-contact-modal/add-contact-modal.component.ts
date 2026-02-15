import { Component, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PsInputComponent } from '@shared/components/form';
import { ProjectContact } from '../../services/partner.service';
import { ICONS } from '../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../shared/components/dialog-wrapper/dialog-wrapper.component';

/**
 * Add Contact Modal - Új kapcsolattartó hozzáadása.
 */
@Component({
  selector: 'app-add-contact-modal',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, DialogWrapperComponent],
  template: `
    <app-dialog-wrapper
      variant="create"
      headerStyle="hero"
      theme="purple"
      [icon]="ICONS.USER_PLUS"
      title="Új kapcsolattartó"
      size="sm"
      [errorMessage]="error()"
      (closeEvent)="close.emit()"
      (submitEvent)="onSubmit()"
    >
      <ng-container dialogBody>
        <ps-input
          label="Név"
          placeholder="pl. Kovács János"
          [(ngModel)]="formData.name"
          name="name"
          [required]="true"
        />

        <ps-input
          type="email"
          label="Email"
          placeholder="pl. kovacs.janos@iskola.hu"
          [(ngModel)]="formData.email"
          name="email"
        />

        <ps-input
          type="tel"
          label="Telefon"
          placeholder="pl. +36 30 123 4567"
          [(ngModel)]="formData.phone"
          name="phone"
        />
      </ng-container>

      <ng-container dialogFooter>
        <button type="button" class="btn btn--outline" (click)="close.emit()">
          Mégse
        </button>
        <button
          type="button"
          class="btn btn--purple"
          (click)="onSubmit()"
          [disabled]="!formData.name"
        >
          <lucide-icon [name]="ICONS.CHECK" [size]="18" />
          Hozzáadás
        </button>
      </ng-container>
    </app-dialog-wrapper>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddContactModalComponent {
  readonly ICONS = ICONS;

  readonly close = output<void>();
  readonly contactCreated = output<ProjectContact>();

  error = signal<string | null>(null);

  formData: ProjectContact = {
    name: '',
    email: null,
    phone: null,
  };

  onSubmit(): void {
    if (!this.formData.name) {
      this.error.set('A név megadása kötelező');
      return;
    }

    this.error.set(null);
    this.contactCreated.emit({ ...this.formData });
  }

}
