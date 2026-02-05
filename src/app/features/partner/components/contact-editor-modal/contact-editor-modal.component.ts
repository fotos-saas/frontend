import { Component, EventEmitter, Input, Output, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { PartnerService, ProjectContact } from '../../services/partner.service';
import { createBackdropHandler } from '../../../../shared/utils/dialog.util';
import { formatHungarianPhone, validatePhone } from '../../../../shared/utils/phone-formatter.util';

/**
 * Partner Contact Editor Modal - Kapcsolattartó hozzáadása/szerkesztése.
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
              class="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent placeholder:text-gray-400"
              [class.border-gray-300]="!phoneError()"
              [class.border-red-400]="phoneError()"
              (input)="formatPhone($event)"
              (paste)="formatPhone($event)"
            />
            @if (phoneError()) {
              <p class="mt-1 text-xs text-red-500">{{ phoneError() }}</p>
            }
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
              [disabled]="saving() || !formData.name || phoneError()"
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
  styles: [``]
})
export class ContactEditorModalComponent implements OnInit {
  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);

  @Input() projectId!: number;
  @Input() contact: ProjectContact | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProjectContact>();

  /** Backdrop kezelő - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  backdropHandler = createBackdropHandler(() => this.close.emit());

  saving = signal(false);
  errorMessage = signal<string | null>(null);
  phoneError = signal<string | null>(null);

  formData = {
    name: '',
    email: '',
    phone: '',
    isPrimary: false
  };

  /** Telefon formázás és tisztítás (input + paste kezelés) */
  formatPhone(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatHungarianPhone(input.value);

    this.formData.phone = formatted;
    input.value = formatted;

    this.runPhoneValidation();
  }

  /** Telefon validáció */
  private runPhoneValidation(): void {
    const result = validatePhone(this.formData.phone);
    this.phoneError.set(result.error ?? null);
  }

  get isEditing(): boolean {
    return this.contact !== null && this.contact.id !== undefined;
  }

  ngOnInit(): void {
    if (this.contact) {
      this.formData = {
        name: this.contact.name,
        email: this.contact.email ?? '',
        phone: this.contact.phone ?? '',
        isPrimary: this.contact.isPrimary ?? false
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

    if (this.isEditing && this.contact?.id) {
      this.partnerService.updateContact(this.projectId, this.contact.id, contactData).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
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
      this.partnerService.addContact(this.projectId, contactData).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe({
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
