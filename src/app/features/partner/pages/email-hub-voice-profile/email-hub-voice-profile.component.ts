import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule } from 'lucide-angular';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ICONS } from '@shared/constants/icons.constants';
import { EmailHubService } from '../../services/email-hub.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { createResourceLoader } from '@shared/utils/resource-loader.util';
import type { VoiceProfile } from '../../models/email-hub.models';

@Component({
  selector: 'app-email-hub-voice-profile',
  standalone: true,
  imports: [LucideAngularModule, MatTooltipModule],
  templateUrl: './email-hub-voice-profile.component.html',
  styleUrl: './email-hub-voice-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailHubVoiceProfileComponent implements OnInit {
  private service = inject(EmailHubService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggerService);
  private rl = createResourceLoader(this.destroyRef);

  readonly ICONS = ICONS;
  readonly Math = Math;
  readonly loading = this.rl.loading;
  readonly rebuilding = signal(false);
  readonly profile = signal<VoiceProfile | null>(null);

  ngOnInit(): void {
    this.loadProfile();
  }

  private loadProfile(): void {
    this.rl.load(
      this.service.getVoiceProfile(),
      (data) => this.profile.set(data),
      'Voice profile betöltési hiba',
    );
  }

  rebuild(): void {
    this.rebuilding.set(true);
    this.service.rebuildVoiceProfile()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toast.success('Elindítva', 'Profil újragenerálás folyamatban — néhány perc alatt elkészül');
          this.rebuilding.set(false);
        },
        error: (err) => {
          this.toast.error('Hiba', 'Nem sikerült az újragenerálás');
          this.logger.error('Voice profile rebuild hiba', err);
          this.rebuilding.set(false);
        },
      });
  }

  formalityEntries(): { email: string; formality: string; confidence: number }[] {
    const map = this.profile()?.formalityMap;
    if (!map) return [];
    return Object.entries(map).map(([email, data]) => ({
      email,
      formality: data.formality,
      confidence: data.confidence,
    }));
  }

  formalityLabel(value: string): string {
    return value === 'informal' ? 'Tegez' : value === 'formal' ? 'Magáz' : 'Vegyes';
  }

  formatDate(date: string | null): string {
    if (!date) return 'Még nem készült';
    return new Date(date).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
}
