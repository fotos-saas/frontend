import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ICONS } from '@shared/constants/icons.constants';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderSuccessComponent implements OnInit {
  private route = inject(ActivatedRoute);
  readonly ICONS = ICONS;

  orderNumber = signal('');

  ngOnInit(): void {
    this.orderNumber.set(this.route.snapshot.queryParamMap.get('order') ?? '');
  }
}
