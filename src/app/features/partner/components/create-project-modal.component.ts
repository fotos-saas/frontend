import { Component, Output, EventEmitter, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { PartnerService, PartnerProjectListItem, SchoolItem, ProjectContact, CreateProjectRequest } from '../services/partner.service';
import { AddSchoolModalComponent } from './add-school-modal.component';
import { AddContactModalComponent } from './add-contact-modal.component';
import { ICONS } from '../../../shared/constants/icons.constants';
import { createBackdropHandler } from '../../../shared/utils/dialog.util';

/**
 * Create Project Modal - Új projekt létrehozása.
 */
@Component({
  selector: 'app-create-project-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AddSchoolModalComponent, AddContactModalComponent],
  template: `
    <div class="dialog-backdrop" (mousedown)="backdropHandler.onMouseDown($event)" (click)="backdropHandler.onClick($event)">
      <div class="dialog-panel dialog-panel--md" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="modal-header">
          <div class="header-icon">
            <lucide-icon [name]="ICONS.FOLDER_PLUS" [size]="24" />
          </div>
          <h2>Új projekt létrehozása</h2>
          <p class="subtitle">Add meg a projekt alapadatait</p>
        </div>

        <!-- Content -->
        <form class="modal-content" (ngSubmit)="onSubmit()">
          <!-- Iskola kiválasztás -->
          <div class="form-group">
            <label class="form-label">Iskola</label>
            <div class="school-input-wrapper">
              <div class="school-search">
                <lucide-icon [name]="ICONS.SEARCH" [size]="16" class="search-icon" />
                <input
                  type="text"
                  placeholder="Keress iskola név vagy város alapján..."
                  [(ngModel)]="schoolSearch"
                  name="schoolSearch"
                  (input)="onSchoolSearch()"
                  (focus)="onSchoolFocus()"
                  (blur)="onSchoolBlur($event)"
                  class="form-input"
                  autocomplete="off"
                />
                @if (selectedSchool) {
                  <button type="button" class="clear-school-btn" (click)="clearSchool()">
                    <lucide-icon [name]="ICONS.X" [size]="14" />
                  </button>
                }
              </div>

              <!-- Iskola dropdown -->
              @if (showSchoolDropdown && schoolsLoading()) {
                <div class="school-dropdown">
                  <div class="dropdown-loading">
                    <span class="dropdown-spinner"></span>
                    Betöltés...
                  </div>
                </div>
              } @else if (showSchoolDropdown && schools().length > 0) {
                <div class="school-dropdown">
                  @for (school of schools(); track school.id) {
                    <button
                      type="button"
                      class="school-option"
                      [class.school-option--selected]="selectedSchool?.id === school.id"
                      (mousedown)="selectSchool(school); $event.preventDefault()"
                    >
                      <span class="school-name">{{ school.name }}</span>
                      @if (school.city) {
                        <span class="school-city">{{ school.city }}</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>

            <button
              type="button"
              class="add-school-link"
              (click)="openAddSchoolModal()"
            >
              <lucide-icon [name]="ICONS.PLUS" [size]="14" />
              Új iskola hozzáadása
            </button>
          </div>

          <!-- Kapcsolattartó -->
          <div class="form-group">
            <label class="form-label">Kapcsolattartó</label>
            <div class="contact-input-wrapper">
              <div class="contact-search">
                <lucide-icon [name]="ICONS.SEARCH" [size]="16" class="search-icon" />
                <input
                  type="text"
                  placeholder="Keress kapcsolattartó név, email vagy telefon alapján..."
                  [(ngModel)]="contactSearch"
                  name="contactSearch"
                  (input)="onContactSearch()"
                  (focus)="onContactFocus()"
                  (blur)="onContactBlur($event)"
                  class="form-input"
                  autocomplete="off"
                />
                @if (selectedContact) {
                  <button type="button" class="clear-contact-btn" (click)="clearContact()">
                    <lucide-icon [name]="ICONS.X" [size]="14" />
                  </button>
                }
              </div>

              <!-- Kapcsolattartó dropdown -->
              @if (showContactDropdown && contactsLoading()) {
                <div class="contact-dropdown">
                  <div class="dropdown-loading">
                    <span class="dropdown-spinner"></span>
                    Betöltés...
                  </div>
                </div>
              } @else if (showContactDropdown && contacts().length > 0) {
                <div class="contact-dropdown">
                  @for (contact of contacts(); track contact.id) {
                    <button
                      type="button"
                      class="contact-option"
                      [class.contact-option--selected]="selectedContact?.id === contact.id"
                      (mousedown)="selectContact(contact); $event.preventDefault()"
                    >
                      <span class="contact-name">{{ contact.name }}</span>
                      @if (contact.email || contact.phone) {
                        <span class="contact-details">{{ contact.email }}{{ contact.email && contact.phone ? ' · ' : '' }}{{ contact.phone }}</span>
                      }
                    </button>
                  }
                </div>
              }
            </div>

            <button
              type="button"
              class="add-contact-link"
              (click)="openAddContactModal()"
            >
              <lucide-icon [name]="ICONS.PLUS" [size]="14" />
              Új kapcsolattartó hozzáadása
            </button>
          </div>

          <!-- Osztály és Évfolyam (egy sorban) -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Osztály neve</label>
              <input
                type="text"
                placeholder="pl. 12.A"
                [(ngModel)]="formData.class_name"
                name="className"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Évfolyam</label>
              <input
                type="text"
                placeholder="pl. 2024"
                [(ngModel)]="formData.class_year"
                name="classYear"
                class="form-input"
              />
            </div>
          </div>

          <!-- Dátumok (egy sorban) -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fotózás dátuma</label>
              <input
                type="date"
                [(ngModel)]="formData.photo_date"
                name="photoDate"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Határidő</label>
              <input
                type="date"
                [(ngModel)]="formData.deadline"
                name="deadline"
                class="form-input"
              />
            </div>
          </div>

          @if (error()) {
            <div class="error-message">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
              {{ error() }}
            </div>
          }

          <!-- Actions -->
          <div class="form-actions">
            <button
              type="button"
              class="btn-secondary"
              (click)="close.emit()"
              [disabled]="submitting()"
            >
              Mégse
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="submitting()"
            >
              @if (submitting()) {
                <span class="spinner"></span>
                Létrehozás...
              } @else {
                <lucide-icon [name]="ICONS.CHECK" [size]="18" />
                Projekt létrehozása
              }
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Add School Modal -->
    @if (showAddSchoolModal()) {
      <app-add-school-modal
        (close)="closeAddSchoolModal()"
        (schoolCreated)="onSchoolCreated($event)"
      />
    }

    <!-- Add Contact Modal -->
    @if (showAddContactModal()) {
      <app-add-contact-modal
        (close)="closeAddContactModal()"
        (contactCreated)="onContactCreated($event)"
      />
    }
  `,
  styles: [`
    /* Modal Header */
    .modal-header {
      text-align: center;
      padding: 24px 24px 0;
    }

    .header-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-primary, #1e3a5f);
      border-radius: 16px;
      color: #ffffff;
      margin: 0 auto 16px;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0 0 4px 0;
    }

    .subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    /* Modal Content */
    .modal-content {
      padding: 24px;
    }

    /* Form Elements */
    .form-group {
      margin-bottom: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 6px;
    }

    .form-input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.9375rem;
      transition: all 0.15s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    /* School Input */
    .school-input-wrapper {
      position: relative;
    }

    .school-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .school-search .search-icon {
      position: absolute;
      left: 12px;
      color: #9ca3af;
    }

    .school-search .form-input {
      padding-left: 36px;
      padding-right: 36px;
    }

    .clear-school-btn {
      position: absolute;
      right: 12px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      border: none;
      border-radius: 50%;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clear-school-btn:hover {
      background: #d1d5db;
      color: #374151;
    }

    .school-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
    }

    .school-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .school-option:hover {
      background: #f3f4f6;
    }

    .school-option--selected {
      background: #eff6ff;
    }

    .school-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1f2937;
    }

    .school-city {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .add-school-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 0;
      background: none;
      border: none;
      font-size: 0.8125rem;
      color: var(--color-primary, #1e3a5f);
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .add-school-link:hover {
      color: var(--color-primary-dark, #152a45);
      text-decoration: underline;
    }

    /* Contact Input */
    .contact-input-wrapper {
      position: relative;
    }

    .contact-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .contact-search .search-icon {
      position: absolute;
      left: 12px;
      color: #9ca3af;
    }

    .contact-search .form-input {
      padding-left: 36px;
      padding-right: 36px;
    }

    .clear-contact-btn {
      position: absolute;
      right: 12px;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #e5e7eb;
      border: none;
      border-radius: 50%;
      color: #6b7280;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clear-contact-btn:hover {
      background: #d1d5db;
      color: #374151;
    }

    .contact-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      margin-top: 4px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
    }

    .contact-option {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      width: 100%;
      padding: 10px 12px;
      background: none;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .contact-option:hover {
      background: #f3f4f6;
    }

    .contact-option--selected {
      background: #eff6ff;
    }

    .contact-name {
      font-size: 0.875rem;
      font-weight: 500;
      color: #1f2937;
    }

    .contact-details {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .add-contact-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      padding: 0;
      background: none;
      border: none;
      font-size: 0.8125rem;
      color: var(--color-primary, #1e3a5f);
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .add-contact-link:hover {
      color: var(--color-primary-dark, #152a45);
      text-decoration: underline;
    }

    /* Error */
    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 0.875rem;
      margin-bottom: 16px;
    }

    /* Actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--color-primary, #1e3a5f);
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #ffffff;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #152a45);
    }

    .btn-primary:disabled,
    .btn-secondary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Dropdown loading */
    .dropdown-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .dropdown-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e5e7eb;
      border-top-color: var(--color-primary, #1e3a5f);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 480px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProjectModalComponent {
  readonly ICONS = ICONS;

  /** Backdrop kezelő - megakadályozza a véletlen bezárást szöveg kijelöléskor */
  backdropHandler = createBackdropHandler(() => this.close.emit());

  @Output() close = new EventEmitter<void>();
  @Output() projectCreated = new EventEmitter<PartnerProjectListItem>();

  private partnerService = inject(PartnerService);
  private destroyRef = inject(DestroyRef);

  schools = signal<SchoolItem[]>([]);
  contacts = signal<ProjectContact[]>([]);
  schoolsLoading = signal(false);
  contactsLoading = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);
  showAddSchoolModal = signal(false);
  showAddContactModal = signal(false);

  schoolSearch = '';
  showSchoolDropdown = false;
  selectedSchool: SchoolItem | null = null;

  contactSearch = '';
  showContactDropdown = false;
  selectedContact: ProjectContact | null = null;

  formData: CreateProjectRequest = {
    school_id: null,
    class_name: null,
    class_year: null,
    photo_date: null,
    deadline: null,
    contact_name: null,
    contact_email: null,
    contact_phone: null,
  };

  private schoolSearchTimeout: ReturnType<typeof setTimeout> | null = null;
  private contactSearchTimeout: ReturnType<typeof setTimeout> | null = null;

  onSchoolFocus(): void {
    this.showSchoolDropdown = true;
    // Ha még nincs betöltve a lista, töltsd be
    if (this.schools().length === 0) {
      this.loadSchools();
    }
  }

  onSchoolBlur(event: FocusEvent): void {
    // Ha a dropdown-ra kattintottak, ne zárd be
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('.school-dropdown')) {
      return;
    }
    this.showSchoolDropdown = false;
  }

  onContactFocus(): void {
    this.showContactDropdown = true;
    // Ha még nincs betöltve a lista, töltsd be
    if (this.contacts().length === 0) {
      this.loadContacts();
    }
  }

  onContactBlur(event: FocusEvent): void {
    // Ha a dropdown-ra kattintottak, ne zárd be
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget?.closest('.contact-dropdown')) {
      return;
    }
    this.showContactDropdown = false;
  }

  onSchoolSearch(): void {
    if (this.schoolSearchTimeout) {
      clearTimeout(this.schoolSearchTimeout);
    }

    this.schoolSearchTimeout = setTimeout(() => {
      this.loadSchools();
    }, 300);
  }

  onContactSearch(): void {
    if (this.contactSearchTimeout) {
      clearTimeout(this.contactSearchTimeout);
    }

    this.contactSearchTimeout = setTimeout(() => {
      this.loadContacts();
    }, 300);
  }

  private loadContacts(): void {
    this.contactsLoading.set(true);
    this.partnerService.getAllContacts(this.contactSearch || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (contacts) => {
          this.contacts.set(contacts);
          this.contactsLoading.set(false);
          this.showContactDropdown = true;
        },
        error: () => {
          this.contacts.set([]);
          this.contactsLoading.set(false);
        }
      });
  }

  selectContact(contact: ProjectContact): void {
    this.selectedContact = contact;
    this.formData.contact_name = contact.name;
    this.formData.contact_email = contact.email;
    this.formData.contact_phone = contact.phone;
    this.contactSearch = contact.name + (contact.email ? ` (${contact.email})` : '');
    this.showContactDropdown = false;
  }

  private loadSchools(): void {
    this.schoolsLoading.set(true);
    this.partnerService.getAllSchools(this.schoolSearch || undefined)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (schools) => {
          this.schools.set(schools);
          this.schoolsLoading.set(false);
          this.showSchoolDropdown = true;
        },
        error: () => {
          this.schools.set([]);
          this.schoolsLoading.set(false);
        }
      });
  }

  selectSchool(school: SchoolItem): void {
    this.selectedSchool = school;
    this.formData.school_id = school.id;
    this.schoolSearch = school.name + (school.city ? ` (${school.city})` : '');
    this.showSchoolDropdown = false;
  }

  clearSchool(): void {
    this.selectedSchool = null;
    this.formData.school_id = null;
    this.schoolSearch = '';
  }

  openAddSchoolModal(): void {
    this.showSchoolDropdown = false;
    this.showAddSchoolModal.set(true);
  }

  closeAddSchoolModal(): void {
    this.showAddSchoolModal.set(false);
  }

  onSchoolCreated(school: SchoolItem): void {
    this.closeAddSchoolModal();
    this.selectSchool(school);
  }

  openAddContactModal(): void {
    this.showAddContactModal.set(true);
  }

  closeAddContactModal(): void {
    this.showAddContactModal.set(false);
  }

  onContactCreated(contact: ProjectContact): void {
    this.closeAddContactModal();
    this.selectContact(contact);
  }

  clearContact(): void {
    this.selectedContact = null;
    this.formData.contact_name = null;
    this.formData.contact_email = null;
    this.formData.contact_phone = null;
    this.contactSearch = '';
  }

  onSubmit(): void {
    this.error.set(null);
    this.submitting.set(true);

    this.partnerService.createProject(this.formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.submitting.set(false);
          this.projectCreated.emit(response.data);
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(err.error?.message ?? 'Hiba történt a projekt létrehozása során');
        }
      });
  }

}
