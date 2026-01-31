import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthLayoutComponent } from '../../shared/components/auth-layout/auth-layout.component';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthLayoutComponent],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss']
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = signal(true);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  alreadyVerified = signal(false);

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    const hash = this.route.snapshot.paramMap.get('hash');

    if (!id || !hash) {
      this.isLoading.set(false);
      this.errorMessage.set('Érvénytelen verifikációs link.');
      return;
    }

    this.authService.verifyEmail(id, hash).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set(response.message);
        this.alreadyVerified.set(response.already_verified || false);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.message);
      }
    });
  }
}
