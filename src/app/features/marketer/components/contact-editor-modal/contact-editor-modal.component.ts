import { Component, input, output, ChangeDetectionStrategy, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MarketerService, ProjectContact } from '../../services/marketer.service';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';

/**
 * Contact Editor Modal - Kapcsolattartó hozzáadása/szerkesztése.
 * Modern Tailwind alapú kompakt form.
 */
@Component({
  selector: 'app-contact-editor-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
    >
      <div class="dialog-panel max-w-sm" (click)="$event.stopPropagation()">
        <!-- Header -->
        <header class="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 class="text-base font-semibold text-gray-900">
            {{ isEditing ? 'Kapcsolattartó szerkesztése' : 'Új kapcsolattartó' }}
          </h2>
          <button
            type="button"
            class="w-7 h-7 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-md text-gray-500 hover:text-gray-700 transition-colors"
            (click)="close.emit()"
          >✕</button>
        </header>

        <!-- Form -->
        <form (ngSubmit)="onSubmit()" class="p-4 space-y-3">
          <!-- Név -->
          <div>
            <label for="name" class="block text-xs font-medium text-gray-700 mb-1">Név *</label>
            <input
              type="text"
              id="name"
              [(ngModel)]="formData.name"
              name="name"
              required
              placeholder="Kapcsolattartó neve"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          <!-- Email -->
          <div>
            <label for="email" class="block text-xs font-medium text-gray-700 mb-1">E-mail</label>
            <input
              type="email"
              id="email"
              [(ngModel)]="formData.email"
              name="email"
              placeholder="pelda@email.hu"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          <!-- Telefon -->
          <div>
            <label for="phone" class="block text-xs font-medium text-gray-700 mb-1">Telefon</label>
            <input
              type="tel"
              id="phone"
              [(ngModel)]="formData.phone"
              name="phone"
              placeholder="+36 30 123 4567"
              class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent placeholder:text-gray-400"
            />
          </div>

          <!-- Elsődleges -->
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              [(ngModel)]="formData.isPrimary"
              name="isPrimary"
              class="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary-light"
            />
            <span class="text-sm text-gray-700">Elsődleges kapcsolattartó</span>
          </label>

          <!-- Error message -->
          @if (errorMessage()) {
            <div class="px-3 py-2 bg-red-50 border border-red-200 rounded-md text-xs text-red-600">
              {{ errorMessage() }}
            </div>
          }

          <!-- Actions -->
          <div class="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              class="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors"
              (click)="close.emit()"
            >Mégse</button>
            <button
              type="submit"
              class="px-3 py-1.5 bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors flex items-center gap-1.5"
              [disabled]="saving() || !formData.name"
            >
              @if (saving()) {
                <span class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Mentés...
              } @else {
                {{ isEditing ? 'Mentés' : 'Hozzáadás' }}
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [``],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactEditorModalComponent {
  private readonly marketerService = inject(MarketerService);
  private readonly destroyRef = inject(DestroyRef);

  /** Backdrop handler a kijelölés közbeni bezárás megelőzéséhez */
  readonly backdropHandler = createBackdropHandler(() => this.close.emit());

  readonly projectId = input.required<number>();
  readonly contact = input<ProjectContact | null>(null);
  readonly close = output<void>();
  readonly saved = output<ProjectContact>();

  saving = signal(false);
  errorMessage = signal<string | null>(null);

  formData = {
    name: '',
    email: '',
    phone: '',
    isPrimary: false
  };

  get isEditing(): boolean {
    const contact = this.contact();
    return contact !== null && contact.id !== undefined;
  }

  ngOnInit(): void {
    const contact = this.contact();
    if (contact) {
      this.formData = {
        name: contact.name,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        isPrimary: contact.isPrimary ?? false
      };
    }
  }

  onSubmit(): void {
    if (!this.formData.name.trim()) {
      this.errorMessage.set('A név megadása kötelező');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    const contactData = {
      name: this.formData.name.trim(),
      email: this.formData.email.trim() || null,
      phone: this.formData.phone.trim() || null,
      isPrimary: this.formData.isPrimary
    };

    const contact = this.contact();
    if (this.isEditing && contact?.id) {
      this.marketerService.updateContact(this.projectId(), contact.id, contactData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.saving.set(false);
            this.saved.emit(response.data);
          },
          error: (err) => {
            this.saving.set(false);
            this.errorMessage.set(err.error?.message ?? 'Hiba történt a mentés során');
          }
        });
    } else {
      this.marketerService.addContact(this.projectId(), contactData)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response) => {
            this.saving.set(false);
            this.saved.emit(response.data);
          },
          error: (err) => {
            this.saving.set(false);
            this.errorMessage.set(err.error?.message ?? 'Hiba történt a mentés során');
          }
        });
    }
  }
}
