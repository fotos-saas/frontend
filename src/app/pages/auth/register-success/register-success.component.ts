import { Component, inject, signal, OnInit, ChangeDetectionStrategy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthLayoutComponent } from '../../../shared/components/auth-layout/auth-layout.component';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '../../../shared/constants/icons.constants';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-register-success',
  standalone: true,
  imports: [
    RouterModule,
    AuthLayoutComponent,
    LucideAngularModule,
  ],
  template: `
    <app-auth-layout>
      <div class="w-full max-w-md">
        <div class="bg-white rounded-2xl shadow-2xl p-8 text-center">
          @if (isLoading()) {
            <div class="py-8">
              <div class="w-16 h-16 mx-auto mb-4 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p class="text-gray-600">Regisztráció véglegesítése...</p>
            </div>
          } @else if (error()) {
            <div class="py-4">
              <div class="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <lucide-icon [name]="ICONS.X_CIRCLE" [size]="32" class="text-red-600" />
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Hiba történt</h1>
              <p class="text-gray-600 mb-6">{{ error() }}</p>
              <a
                routerLink="/register-app"
                class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition"
              >
                <lucide-icon [name]="ICONS.ARROW_LEFT" [size]="18" />
                Próbáld újra
              </a>
            </div>
          } @else {
            <div class="py-4">
              <div class="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <lucide-icon [name]="ICONS.CHECK_CIRCLE" [size]="32" class="text-green-600" />
              </div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Sikeres regisztráció!</h1>
              <p class="text-gray-600 mb-6">
                A fiókod aktiválva van. Most már bejelentkezhetsz és elkezdheted használni a TablóStúdiót.
              </p>
              <a
                routerLink="/login"
                class="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition"
              >
                Bejelentkezés
                <lucide-icon [name]="ICONS.ARROW_RIGHT" [size]="18" />
              </a>
            </div>
          }
        </div>
      </div>
    </app-auth-layout>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterSuccessComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  readonly ICONS = ICONS;

  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');

    if (!sessionId) {
      this.error.set('Érvénytelen munkamenet.');
      this.isLoading.set(false);
      return;
    }

    // Complete the registration
    this.http.post<{ message: string }>(
      `${environment.apiUrl}/subscription/complete`,
      { session_id: sessionId }
    ).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        const message = err.error?.message || 'Hiba történt a regisztráció véglegesítésekor.';

        // If already registered, show success anyway
        if (err.error?.already_registered) {
          this.error.set(null);
        } else {
          this.error.set(message);
        }
      }
    });
  }
}
