import { Component, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-print-shop-projects',
  standalone: true,
  imports: [LucideAngularModule],
  templateUrl: './print-shop-projects.component.html',
  styleUrls: ['./print-shop-projects.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrintShopProjectsComponent {}
