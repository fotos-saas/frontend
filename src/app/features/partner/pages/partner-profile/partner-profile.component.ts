import { Component, ChangeDetectionStrategy, inject, signal, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PsInputComponent } from '@shared/components/form';
import { ICONS } from '@shared/constants/icons.constants';
import { AuthService } from '@core/services/auth.service';
import { PartnerProfileService } from '../../services/partner-profile.service';

@Component({
  selector: 'app-partner-profile',
  standalone: true,
  imports: [ReactiveFormsModule, LucideAngularModule, PsInputComponent],
  templateUrl: './partner-profile.component.html',
  styleUrl: './partner-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartnerProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly profileService = inject(PartnerProfileService);
  private readonly authService = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  // State
  readonly loading = signal(true);
  readonly savingProfile = signal(false);
  readonly savingPassword = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly profileSuccess = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);

  // Profil form
  readonly profileForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
  });

  // Jelszócsere form
  readonly passwordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.profileService.getProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.profileForm.patchValue({
            name: res.data.name,
            email: res.data.email,
          });
          this.profileForm.markAsPristine();
          this.loading.set(false);
        },
        error: () => {
          // Fallback: AuthService-ből betöltjük
          const user = this.authService.getCurrentUser();
          if (user) {
            this.profileForm.patchValue({
              name: user.name,
              email: user.email ?? '',
            });
            this.profileForm.markAsPristine();
          }
          this.loading.set(false);
        },
      });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) return;

    this.savingProfile.set(true);
    this.profileError.set(null);
    this.profileSuccess.set(null);

    const data = this.profileForm.getRawValue();

    this.profileService.updateProfile(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.savingProfile.set(false);
          this.profileSuccess.set('Profil sikeresen frissítve!');
          this.profileForm.markAsPristine();

          // AuthService currentUser frissítése
          this.authService.updateCurrentUser({
            name: res.data.name,
            email: res.data.email,
          });
        },
        error: (err) => {
          this.savingProfile.set(false);
          this.profileError.set(
            err.error?.message || 'Hiba történt a mentés során.'
          );
        },
      });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.savingPassword()) return;

    this.savingPassword.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(null);

    const data = this.passwordForm.getRawValue();

    this.profileService.changePassword(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.savingPassword.set(false);
          this.passwordSuccess.set(res.message || 'Jelszó sikeresen módosítva!');
          this.passwordForm.reset();
        },
        error: (err) => {
          this.savingPassword.set(false);
          this.passwordError.set(
            err.error?.message || 'Hiba történt a jelszó módosítása során.'
          );
        },
      });
  }
}
