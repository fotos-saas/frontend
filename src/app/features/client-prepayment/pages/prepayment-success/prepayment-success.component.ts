import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';
import { PrepaymentPublicService, PrepaymentSuccessData } from '../../prepayment-public.service';

type SuccessState = 'loading' | 'success' | 'error';

@Component({
  selector: 'app-prepayment-success',
  standalone: true,
  imports: [DecimalPipe, LucideAngularModule],
  templateUrl: './prepayment-success.component.html',
  styleUrl: './prepayment-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrepaymentSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private prepaymentService = inject(PrepaymentPublicService);
  readonly ICONS = ICONS;

  state = signal<SuccessState>('loading');
  data = signal<PrepaymentSuccessData | null>(null);
  errorMessage = signal('');

  private token = '';

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') ?? '';
    if (!this.token) {
      this.state.set('error');
      this.errorMessage.set('Hiányzó vagy hibás hivatkozás.');
      return;
    }
    this.loadSuccess();
  }

  private loadSuccess(): void {
    this.state.set('loading');

    this.prepaymentService
      .getSuccess(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          this.data.set(res.data);
          this.state.set('success');
        },
        error: (err) => {
          this.state.set('error');
          this.errorMessage.set(err.error?.message || 'Nem sikerült betölteni a befizetés adatait.');
        },
      });
  }
}
