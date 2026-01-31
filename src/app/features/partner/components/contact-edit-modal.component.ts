import { Component, Input, Output, EventEmitter, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, Subject, switchMap, of } from 'rxjs';
import { PartnerService, ContactListItem, ProjectAutocompleteItem } from '../services/partner.service';
import { createBackdropHandler } from '../../../shared/utils/dialog.util';
import { formatHungarianPhone, validatePhone } from '../../../shared/utils/phone-formatter.util';
import { ICONS } from '../../../shared/constants/icons.constants';

/**
 * Contact Edit Modal - Kapcsolattartó létrehozása/szerkesztése.
 * Tartalmaz projekt autocomplete dropdown-t is.
 */
@Component({
  selector: 'app-contact-edit-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div
      class="dialog-backdrop"
      (mousedown)="backdropHandler.onMouseDown($event)"
      (click)="backdropHandler.onClick($event)"
    >
      <div class="dialog-panel dialog-panel--md" (click)="$event.stopPropagation()">
        <div class="modal-content">
        <header class="modal-header">
          <h2>{{ mode === 'create' ? 'Új kapcsolattartó' : 'Kapcsolattartó szerkesztése' }}</h2>
          <button class="close-btn" (click)="close.emit()">
            <lucide-icon [name]="ICONS.X" [size]="20" />
          </button>
        </header>

        <form (ngSubmit)="save()" class="modal-form">
          <div class="form-group">
            <label for="name">Név *</label>
            <input
              type="text"
              id="name"
              [(ngModel)]="name"
              name="name"
              required
              class="form-input"
              placeholder="Pl. Kovács János"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Email</label>
              <input
                type="email"
                id="email"
                [(ngModel)]="email"
                name="email"
                class="form-input"
                placeholder="email@example.com"
              />
            </div>

            <div class="form-group">
              <label for="phone">Telefon</label>
              <input
                type="tel"
                id="phone"
                [(ngModel)]="phone"
                name="phone"
                class="form-input"
                [class.form-input--error]="phoneError()"
                placeholder="+36 30 123 4567"
                (input)="onPhoneInput($event)"
                (paste)="onPhoneInput($event)"
              />
              @if (phoneError()) {
                <span class="field-error">{{ phoneError() }}</span>
              }
            </div>
          </div>

          <div class="form-group">
            <label for="note">Megjegyzés</label>
            <textarea
              id="note"
              [(ngModel)]="note"
              name="note"
              class="form-input form-textarea"
              placeholder="Opcionális megjegyzés..."
              rows="2"
            ></textarea>
          </div>

          <!-- Projekt autocomplete -->
          <div class="form-group">
            <label for="project">Projekt *</label>
            <div class="autocomplete-container">
              <div class="autocomplete-input-wrapper">
                <lucide-icon [name]="ICONS.SEARCH" [size]="16" class="autocomplete-icon" />
                <input
                  type="text"
                  id="project"
                  [(ngModel)]="projectSearch"
                  name="projectSearch"
                  class="form-input autocomplete-input"
                  placeholder="Keresés iskola vagy osztály alapján..."
                  (focus)="onProjectInputFocus()"
                  (input)="onProjectSearch()"
                  autocomplete="off"
                />
                @if (selectedProject()) {
                  <button type="button" class="clear-project-btn" (click)="clearProject()">
                    <lucide-icon [name]="ICONS.X" [size]="14" />
                  </button>
                }
              </div>

              @if (showProjectDropdown() && projectOptions().length > 0) {
                <div class="autocomplete-dropdown">
                  @for (project of projectOptions(); track project.id) {
                    <button
                      type="button"
                      class="autocomplete-option"
                      [class.autocomplete-option--selected]="selectedProject()?.id === project.id"
                      (click)="selectProject(project)"
                    >
                      <div class="option-main">
                        <lucide-icon [name]="ICONS.FOLDER_OPEN" [size]="14" />
                        <span class="option-name">{{ project.name }}</span>
                      </div>
                      @if (project.schoolName) {
                        <span class="option-school">{{ project.schoolName }}</span>
                      }
                    </button>
                  }
                </div>
              }

              @if (showProjectDropdown() && projectOptions().length === 0 && !loadingProjects()) {
                <div class="autocomplete-dropdown">
                  <div class="autocomplete-empty">
                    <lucide-icon [name]="ICONS.SEARCH" [size]="16" />
                    Nincs találat
                  </div>
                </div>
              }

              @if (loadingProjects()) {
                <div class="autocomplete-dropdown">
                  <div class="autocomplete-loading">
                    <span class="spinner"></span>
                    Keresés...
                  </div>
                </div>
              }
            </div>

            @if (selectedProject()) {
              <div class="selected-project">
                <lucide-icon [name]="ICONS.CHECK" [size]="14" />
                <span>{{ selectedProject()!.name }}</span>
                @if (selectedProject()!.schoolName) {
                  <span class="selected-school">({{ selectedProject()!.schoolName }})</span>
                }
              </div>
            }
          </div>

          @if (errorMessage()) {
            <div class="error-message">
              <lucide-icon [name]="ICONS.ALERT_CIRCLE" [size]="16" />
              {{ errorMessage() }}
            </div>
          }

          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="close.emit()">
              Mégse
            </button>
            <button
              type="submit"
              class="btn-primary"
              [disabled]="saving() || !canSave()"
            >
              @if (saving()) {
                <span class="spinner"></span>
                Mentés...
              } @else {
                <lucide-icon [name]="ICONS.CHECK" [size]="16" />
                {{ mode === 'create' ? 'Létrehozás' : 'Mentés' }}
              }
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-content {
      padding: 1.5rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 16px;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 20px;
    }

    .modal-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: #1e293b;
      margin: 0;
    }

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
    }

    .close-btn:hover {
      background: #f1f5f9;
      color: #1e293b;
    }

    .modal-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-group label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
    }

    .form-input {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9375rem;
      transition: all 0.2s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary, #1e3a5f);
      box-shadow: 0 0 0 3px rgba(30, 58, 95, 0.1);
    }

    .form-textarea {
      resize: vertical;
      min-height: 60px;
      font-family: inherit;
    }

    .form-input--error {
      border-color: #f87171;
    }

    .field-error {
      display: block;
      margin-top: 4px;
      font-size: 0.75rem;
      color: #dc2626;
    }

    /* Autocomplete */
    .autocomplete-container {
      position: relative;
    }

    .autocomplete-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .autocomplete-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
      pointer-events: none;
    }

    .autocomplete-input {
      padding-left: 36px;
      padding-right: 36px;
    }

    .clear-project-btn {
      position: absolute;
      right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: #f1f5f9;
      border: none;
      border-radius: 4px;
      color: #64748b;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .clear-project-btn:hover {
      background: #e2e8f0;
      color: #1e293b;
    }

    .autocomplete-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      right: 0;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      z-index: 100;
      max-height: 200px;
      overflow-y: auto;
    }

    .autocomplete-option {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 12px;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      transition: background 0.1s ease;
    }

    .autocomplete-option:hover {
      background: #f8fafc;
    }

    .autocomplete-option--selected {
      background: #e0f2fe;
    }

    .autocomplete-option--selected:hover {
      background: #bae6fd;
    }

    .option-main {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1e293b;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .option-name {
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .option-school {
      font-size: 0.75rem;
      color: #64748b;
      padding-left: 22px;
    }

    .autocomplete-empty,
    .autocomplete-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 16px;
      color: #64748b;
      font-size: 0.875rem;
    }

    .selected-project {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 8px;
      padding: 8px 12px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 6px;
      color: #166534;
      font-size: 0.8125rem;
    }

    .selected-school {
      color: #22c55e;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #dc2626;
      font-size: 0.875rem;
    }

    .modal-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: var(--color-primary, #1e3a5f);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--color-primary-dark, #152a45);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .autocomplete-loading .spinner {
      border-color: rgba(100, 116, 139, 0.3);
      border-top-color: #64748b;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 480px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactEditModalComponent implements OnInit {
  private readonly partnerService = inject(PartnerService);
  private readonly destroyRef = inject(DestroyRef);

  @Input() contact: ContactListItem | null = null;
  @Input() mode: 'create' | 'edit' = 'create';
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ContactListItem>();

  readonly ICONS = ICONS;

  // Form fields
  name = '';
  email = '';
  phone = '';
  note = '';
  projectSearch = '';

  // State
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  phoneError = signal<string | null>(null);

  // Project autocomplete
  selectedProject = signal<ProjectAutocompleteItem | null>(null);
  projectOptions = signal<ProjectAutocompleteItem[]>([]);
  showProjectDropdown = signal(false);
  loadingProjects = signal(false);

  private searchSubject = new Subject<string>();

  backdropHandler = createBackdropHandler(() => this.close.emit());

  ngOnInit(): void {
    // Populate form if editing
    if (this.contact && this.mode === 'edit') {
      this.name = this.contact.name;
      this.email = this.contact.email ?? '';
      this.phone = this.contact.phone ?? '';
      this.note = this.contact.note ?? '';

      // Set selected project
      if (this.contact.projectId) {
        this.selectedProject.set({
          id: this.contact.projectId,
          name: this.contact.projectName ?? 'Projekt',
          schoolName: this.contact.schoolName ?? null
        });
        this.projectSearch = this.contact.projectName ?? '';
      }
    }

    // Setup project search with debounce
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(search => {
        if (!search.trim()) {
          return of([]);
        }
        this.loadingProjects.set(true);
        return this.partnerService.getProjectsAutocomplete(search);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (projects) => {
        this.projectOptions.set(projects);
        this.loadingProjects.set(false);
      },
      error: () => {
        this.loadingProjects.set(false);
      }
    });
  }

  canSave(): boolean {
    return this.name.trim().length > 0 && this.selectedProject() !== null && !this.phoneError();
  }

  /** Telefon formázás és validáció */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const formatted = formatHungarianPhone(input.value);

    this.phone = formatted;
    input.value = formatted;

    const result = validatePhone(formatted);
    this.phoneError.set(result.error ?? null);
  }

  onProjectInputFocus(): void {
    this.showProjectDropdown.set(true);
    if (!this.projectSearch.trim()) {
      // Load initial projects
      this.loadingProjects.set(true);
      this.partnerService.getProjectsAutocomplete('')
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (projects) => {
            this.projectOptions.set(projects);
            this.loadingProjects.set(false);
          },
          error: () => {
            this.loadingProjects.set(false);
          }
        });
    }
  }

  onProjectSearch(): void {
    this.showProjectDropdown.set(true);
    this.searchSubject.next(this.projectSearch);
  }

  selectProject(project: ProjectAutocompleteItem): void {
    this.selectedProject.set(project);
    this.projectSearch = project.name;
    this.showProjectDropdown.set(false);
  }

  clearProject(): void {
    this.selectedProject.set(null);
    this.projectSearch = '';
    this.projectOptions.set([]);
  }

  save(): void {
    if (!this.canSave() || this.saving()) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const data = {
      name: this.name.trim(),
      email: this.email.trim() || null,
      phone: this.phone.trim() || null,
      note: this.note.trim() || null,
      project_id: this.selectedProject()!.id
    };

    const request$ = this.mode === 'create'
      ? this.partnerService.createStandaloneContact(data)
      : this.partnerService.updateStandaloneContact(this.contact!.id, data);

    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response.success) {
          this.saved.emit(response.data);
        } else {
          this.errorMessage.set(response.message || 'Hiba történt a mentés során.');
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err.error?.message || 'Hiba történt a mentés során.');
      }
    });
  }
}
