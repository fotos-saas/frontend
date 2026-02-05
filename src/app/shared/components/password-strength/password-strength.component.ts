import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
interface PasswordRequirement {
  label: string;
  validator: (password: string) => boolean;
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [],
  templateUrl: './password-strength.component.html',
  styleUrls: ['./password-strength.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PasswordStrengthComponent {
  password = input<string>('');
  compact = input<boolean>(false);

  requirements: PasswordRequirement[] = [
    { label: 'Legalább 8 karakter', validator: (p) => p.length >= 8 },
    { label: 'Legalább 1 nagybetű', validator: (p) => /[A-Z]/.test(p) },
    { label: 'Legalább 1 kisbetű', validator: (p) => /[a-z]/.test(p) },
    { label: 'Legalább 1 szám', validator: (p) => /[0-9]/.test(p) },
    { label: 'Legalább 1 speciális karakter', validator: (p) => /[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\\/~`]/.test(p) }
  ];

  metCount = computed(() => {
    const pwd = this.password();
    return this.requirements.filter(r => r.validator(pwd)).length;
  });

  strengthPercent = computed(() => {
    const count = this.metCount();
    return (count / this.requirements.length) * 100;
  });

  strengthClass = computed(() => {
    const count = this.metCount();
    if (count <= 1) return 'weak';
    if (count <= 2) return 'fair';
    if (count <= 4) return 'good';
    return 'strong';
  });

  strengthLabel = computed(() => {
    const count = this.metCount();
    if (count <= 1) return 'Gyenge';
    if (count <= 2) return 'Közepes';
    if (count <= 4) return 'Jó';
    return 'Erős';
  });

  isValid = computed(() => {
    return this.metCount() === this.requirements.length;
  });
}
