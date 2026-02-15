import { Component, output, inject, signal, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { TeamService, TeamRole } from '../../../services/team.service';
import { ICONS } from '../../../../../shared/constants/icons.constants';
import { DialogWrapperComponent } from '../../../../../shared/components/dialog-wrapper/dialog-wrapper.component';
import { PsInputComponent, PsRadioGroupComponent, PsRadioOption } from '@shared/components/form';

/**
 * Invite Dialog - Új csapattag meghívása
 */
@Component({
  selector: 'app-invite-dialog',
  standalone: true,
  imports: [FormsModule, LucideAngularModule, PsInputComponent, PsRadioGroupComponent, DialogWrapperComponent],
  templateUrl: './invite-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InviteDialogComponent {
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly teamService = inject(TeamService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  readonly roleOptions: PsRadioOption[] = this.teamService.roles.map(r => ({
    value: r.value,
    label: r.label,
    sublabel: r.description,
  }));

  email = '';
  selectedRole = signal<TeamRole>('designer');
  saving = signal(false);
  emailError = signal<string | null>(null);

  isValid(): boolean {
    return this.email.trim().length > 0 && this.isValidEmail(this.email);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSave(): void {
    // Validáció
    this.emailError.set(null);

    if (!this.email.trim()) {
      this.emailError.set('Az email cím megadása kötelező.');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.emailError.set('Érvénytelen email cím.');
      return;
    }

    this.saving.set(true);

    this.teamService.createInvitation({
      email: this.email.trim(),
      role: this.selectedRole()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          if (err.error?.message) {
            this.emailError.set(err.error.message);
          } else {
            this.emailError.set('Hiba történt a meghívó küldése során.');
          }
        }
      });
  }
}
